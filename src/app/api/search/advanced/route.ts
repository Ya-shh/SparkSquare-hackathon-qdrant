import { NextRequest, NextResponse } from 'next/server';
import { 
  hybridSearch, 
  multiStageSearch,
  getIntelligentRecommendations,
  isQdrantReady 
} from '@/lib/qdrant';

interface AdvancedSearchRequest {
  query: string;
  searchType?: 'hybrid' | 'multistage' | 'recommendations';
  options?: {
    limit?: number;
    fusionMethod?: 'rrf' | 'dbsf';
    scoreThreshold?: number;
    filters?: any;
    enableSparse?: boolean;
    enableDense?: boolean;
    candidateLimit?: number;
    rescoreModel?: string;
    algorithm?: 'collaborative' | 'content' | 'hybrid';
    diversityThreshold?: number;
    enableDiversityFiltering?: boolean;
  };
  userId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: AdvancedSearchRequest = await req.json();
    const { query, searchType = 'hybrid', options = {}, userId } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Check Qdrant availability
    const qdrantReady = await isQdrantReady();
    if (!qdrantReady) {
      return NextResponse.json(
        { error: 'Advanced search service is temporarily unavailable' },
        { status: 503 }
      );
    }

    const startTime = Date.now();
    let results: any[] = [];
    let metadata: any = {};

    switch (searchType) {
      case 'hybrid':
        results = await hybridSearch(query, {
          limit: options.limit || 10,
          fusionMethod: options.fusionMethod || 'rrf',
          scoreThreshold: options.scoreThreshold || 0.7,
          filters: options.filters,
          enableSparse: options.enableSparse !== false,
          enableDense: options.enableDense !== false
        });
        metadata = {
          searchType: 'hybrid',
          fusionMethod: options.fusionMethod || 'rrf',
          scoreThreshold: options.scoreThreshold || 0.7,
          enableSparse: options.enableSparse !== false,
          enableDense: options.enableDense !== false
        };
        break;

      case 'multistage':
        results = await multiStageSearch(query, {
          limit: options.limit || 10,
          candidateLimit: options.candidateLimit || 100,
          filters: options.filters,
          rescoreModel: options.rescoreModel
        });
        metadata = {
          searchType: 'multistage',
          candidateLimit: options.candidateLimit || 100,
          rescoreModel: options.rescoreModel
        };
        break;

      case 'recommendations':
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required for recommendations' },
            { status: 400 }
          );
        }
        results = await getIntelligentRecommendations(userId, {
          limit: options.limit || 10,
          algorithm: options.algorithm || 'hybrid',
          diversityThreshold: options.diversityThreshold || 0.3,
          enableDiversityFiltering: options.enableDiversityFiltering !== false
        });
        metadata = {
          searchType: 'recommendations',
          algorithm: options.algorithm || 'hybrid',
          diversityThreshold: options.diversityThreshold || 0.3,
          enableDiversityFiltering: options.enableDiversityFiltering !== false
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid search type. Use "hybrid", "multistage", or "recommendations"' },
          { status: 400 }
        );
    }

    const searchTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      query,
      searchType,
      results: results.map((result, index) => ({
        ...result,
        rank: index + 1,
        searchType,
        metadata: result.metadata || {}
      })),
      count: results.length,
      metadata: {
        ...metadata,
        searchTime: `${searchTime}ms`,
        timestamp: new Date().toISOString(),
        qdrantReady: true
      },
      insights: generateAdvancedSearchInsights(results, searchType, searchTime)
    });

  } catch (error) {
    console.error('Advanced search error:', error);
    return NextResponse.json(
      { 
        error: 'Advanced search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for simple advanced search
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const searchType = (searchParams.get('type') || 'hybrid') as 'hybrid' | 'multistage' | 'recommendations';
    const limit = parseInt(searchParams.get('limit') || '10');
    const fusionMethod = (searchParams.get('fusion') || 'rrf') as 'rrf' | 'dbsf';
    const scoreThreshold = parseFloat(searchParams.get('threshold') || '0.7');
    const userId = searchParams.get('userId');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    if (searchType === 'recommendations' && !userId) {
      return NextResponse.json(
        { error: 'User ID is required for recommendations' },
        { status: 400 }
      );
    }

    const qdrantReady = await isQdrantReady();
    if (!qdrantReady) {
      return NextResponse.json(
        { error: 'Advanced search service is temporarily unavailable' },
        { status: 503 }
      );
    }

    const startTime = Date.now();
    let results: any[] = [];

    switch (searchType) {
      case 'hybrid':
        results = await hybridSearch(query, {
          limit,
          fusionMethod,
          scoreThreshold
        });
        break;
      case 'multistage':
        results = await multiStageSearch(query, { limit });
        break;
      case 'recommendations':
        results = await getIntelligentRecommendations(userId!, { limit });
        break;
    }

    const searchTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      query,
      searchType,
      results: results.map((result, index) => ({
        ...result,
        rank: index + 1
      })),
      count: results.length,
      metadata: {
        searchTime: `${searchTime}ms`,
        searchType,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Advanced search GET error:', error);
    return NextResponse.json(
      { 
        error: 'Advanced search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Generate insights for advanced search results
function generateAdvancedSearchInsights(
  results: any[], 
  searchType: string, 
  searchTime: number
): any {
  if (results.length === 0) {
    return {
      summary: 'No results found',
      suggestions: [
        'Try different search terms',
        'Lower the score threshold',
        'Adjust search parameters',
        'Check if content is indexed'
      ]
    };
  }

  const avgScore = results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length;
  const highQualityResults = results.filter(r => (r.score || 0) > 0.8).length;
  
  const insights = {
    summary: `Found ${results.length} results using ${searchType} search`,
    performance: {
      searchTime: `${searchTime}ms`,
      averageScore: avgScore,
      highQualityResults,
      qualityDistribution: {
        excellent: results.filter(r => (r.score || 0) > 0.9).length,
        good: results.filter(r => (r.score || 0) > 0.7 && (r.score || 0) <= 0.9).length,
        fair: results.filter(r => (r.score || 0) > 0.5 && (r.score || 0) <= 0.7).length
      }
    },
    searchType,
    recommendations: generateSearchRecommendations(searchType, avgScore, searchTime)
  };

  return insights;
}

// Generate recommendations for improving search
function generateSearchRecommendations(
  searchType: string, 
  avgScore: number, 
  searchTime: number
): string[] {
  const recommendations: string[] = [];

  if (avgScore < 0.6) {
    recommendations.push('Consider using more descriptive search terms');
    recommendations.push('Try adjusting the score threshold');
  }

  if (searchTime > 1000) {
    recommendations.push('Search is taking longer than expected - consider optimizing');
  }

  if (searchType === 'hybrid') {
    recommendations.push('Hybrid search combines dense and sparse vectors for better results');
  } else if (searchType === 'multistage') {
    recommendations.push('Multi-stage search is optimized for large datasets');
  } else if (searchType === 'recommendations') {
    recommendations.push('Recommendations improve with more user interaction data');
  }

  return recommendations.slice(0, 3);
}