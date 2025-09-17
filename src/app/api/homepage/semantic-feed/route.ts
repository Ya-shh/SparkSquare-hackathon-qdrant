import { NextRequest, NextResponse } from 'next/server';
import { semanticSearchWithCategories } from '../../../../lib/semantic-search';
import { isQdrantReady } from '../../../../lib/qdrant';

interface HomepageFeedRequest {
  tab: 'trending' | 'exciting' | 'new' | 'top' | 'ai-recommended' | 'deep-dive' | 'rising' | 'expert-picks';
  category?: string;
  limit?: number;
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'all';
  query?: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get('tab') as any || 'trending';
    const category = searchParams.get('category') || undefined;
    const limit = parseInt(searchParams.get('limit') || '15');
    const timeRange = searchParams.get('timeRange') as any || 'week';
    const query = searchParams.get('query') || getDefaultQueryForTab(tab);

    // Validate tab
    const validTabs = ['trending', 'exciting', 'new', 'top', 'ai-recommended', 'deep-dive', 'rising', 'expert-picks'];
    if (!validTabs.includes(tab)) {
      return NextResponse.json(
        { error: 'Invalid tab specified' },
        { status: 400 }
      );
    }

    // Check if Qdrant is available
    const qdrantReady = await isQdrantReady();
    
    let results: any[] = [];
    let searchType = 'fallback';

    if (qdrantReady) {
      try {
        // Use semantic search with category-specific embeddings
        results = await semanticSearchWithCategories(query, tab, {
          limit,
          scoreThreshold: getScoreThresholdForTab(tab),
          timeRange,
          categoryId: category,
          filters: getFiltersForTab(tab)
        });
        searchType = 'semantic';
      } catch (error) {
        console.error('Semantic search failed, falling back:', error);
        searchType = 'fallback';
        results = await getFallbackResults(tab, category, limit, timeRange);
      }
    } else {
      console.warn('Qdrant not available, using fallback search');
      results = await getFallbackResults(tab, category, limit, timeRange);
    }

    // Enhance results with tab-specific metadata
    const enhancedResults = results.map(result => ({
      ...result,
      tab,
      tabMetadata: getTabMetadata(tab, result),
      relevanceScore: calculateTabRelevance(result, tab),
      displayPriority: calculateDisplayPriority(result, tab)
    }));

    // Sort by display priority and relevance
    const sortedResults = enhancedResults.sort((a, b) => {
      const priorityDiff = (b.displayPriority || 0) - (a.displayPriority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return (b.relevanceScore || 0) - (a.relevanceScore || 0);
    });

    // Generate tab-specific insights
    const insights = generateTabInsights(tab, sortedResults);

    return NextResponse.json({
      results: sortedResults,
      insights,
      metadata: {
        tab,
        category,
        query,
        count: sortedResults.length,
        searchType,
        timeRange,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in semantic homepage feed API:', error);
    return NextResponse.json(
      {
        error: 'An error occurred while fetching the feed',
        results: [],
        insights: {},
        metadata: {
          tab: 'trending',
          count: 0,
          searchType: 'error'
        }
      },
      { status: 500 }
    );
  }
}

// Helper functions

function getDefaultQueryForTab(tab: string): string {
  const defaultQueries = {
    trending: 'popular discussions trending now',
    exciting: 'thrilling developments exciting news',
    new: 'latest updates fresh content',
    top: 'best quality discussions expert insights',
    'ai-recommended': 'personalized recommendations intelligent content',
    'deep-dive': 'comprehensive analysis detailed research',
    rising: 'emerging topics growing discussions',
    'expert-picks': 'expert insights professional analysis'
  };
  
  return defaultQueries[tab as keyof typeof defaultQueries] || 'interesting discussions';
}

function getScoreThresholdForTab(tab: string): number {
  const thresholds = {
    trending: 0.75,
    exciting: 0.7,
    new: 0.6,
    top: 0.8,
    'ai-recommended': 0.7,
    'deep-dive': 0.75,
    rising: 0.65,
    'expert-picks': 0.8
  };
  
  return thresholds[tab as keyof typeof thresholds] || 0.7;
}

function getFiltersForTab(tab: string): any {
  const filters: any = {
    must: [{ key: 'type', match: { value: 'post' } }]
  };

  switch (tab) {
    case 'trending':
      filters.must.push({ key: 'trendingScore', range: { gte: 0.8 } });
      break;
    case 'exciting':
      filters.must.push({ key: 'isHot', match: { value: true } });
      break;
    case 'deep-dive':
      filters.must.push({ key: 'contentLength', range: { gte: 300 } });
      break;
    case 'expert-picks':
      filters.must.push({ key: 'userRole', match: { any: ['Dr.', 'Prof.', 'Expert', 'Specialist'] } });
      break;
  }

  return filters;
}

function getTabMetadata(tab: string, result: any) {
  const metadata: any = {
    tab,
    category: tab
  };

  switch (tab) {
    case 'trending':
      metadata.trendingScore = result.trendingScore || 0;
      metadata.isViral = result.trendingScore > 0.9;
      break;
    case 'exciting':
      metadata.engagementLevel = calculateEngagementLevel(result);
      metadata.isHot = result.isHot || false;
      break;
    case 'deep-dive':
      metadata.contentDepth = result.content?.length || 0;
      metadata.isComprehensive = metadata.contentDepth > 500;
      break;
    case 'expert-picks':
      metadata.expertLevel = result.user?.role?.includes('Dr.') ? 'high' : 
                            result.user?.role?.includes('Prof.') ? 'medium' : 'low';
      break;
  }

  return metadata;
}

function calculateTabRelevance(result: any, tab: string): number {
  let relevance = 0;

  switch (tab) {
    case 'trending':
      relevance += (result.trendingScore || 0) * 0.4;
      relevance += (result.viewCount || 0) / 1000 * 0.2;
      relevance += ((result._count?.comments || 0) + (result._count?.votes || 0)) / 100 * 0.2;
      break;
    case 'exciting':
      relevance += (result.isHot ? 0.3 : 0);
      relevance += ((result._count?.comments || 0) + (result._count?.votes || 0)) / 200 * 0.3;
      relevance += (result.trendingScore || 0) * 0.2;
      break;
    case 'deep-dive':
      relevance += Math.min((result.content?.length || 0) / 2000, 0.4);
      relevance += (result._count?.comments || 0) / 100 * 0.3;
      relevance += (result.user?.role?.includes('Dr.') || result.user?.role?.includes('Prof.') ? 0.3 : 0);
      break;
    case 'expert-picks':
      relevance += (result.user?.role?.includes('Dr.') ? 0.4 : 
                   result.user?.role?.includes('Prof.') ? 0.3 : 
                   result.user?.role?.includes('Expert') ? 0.2 : 0);
      relevance += (result.trendingScore || 0) * 0.3;
      relevance += ((result._count?.comments || 0) + (result._count?.votes || 0)) / 100 * 0.3;
      break;
  }

  return Math.min(relevance, 1.0);
}

function calculateDisplayPriority(result: any, tab: string): number {
  let priority = 0;

  // Base priority from score
  priority += (result.score || 0) * 0.3;

  // Tab-specific priority factors
  switch (tab) {
    case 'trending':
      priority += (result.trendingScore || 0) * 0.4;
      priority += (result.isPinned ? 0.3 : 0);
      break;
    case 'exciting':
      priority += (result.isHot ? 0.4 : 0);
      priority += Math.min(((result._count?.comments || 0) + (result._count?.votes || 0)) / 200, 0.3);
      break;
    case 'deep-dive':
      priority += Math.min((result.content?.length || 0) / 2000, 0.4);
      priority += (result._count?.comments || 0) / 100 * 0.3;
      break;
    case 'expert-picks':
      priority += (result.user?.role?.includes('Dr.') ? 0.4 : 
                  result.user?.role?.includes('Prof.') ? 0.3 : 0);
      break;
  }

  return Math.min(priority, 1.0);
}

function calculateEngagementLevel(result: any): 'low' | 'medium' | 'high' {
  const totalEngagement = (result._count?.comments || 0) + (result._count?.votes || 0);
  
  if (totalEngagement > 100) return 'high';
  if (totalEngagement > 30) return 'medium';
  return 'low';
}

function generateTabInsights(tab: string, results: any[]) {
  const insights: any = {
    tab,
    totalResults: results.length,
    averageScore: results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length || 0
  };

  switch (tab) {
    case 'trending':
      insights.trendingTopics = [...new Set(results.map(r => r.categoryName).filter(Boolean))];
      insights.viralCount = results.filter(r => r.trendingScore > 0.9).length;
      break;
    case 'exciting':
      insights.highEngagementCount = results.filter(r => 
        ((r._count?.comments || 0) + (r._count?.votes || 0)) > 100
      ).length;
      insights.hotTopics = results.filter(r => r.isHot).length;
      break;
    case 'deep-dive':
      insights.comprehensiveCount = results.filter(r => (r.content?.length || 0) > 500).length;
      insights.expertCount = results.filter(r => 
        r.user?.role?.includes('Dr.') || r.user?.role?.includes('Prof.')
      ).length;
      break;
    case 'expert-picks':
      insights.expertLevels = {
        high: results.filter(r => r.user?.role?.includes('Dr.')).length,
        medium: results.filter(r => r.user?.role?.includes('Prof.')).length,
        low: results.filter(r => r.user?.role?.includes('Expert')).length
      };
      break;
  }

  return insights;
}

async function getFallbackResults(tab: string, category: string | undefined, limit: number, timeRange: string) {
  try {
    const { db } = await import('@/lib/db');
    
    const whereClause: any = {};
    
    if (category && category !== 'all') {
      whereClause.categoryId = category;
    }

    // Add time range filter
    if (timeRange !== 'all') {
      const timeRanges = {
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        year: 365 * 24 * 60 * 60 * 1000
      };
      const sinceDate = new Date(Date.now() - timeRanges[timeRange as keyof typeof timeRanges]);
      whereClause.createdAt = { gte: sinceDate };
    }

    // Tab-specific ordering
    let orderBy: any = { createdAt: 'desc' };
    if (tab === 'top') {
      orderBy = [
        { votes: { _count: 'desc' } },
        { comments: { _count: 'desc' } }
      ];
    }

    const posts = await db.post.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, username: true, image: true } },
        category: true,
        _count: { select: { comments: true, votes: true } }
      },
      orderBy,
      take: limit
    });

    return posts.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt.toISOString(),
      userId: post.userId,
      username: post.user.username,
      userName: post.user.name,
      user: post.user,
      categoryId: post.categoryId,
      categoryName: post.category.name,
      type: 'post',
      score: 0.8,
      _count: post._count,
      trendingScore: Math.random() * 0.4 + 0.6, // Mock trending score
      isHot: Math.random() > 0.7, // Mock hot status
      isPinned: Math.random() > 0.9 // Mock pinned status
    }));

  } catch (error) {
    console.error('Fallback search failed:', error);
    return [];
  }
}
