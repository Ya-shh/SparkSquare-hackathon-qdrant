import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateSearchQueries, analyzeContentWithMistral } from '@/lib/mistral-llm';
import { vectorSearchWithFilters, hybridSearch } from '@/lib/qdrant';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    const {
      query,
      searchMode = 'enhanced',
      options = {},
      userContext = {}
    } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    const {
      limit = 10,
      scoreThreshold = 0.7,
      enableQueryEnhancement = true,
      enableSemanticExpansion = true,
      enableCrossModalSearch = true,
      categoryId,
      timeRange = 'all',
      sort = 'relevance'
    } = options;

    let searchResults: any[] = [];
    let searchMetadata: any = {
      originalQuery: query,
      searchMode,
      timestamp: new Date().toISOString(),
      userId: session?.user?.id
    };

    // Step 1: Enhance query using Mixtral-8x22B if enabled
    let enhancedQueries = [query];
    let queryEnhancementData: any = null;

    if (enableQueryEnhancement) {
      try {
        console.log('Enhancing query with Mixtral-8x22B...');
        queryEnhancementData = await generateSearchQueries(query, {
          previousQueries: userContext.previousQueries || [],
          userInterests: userContext.userInterests || [],
          searchMode: searchMode === 'broad' ? 'broad' : searchMode === 'creative' ? 'creative' : 'specific'
        });

        if (enableSemanticExpansion) {
          enhancedQueries = [
            ...queryEnhancementData.enhancedQueries,
            ...queryEnhancementData.semanticExpansions
          ];
        } else {
          enhancedQueries = queryEnhancementData.enhancedQueries;
        }

        searchMetadata.queryEnhancement = {
          applied: true,
          reasoning: queryEnhancementData.reasoning,
          generatedQueries: enhancedQueries.length,
          crossModalQueries: queryEnhancementData.crossModalQueries?.length || 0
        };

        console.log(`Generated ${enhancedQueries.length} enhanced queries`);
      } catch (error) {
        console.error('Query enhancement failed:', error);
        searchMetadata.queryEnhancement = {
          applied: false,
          error: 'Query enhancement unavailable',
          fallbackUsed: true
        };
      }
    }

    // Step 2: Perform searches with enhanced queries
    const searchPromises: Promise<any[]>[] = [];
    
    for (const enhancedQuery of enhancedQueries.slice(0, 3)) { // Limit to top 3 queries
      // Hybrid search for each enhanced query
      searchPromises.push(
        hybridSearch(enhancedQuery, {
          limit: Math.ceil(limit / enhancedQueries.length) + 2,
          scoreThreshold: scoreThreshold * 0.8, // Slightly lower threshold for enhanced queries
          filters: {
            ...(categoryId && { categoryId }),
            timeRange
          }
        }).catch(error => {
          console.error(`Search failed for query "${enhancedQuery}":`, error);
          return [];
        })
      );
    }

    // Step 3: Cross-modal search if enabled
    if (enableCrossModalSearch && queryEnhancementData?.crossModalQueries) {
      for (const crossModalQuery of queryEnhancementData.crossModalQueries.slice(0, 2)) {
        searchPromises.push(
          vectorSearchWithFilters({
            query: crossModalQuery,
            limit: Math.ceil(limit / 2),
            types: ['post', 'comment'],
            categoryId,
            timeRange,
            sort,
            scoreThreshold: scoreThreshold * 0.7
          }).catch(error => {
            console.error(`Cross-modal search failed for query "${crossModalQuery}":`, error);
            return [];
          })
        );
      }
    }

    // Execute all searches in parallel
    const allResults = await Promise.all(searchPromises);
    
    // Step 4: Combine and deduplicate results
    const combinedResults = allResults.flat();
    const resultMap = new Map();
    
    // Deduplicate by ID, keeping highest score
    combinedResults.forEach(result => {
      const id = result.id;
      if (!resultMap.has(id) || resultMap.get(id).score < result.score) {
        resultMap.set(id, {
          ...result,
          sources: resultMap.has(id) 
            ? [...(resultMap.get(id).sources || []), 'enhanced_search']
            : ['enhanced_search']
        });
      }
    });

    searchResults = Array.from(resultMap.values());

    // Step 5: Re-rank results using Mixtral-8x22B analysis (optional)
    if (searchResults.length > 0 && searchMode === 'intelligent') {
      try {
        searchResults = await rerankWithMistralAnalysis(query, searchResults, {
          userInterests: userContext.userInterests || [],
          limit
        });
        searchMetadata.reranking = {
          applied: true,
          method: 'mistral_analysis'
        };
      } catch (error) {
        console.error('Mistral reranking failed:', error);
        searchMetadata.reranking = {
          applied: false,
          error: 'Reranking failed'
        };
      }
    }

    // Step 6: Apply final sorting and limit
    if (sort === 'relevance') {
      searchResults.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (sort === 'new') {
      searchResults.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    searchResults = searchResults.slice(0, limit);

    // Step 7: Add result insights
    const resultInsights = generateResultInsights(searchResults, queryEnhancementData);

    return NextResponse.json({
      success: true,
      results: searchResults,
      metadata: {
        ...searchMetadata,
        resultCount: searchResults.length,
        enhancedQueriesUsed: enhancedQueries.length,
        insights: resultInsights,
        performance: {
          totalQueries: enhancedQueries.length + (queryEnhancementData?.crossModalQueries?.length || 0),
          averageScore: searchResults.length > 0 
            ? searchResults.reduce((sum, r) => sum + (r.score || 0), 0) / searchResults.length 
            : 0
        }
      }
    });

  } catch (error) {
    console.error('Enhanced search error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// Rerank results using Mixtral-8x22B content analysis
async function rerankWithMistralAnalysis(
  originalQuery: string,
  results: any[],
  context: { userInterests: string[]; limit: number }
): Promise<any[]> {
  try {
    const contentAnalysisPrompt = `Analyze and rerank the following search results for the query "${originalQuery}".

User Interests: ${context.userInterests.join(', ') || 'General'}

Results to rank:
${results.map((result, index) => 
  `${index + 1}. ID: ${result.id} | Title: ${result.title || 'No title'} | Score: ${(result.score || 0).toFixed(3)} | Content: ${(result.content || '').substring(0, 200)}...`
).join('\n')}

Provide a JSON response with:
- rankedIds: Array of result IDs in optimal order
- reasoning: Brief explanation of ranking decisions
- qualityScores: Object with ID -> quality score (0-1) mapping

Consider: relevance to query, content quality, user interests, and information value.
Return only valid JSON.`;

    const analysisResult = await analyzeContentWithMistral(contentAnalysisPrompt, 'categorize');
    
    try {
      const analysis = JSON.parse(analysisResult.content);
      const rankedIds = analysis.rankedIds || results.map(r => r.id);
      const qualityScores = analysis.qualityScores || {};

      // Reorder results based on Mistral analysis
      const rerankedResults = rankedIds
        .map((id: string) => {
          const result = results.find(r => r.id === id);
          if (result) {
            return {
              ...result,
              mistralQualityScore: qualityScores[id] || result.score,
              rerankingApplied: true
            };
          }
          return null;
        })
        .filter(Boolean)
        .slice(0, context.limit);

      // Add any missing results that weren't reranked
      const rankedIdSet = new Set(rankedIds);
      const missingResults = results
        .filter(r => !rankedIdSet.has(r.id))
        .slice(0, Math.max(0, context.limit - rerankedResults.length));

      return [...rerankedResults, ...missingResults];
    } catch (parseError) {
      console.error('Failed to parse Mistral reranking analysis:', parseError);
      return results;
    }
  } catch (error) {
    console.error('Mistral reranking analysis failed:', error);
    return results;
  }
}

// Generate insights about search results
function generateResultInsights(results: any[], queryData: any): any {
  const insights = {
    resultQuality: 'unknown',
    diversityScore: 0,
    averageRelevance: 0,
    topCategories: [] as string[],
    recommendations: [] as string[]
  };

  if (results.length === 0) {
    insights.recommendations.push('Try broader search terms or different keywords');
    return insights;
  }

  // Calculate average relevance
  insights.averageRelevance = results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length;

  // Determine result quality
  if (insights.averageRelevance > 0.8) {
    insights.resultQuality = 'excellent';
  } else if (insights.averageRelevance > 0.6) {
    insights.resultQuality = 'good';
  } else if (insights.averageRelevance > 0.4) {
    insights.resultQuality = 'moderate';
  } else {
    insights.resultQuality = 'low';
  }

  // Calculate diversity (unique categories)
  const categories = new Set(results.map(r => r.categoryName || r.category).filter(Boolean));
  insights.diversityScore = Math.min(categories.size / Math.min(results.length, 5), 1);
  insights.topCategories = Array.from(categories).slice(0, 5);

  // Generate recommendations
  if (insights.resultQuality === 'low') {
    insights.recommendations.push('Try using different keywords or synonyms');
  }
  if (insights.diversityScore < 0.3) {
    insights.recommendations.push('Results are concentrated in specific topics');
  }
  if (queryData?.enhancedQueries?.length > 0) {
    insights.recommendations.push('Query was enhanced using AI for better results');
  }

  return insights;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const mode = searchParams.get('mode') || 'enhanced';
  
  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    );
  }

  // Simple GET request - use basic enhancement
  try {
    const result = await hybridSearch(query, {
      limit: parseInt(searchParams.get('limit') || '10'),
      scoreThreshold: parseFloat(searchParams.get('threshold') || '0.7')
    });

    return NextResponse.json({
      success: true,
      results: result,
      metadata: {
        originalQuery: query,
        mode,
        enhancement: 'basic',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('GET enhanced search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
