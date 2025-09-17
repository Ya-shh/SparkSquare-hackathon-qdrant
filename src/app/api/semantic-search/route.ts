import { NextRequest, NextResponse } from 'next/server';
import { 
  semanticSearchWithCategories, 
  multiVectorSearch, 
  hybridSemanticSearch,
  searchByContentType 
} from '../../../lib/semantic-search';

interface SemanticSearchRequest {
  query: string;
  category?: 'trending' | 'exciting' | 'deep-dive' | 'new' | 'top' | 'ai-recommended' | 'rising' | 'expert-picks';
  searchType?: 'semantic' | 'multi-vector' | 'hybrid' | 'content-type';
  limit?: number;
  scoreThreshold?: number;
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'all';
  categoryId?: string;
  filters?: any;
}

export async function POST(req: NextRequest) {
  try {
    const body: SemanticSearchRequest = await req.json();
    const {
      query,
      category = 'trending',
      searchType = 'semantic',
      limit = 15,
      scoreThreshold = 0.7,
      timeRange = 'all', // Use 'all' instead of 'week' for better results
      categoryId,
      filters = {}
    } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    let results: any[] = [];
    let searchMetadata: any = {};

    // Route to appropriate search function based on searchType
    switch (searchType) {
      case 'semantic':
        results = await semanticSearchWithCategories(query, category, {
          limit,
          scoreThreshold,
          filters,
          timeRange,
          categoryId
        });
        searchMetadata = {
          type: 'semantic',
          category,
          prompt: getCategoryPrompt(category, query)
        };
        break;

      case 'multi-vector':
        results = await multiVectorSearch(query, {
          limit,
          scoreThreshold,
          vectors: ['title', 'content', 'category', 'author'],
          fusionMethod: 'rrf'
        });
        searchMetadata = {
          type: 'multi-vector',
          vectors: ['title', 'content', 'category', 'author'],
          fusionMethod: 'rrf'
        };
        break;

      case 'hybrid':
        results = await hybridSemanticSearch(query, {
          limit,
          scoreThreshold,
          denseWeight: 0.7,
          sparseWeight: 0.3,
          filters
        });
        searchMetadata = {
          type: 'hybrid',
          denseWeight: 0.7,
          sparseWeight: 0.3
        };
        break;

      case 'content-type':
        results = await searchByContentType(query, category as any, {
          limit,
          scoreThreshold,
          topic: query
        });
        searchMetadata = {
          type: 'content-type',
          contentType: category
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid search type' },
          { status: 400 }
        );
    }

    // Enhance results with additional metadata
    const enhancedResults = results.map(result => ({
      ...result,
      searchType,
      category,
      timestamp: new Date().toISOString(),
      relevanceIndicators: generateRelevanceIndicators(result, query, category)
    }));

    // Generate search suggestions based on results
    const suggestions = generateSemanticSuggestions(query, results, category);

    return NextResponse.json({
      results: enhancedResults,
      suggestions,
      metadata: {
        query,
        category,
        searchType,
        count: enhancedResults.length,
        searchMetadata,
        filters: {
          timeRange,
          categoryId,
          scoreThreshold
        },
        timing: {
          searchedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error in semantic search API:', error);
    return NextResponse.json(
      {
        error: 'An error occurred during semantic search',
        results: [],
        suggestions: ['Try a different search term', 'Check your spelling', 'Use simpler keywords'],
        metadata: {
          query: '',
          count: 0,
          searchType: 'error'
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const category = searchParams.get('category') as any || 'trending';
    const searchType = searchParams.get('type') as any || 'semantic';
    const limit = parseInt(searchParams.get('limit') || '15');
    const scoreThreshold = parseFloat(searchParams.get('scoreThreshold') || '0.7');
    const timeRange = searchParams.get('timeRange') as any || 'all';
    const categoryId = searchParams.get('categoryId') || undefined;

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Use POST logic for GET requests
    const body: SemanticSearchRequest = {
      query,
      category,
      searchType,
      limit,
      scoreThreshold,
      timeRange,
      categoryId
    };

    return await POST(new NextRequest(req.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }));

  } catch (error) {
    console.error('Error in semantic search GET API:', error);
    return NextResponse.json(
      {
        error: 'An error occurred during semantic search',
        results: [],
        suggestions: ['Try a different search term', 'Check your spelling', 'Use simpler keywords'],
        metadata: {
          query: '',
          count: 0,
          searchType: 'error'
        }
      },
      { status: 500 }
    );
  }
}

// Helper functions

function getCategoryPrompt(category: string, query: string): string {
  const prompts = {
    trending: `What's buzzing right now in ${query}? Popular recent updates and viral discussions.`,
    exciting: `Thrilling, high-impact stories about ${query}. Edge-of-your-seat developments and breakthrough moments.`,
    'deep-dive': `Comprehensive, in-depth exploration of ${query}. Detailed analysis, research insights, and thorough explanations.`,
    new: `Latest developments and fresh perspectives on ${query}. Recent discoveries and emerging trends.`,
    top: `Highest quality content about ${query}. Best discussions, expert insights, and most valuable information.`,
    'ai-recommended': `AI-curated personalized content about ${query}. Intelligent recommendations based on user interests.`,
    rising: `Fast-growing discussions gaining momentum in ${query}. Emerging topics with increasing engagement.`,
    'expert-picks': `Expert-curated content about ${query}. Professional insights from verified specialists and thought leaders.`
  };
  
  return prompts[category as keyof typeof prompts] || prompts.trending;
}

function generateRelevanceIndicators(result: any, query: string, category: string) {
  const indicators = [];
  const queryLower = query.toLowerCase();
  
  // Basic relevance indicators
  if (result.title?.toLowerCase().includes(queryLower)) {
    indicators.push('title_match');
  }
  if (result.content?.toLowerCase().includes(queryLower)) {
    indicators.push('content_match');
  }
  if (result.categoryName?.toLowerCase().includes(queryLower)) {
    indicators.push('category_match');
  }
  if (result.userName?.toLowerCase().includes(queryLower) || result.username?.toLowerCase().includes(queryLower)) {
    indicators.push('author_match');
  }
  
  // Category-specific indicators
  if (category === 'trending' && result.trendingScore > 0.8) {
    indicators.push('high_trending');
  }
  if (category === 'exciting' && result.isHot) {
    indicators.push('high_engagement');
  }
  if (category === 'deep-dive' && result.content?.length > 500) {
    indicators.push('comprehensive');
  }
  if (category === 'expert-picks' && result.user?.role?.includes('Dr.')) {
    indicators.push('expert_verified');
  }
  
  // Score-based indicators
  if (result.score > 0.9) {
    indicators.push('excellent_match');
  } else if (result.score > 0.8) {
    indicators.push('high_match');
  } else if (result.score > 0.7) {
    indicators.push('good_match');
  }
  
  return indicators;
}

function generateSemanticSuggestions(query: string, results: any[], category: string): string[] {
  const suggestions: string[] = [];
  const queryLower = query.toLowerCase();
  
  // Category-specific suggestions
  const categorySuggestions = {
    trending: [
      'Try searching for current events',
      'Look for viral topics',
      'Check popular discussions'
    ],
    exciting: [
      'Search for breakthrough news',
      'Look for high-energy content',
      'Find thrilling developments'
    ],
    'deep-dive': [
      'Search for detailed analysis',
      'Look for research papers',
      'Find comprehensive guides'
    ],
    new: [
      'Search for recent updates',
      'Look for fresh perspectives',
      'Find latest developments'
    ],
    top: [
      'Search for best content',
      'Look for expert insights',
      'Find highest quality discussions'
    ],
    'ai-recommended': [
      'Try personalized searches',
      'Look for AI-curated content',
      'Find smart recommendations'
    ],
    rising: [
      'Search for emerging topics',
      'Look for growing discussions',
      'Find trending content'
    ],
    'expert-picks': [
      'Search for expert content',
      'Look for professional insights',
      'Find verified information'
    ]
  };
  
  // Add category-specific suggestions
  suggestions.push(...(categorySuggestions[category as keyof typeof categorySuggestions] || []));
  
  // Add result-based suggestions
  if (results.length > 0) {
    const highScoreResults = results.filter(r => r.score > 0.8);
    if (highScoreResults.length > 0) {
      const categories = Array.from(new Set(highScoreResults.map(r => r.categoryName).filter(Boolean)));
      if (categories.length > 0) {
        suggestions.push(`Related categories: ${categories.slice(0, 3).join(', ')}`);
      }
    }
  }
  
  // Add query-specific suggestions
  if (queryLower.includes('ai') || queryLower.includes('artificial')) {
    suggestions.push('Try: "Machine Learning", "Neural Networks", "AI Ethics"');
  }
  if (queryLower.includes('brain') || queryLower.includes('memory')) {
    suggestions.push('Try: "Neuroscience", "Cognitive Science", "Brain Health"');
  }
  if (queryLower.includes('quantum')) {
    suggestions.push('Try: "Quantum Computing", "Quantum Physics", "Qubits"');
  }
  
  return suggestions.slice(0, 5);
}
