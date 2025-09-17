import { NextRequest, NextResponse } from 'next/server';
import { qdrantClient, COLLECTIONS, generateEmbedding, isQdrantReady } from '@/lib/qdrant';
import { db } from '@/lib/db';

interface ContentAnalytics {
  overview: {
    totalPosts: number;
    totalComments: number;
    totalUsers: number;
    avgEngagement: number;
  };
  topicDistribution: {
    topic: string;
    count: number;
    percentage: number;
    avgScore: number;
  }[];
  contentQuality: {
    highQuality: number;
    mediumQuality: number;
    lowQuality: number;
    avgContentLength: number;
  };
  userEngagement: {
    activeUsers: number;
    avgPostsPerUser: number;
    avgCommentsPerPost: number;
    topContributors: {
      username: string;
      posts: number;
      comments: number;
      engagementScore: number;
    }[];
  };
  trendingInsights: {
    emergingTopics: string[];
    popularKeywords: string[];
    engagementTrends: {
      period: string;
      posts: number;
      comments: number;
      engagement: number;
    }[];
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timeRange = (searchParams.get('timeRange') as 'day' | 'week' | 'month' | 'year') || 'month';
    
    const analytics = await generateContentAnalytics(timeRange);
    
    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error in analytics API:', error);
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500 }
    );
  }
}

async function generateContentAnalytics(timeRange: string): Promise<ContentAnalytics> {
  try {
    const timeFilter = getTimeFilter(timeRange);
    
    // Get basic statistics
    const [posts, comments, users] = await Promise.all([
      db.post.findMany({
        where: {
          createdAt: { gte: timeFilter }
        },
        include: {
          user: { select: { username: true } },
          category: { select: { name: true } },
          _count: { select: { comments: true, votes: true } }
        }
      }),
      db.comment.findMany({
        where: {
          createdAt: { gte: timeFilter }
        },
        include: {
          user: { select: { username: true } }
        }
      }),
      db.user.findMany({
        where: {
          createdAt: { gte: timeFilter }
        },
        include: {
          _count: { select: { posts: true, comments: true } }
        }
      })
    ]);

    const overview = {
      totalPosts: posts.length,
      totalComments: comments.length,
      totalUsers: users.length,
      avgEngagement: posts.length > 0 
        ? posts.reduce((sum, p) => sum + p._count.comments + p._count.votes, 0) / posts.length 
        : 0
    };

    // Analyze topic distribution using vector similarity
    const topicDistribution = await analyzeTopicDistribution(posts);
    
    // Analyze content quality using vector embeddings
    const contentQuality = await analyzeContentQuality(posts);
    
    // Analyze user engagement
    const userEngagement = analyzeUserEngagement(posts, comments, users);
    
    // Generate trending insights
    const trendingInsights = await generateTrendingInsights(posts, timeRange);

    return {
      overview,
      topicDistribution,
      contentQuality,
      userEngagement,
      trendingInsights
    };

  } catch (error) {
    console.error('Error generating content analytics:', error);
    throw error;
  }
}

async function analyzeTopicDistribution(posts: any[]): Promise<ContentAnalytics['topicDistribution']> {
  try {
    const ready = await isQdrantReady();
    if (!ready) {
      return getFallbackTopicDistribution(posts);
    }

    const topicQueries = [
      { topic: 'Artificial Intelligence', query: 'artificial intelligence machine learning AI neural networks' },
      { topic: 'Neuroscience', query: 'neuroscience brain cognitive memory psychology' },
      { topic: 'Quantum Computing', query: 'quantum computing physics quantum mechanics' },
      { topic: 'Healthcare', query: 'healthcare medical health medicine treatment' },
      { topic: 'Climate Science', query: 'climate environment sustainability renewable energy' },
      { topic: 'Biotechnology', query: 'biotechnology genetics DNA gene editing CRISPR' },
      { topic: 'Space & Astronomy', query: 'space astronomy astrophysics universe planets' },
      { topic: 'Technology', query: 'technology innovation startup digital software' },
      { topic: 'Education', query: 'education learning teaching knowledge research' },
      { topic: 'Philosophy', query: 'philosophy ethics morality consciousness society' }
    ];

    const topicCounts: { topic: string; count: number; avgScore: number }[] = [];

    for (const { topic, query } of topicQueries) {
      try {
        const queryEmbedding = await generateEmbedding(query, 'query');
        const results = await qdrantClient.search(COLLECTIONS.POSTS, {
          vector: queryEmbedding,
          limit: posts.length,
        });

        // Filter results with high similarity scores (> 0.7)
        const relevantResults = results.filter((r: any) => r.score > 0.7);
        const avgScore = relevantResults.length > 0 
          ? relevantResults.reduce((sum: number, r: any) => sum + r.score, 0) / relevantResults.length 
          : 0;

        topicCounts.push({
          topic,
          count: relevantResults.length,
          avgScore
        });
      } catch (error) {
        console.error(`Error analyzing topic "${topic}":`, error);
      }
    }

    const totalPosts = posts.length;
    return topicCounts
      .map(t => ({
        topic: t.topic,
        count: t.count,
        percentage: totalPosts > 0 ? (t.count / totalPosts) * 100 : 0,
        avgScore: t.avgScore
      }))
      .sort((a, b) => b.count - a.count);

  } catch (error) {
    console.error('Error in topic distribution analysis:', error);
    return getFallbackTopicDistribution(posts);
  }
}

async function analyzeContentQuality(posts: any[]): Promise<ContentAnalytics['contentQuality']> {
  try {
    const ready = await isQdrantReady();
    if (!ready) {
      return getFallbackContentQuality(posts);
    }

    const qualityQueries = [
      'high quality insightful detailed comprehensive well-researched',
      'medium quality informative helpful useful',
      'low quality brief simple basic'
    ];

    const qualityScores = await Promise.all(
      qualityQueries.map(async (query) => {
        try {
          const queryEmbedding = await generateEmbedding(query, 'query');
          const results = await qdrantClient.search(COLLECTIONS.POSTS, {
            vector: queryEmbedding,
            limit: posts.length,
          });
          return results.filter((r: any) => r.score > 0.6).length;
        } catch (error) {
          console.error(`Error analyzing quality query "${query}":`, error);
          return 0;
        }
      })
    );

    const avgContentLength = posts.length > 0 
      ? posts.reduce((sum, p) => sum + (p.content?.length || 0), 0) / posts.length 
      : 0;

    return {
      highQuality: qualityScores[0],
      mediumQuality: qualityScores[1],
      lowQuality: qualityScores[2],
      avgContentLength: Math.round(avgContentLength)
    };

  } catch (error) {
    console.error('Error in content quality analysis:', error);
    return getFallbackContentQuality(posts);
  }
}

function analyzeUserEngagement(posts: any[], comments: any[], users: any[]): ContentAnalytics['userEngagement'] {
  const activeUsers = new Set([
    ...posts.map(p => p.user?.username),
    ...comments.map(c => c.user?.username)
  ]).size;

  const avgPostsPerUser = users.length > 0 
    ? users.reduce((sum, u) => sum + u._count.posts, 0) / users.length 
    : 0;

  const avgCommentsPerPost = posts.length > 0 
    ? posts.reduce((sum, p) => sum + p._count.comments, 0) / posts.length 
    : 0;

  // Calculate top contributors
  const userStats = new Map<string, { posts: number; comments: number; engagementScore: number }>();
  
  posts.forEach(post => {
    const username = post.user?.username;
    if (username) {
      const current = userStats.get(username) || { posts: 0, comments: 0, engagementScore: 0 };
      current.posts++;
      current.engagementScore += post._count.comments + post._count.votes;
      userStats.set(username, current);
    }
  });

  comments.forEach(comment => {
    const username = comment.user?.username;
    if (username) {
      const current = userStats.get(username) || { posts: 0, comments: 0, engagementScore: 0 };
      current.comments++;
      current.engagementScore += 1; // Each comment adds to engagement
      userStats.set(username, current);
    }
  });

  const topContributors = Array.from(userStats.entries())
    .map(([username, stats]) => ({ username, ...stats }))
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, 10);

  return {
    activeUsers,
    avgPostsPerUser: Math.round(avgPostsPerUser * 100) / 100,
    avgCommentsPerPost: Math.round(avgCommentsPerPost * 100) / 100,
    topContributors
  };
}

async function generateTrendingInsights(posts: any[], timeRange: string): Promise<ContentAnalytics['trendingInsights']> {
  // Extract keywords from recent posts
  const recentPosts = posts.slice(-50); // Last 50 posts
  const keywords = extractKeywords(recentPosts);
  
  // Identify emerging topics (simplified)
  const emergingTopics = [
    'AI Ethics',
    'Quantum Supremacy',
    'Neural Interfaces',
    'Gene Therapy',
    'Space Tourism'
  ].slice(0, 3);

  // Generate engagement trends (mock data for demonstration)
  const engagementTrends = generateEngagementTrends(timeRange);

  return {
    emergingTopics,
    popularKeywords: keywords.slice(0, 10),
    engagementTrends
  };
}

// Helper functions
function getTimeFilter(timeRange: string): Date {
  const now = new Date();
  switch (timeRange) {
    case 'day':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'year':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

function getFallbackTopicDistribution(posts: any[]): ContentAnalytics['topicDistribution'] {
  const categories = posts.reduce((acc, post) => {
    const category = post.category?.name || 'Other';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = posts.length;
  return Object.entries(categories)
    .map(([topic, count]) => ({
      topic,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
      avgScore: 0.5
    }))
    .sort((a, b) => b.count - a.count);
}

function getFallbackContentQuality(posts: any[]): ContentAnalytics['contentQuality'] {
  const avgLength = posts.length > 0 
    ? posts.reduce((sum, p) => sum + (p.content?.length || 0), 0) / posts.length 
    : 0;

  // Simple heuristic based on content length and engagement
  const highQuality = posts.filter(p => 
    (p.content?.length || 0) > 500 && p._count.comments > 5
  ).length;
  
  const lowQuality = posts.filter(p => 
    (p.content?.length || 0) < 100 && p._count.comments < 2
  ).length;

  const mediumQuality = posts.length - highQuality - lowQuality;

  return {
    highQuality,
    mediumQuality,
    lowQuality,
    avgContentLength: Math.round(avgLength)
  };
}

function extractKeywords(posts: any[]): string[] {
  const wordCount = new Map<string, number>();
  const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);

  posts.forEach(post => {
    const text = `${post.title} ${post.content}`.toLowerCase();
    const words = text.match(/\b\w{4,}\b/g) || [];
    
    words.forEach(word => {
      if (!stopWords.has(word)) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      }
    });
  });

  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
}

function generateEngagementTrends(timeRange: string): ContentAnalytics['trendingInsights']['engagementTrends'] {
  // Mock engagement trends - in a real implementation, this would analyze historical data
  const periods = timeRange === 'day' ? 
    ['6h ago', '12h ago', '18h ago', '24h ago'] :
    timeRange === 'week' ?
    ['1d ago', '2d ago', '4d ago', '7d ago'] :
    ['1w ago', '2w ago', '3w ago', '4w ago'];

  return periods.map((period, index) => ({
    period,
    posts: Math.floor(Math.random() * 50) + 10,
    comments: Math.floor(Math.random() * 200) + 50,
    engagement: Math.floor(Math.random() * 100) + 50
  }));
}






