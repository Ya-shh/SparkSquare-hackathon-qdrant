import { NextRequest, NextResponse } from 'next/server';
import { qdrantClient, COLLECTIONS, generateEmbedding, isQdrantReady } from '@/lib/qdrant';
import { db } from '@/lib/db';

interface TrendingPost {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  userId: string;
  username: string;
  userName: string;
  categoryId: string;
  categoryName: string;
  type: 'post';
  score: number;
  engagementScore: number;
  commentCount: number;
  voteCount: number;
  viewCount?: number;
}

interface TrendingTag {
  name: string;
  count: number;
  relevanceScore: number;
  posts: string[];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timeRange = (searchParams.get('timeRange') as 'day' | 'week' | 'month' | 'year') || 'week';
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type') || 'posts'; // 'posts' | 'tags' | 'both'

    const result: any = {};

    if (type === 'posts' || type === 'both') {
      result.posts = await getTrendingPosts(timeRange, limit);
    }

    if (type === 'tags' || type === 'both') {
      result.tags = await getTrendingTags(timeRange, Math.min(limit, 20));
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in trending API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending content' },
      { status: 500 }
    );
  }
}

async function getTrendingPosts(timeRange: string, limit: number): Promise<TrendingPost[]> {
  try {
    // Get time range filter
    const timeFilter = getTimeFilter(timeRange);
    
    // First, get posts from the specified time range with engagement metrics
    const posts = await db.post.findMany({
      where: {
        createdAt: {
          gte: timeFilter
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            comments: true,
            votes: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: Math.min(limit * 3, 100) // Get more posts to analyze
    });

    if (posts.length === 0) {
      return [];
    }

    // Check if Qdrant is ready for vector analysis
    const ready = await isQdrantReady();
    if (!ready) {
      // Fallback to engagement-based trending
      return posts
        .map(post => ({
          id: post.id,
          title: post.title,
          content: post.content,
          createdAt: post.createdAt.toISOString(),
          userId: post.userId,
          username: post.user.username,
          userName: post.user.name || post.user.username,
          categoryId: post.categoryId,
          categoryName: post.category.name,
          type: 'post' as const,
          score: 0.8,
          engagementScore: calculateEngagementScore(post._count.comments, post._count.votes, post.createdAt),
          commentCount: post._count.comments,
          voteCount: post._count.votes
        }))
        .sort((a, b) => b.engagementScore - a.engagementScore)
        .slice(0, limit);
    }

    // Use vector similarity to find trending topics
    const trendingQueries = [
      'trending popular viral hot discussions',
      'breaking news important updates',
      'interesting insights valuable knowledge',
      'active community engagement discussions'
    ];

    const vectorResults = await Promise.all(
      trendingQueries.map(async (query) => {
        try {
          const queryEmbedding = await generateEmbedding(query, 'query');
          const results = await qdrantClient.search(COLLECTIONS.POSTS, {
            vector: queryEmbedding,
            limit: limit * 2,
            filter: {
              must: [
                {
                  key: 'createdAtTs',
                  range: {
                    gte: timeFilter.getTime()
                  }
                }
              ]
            }
          });
          return results;
        } catch (error) {
          console.error('Error in vector search for trending:', error);
          return [];
        }
      })
    );

    // Combine and deduplicate results
    const allResults = vectorResults.flat();
    const postScores = new Map<string, number>();
    
    for (const result of allResults) {
      const postId = result.payload?.id;
      if (postId) {
        const currentScore = postScores.get(postId) || 0;
        postScores.set(postId, Math.max(currentScore, result.score));
      }
    }

    // Get the actual posts and calculate final trending scores
    const trendingPostIds = Array.from(postScores.keys()).slice(0, limit * 2);
    const trendingPosts = posts.filter(post => trendingPostIds.includes(post.id));

    const finalResults = trendingPosts.map(post => {
      const vectorScore = postScores.get(post.id) || 0;
      const engagementScore = calculateEngagementScore(post._count.comments, post._count.votes, post.createdAt);
      
      return {
        id: post.id,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt.toISOString(),
        userId: post.userId,
        username: post.user.username,
        userName: post.user.name || post.user.username,
        categoryId: post.categoryId,
        categoryName: post.category.name,
        type: 'post' as const,
        score: vectorScore,
        engagementScore,
        commentCount: post._count.comments,
        voteCount: post._count.votes,
        finalTrendingScore: (vectorScore * 0.6) + (engagementScore * 0.4)
      };
    });

    return finalResults
      .sort((a, b) => b.finalTrendingScore - a.finalTrendingScore)
      .slice(0, limit);

  } catch (error) {
    console.error('Error getting trending posts:', error);
    return [];
  }
}

async function getTrendingTags(timeRange: string, limit: number): Promise<TrendingTag[]> {
  try {
    const timeFilter = getTimeFilter(timeRange);
    
    // Get posts from the time range
    const posts = await db.post.findMany({
      where: {
        createdAt: {
          gte: timeFilter
        }
      },
      include: {
        category: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            comments: true,
            votes: true
          }
        }
      },
      take: 200
    });

    if (posts.length === 0) {
      return [];
    }

    const ready = await isQdrantReady();
    if (!ready) {
      // Fallback: extract tags from categories and content
      return extractTagsFallback(posts, limit);
    }

    // Use vector similarity to cluster posts and extract trending topics
    const topicQueries = [
      'artificial intelligence machine learning AI technology',
      'health wellness medical healthcare',
      'science research discovery innovation',
      'neuroscience brain cognitive psychology',
      'quantum computing physics mathematics',
      'climate environment sustainability',
      'education learning knowledge sharing',
      'business entrepreneurship startup',
      'programming software development coding',
      'philosophy ethics society culture'
    ];

    const tagClusters = new Map<string, { posts: string[], score: number, count: number }>();

    for (const query of topicQueries) {
      try {
        const queryEmbedding = await generateEmbedding(query, 'query');
        const results = await qdrantClient.search(COLLECTIONS.POSTS, {
          vector: queryEmbedding,
          limit: 50,
          filter: {
            must: [
              {
                key: 'createdAtTs',
                range: {
                  gte: timeFilter.getTime()
                }
              }
            ]
          }
        });

        if (results.length > 0) {
          const tagName = extractMainTopic(query);
          const postIds = results.map(r => r.payload?.id).filter(Boolean);
          const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
          
          tagClusters.set(tagName, {
            posts: postIds,
            score: avgScore,
            count: postIds.length
          });
        }
      } catch (error) {
        console.error(`Error processing topic query "${query}":`, error);
      }
    }

    // Convert to trending tags format
    const trendingTags = Array.from(tagClusters.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      relevanceScore: data.score,
      posts: data.posts
    }));

    return trendingTags
      .sort((a, b) => (b.relevanceScore * b.count) - (a.relevanceScore * a.count))
      .slice(0, limit);

  } catch (error) {
    console.error('Error getting trending tags:', error);
    return [];
  }
}

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
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

function calculateEngagementScore(comments: number, votes: number, createdAt: Date): number {
  const now = new Date();
  const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  
  // Engagement rate considering recency
  const engagementRate = (comments * 2 + votes) / Math.max(hoursSinceCreation, 1);
  
  // Normalize to 0-1 scale
  return Math.min(engagementRate / 10, 1);
}

function extractMainTopic(query: string): string {
  const words = query.split(' ');
  // Return the first significant word as the tag
  const significantWords = words.filter(word => word.length > 3);
  return significantWords[0] || words[0];
}

function extractTagsFallback(posts: any[], limit: number): TrendingTag[] {
  const tagMap = new Map<string, { count: number, posts: string[] }>();
  
  posts.forEach(post => {
    // Extract tags from category names and content
    const tags = [
      post.category.name.toLowerCase(),
      ...extractWordsFromContent(post.title + ' ' + post.content)
    ];
    
    tags.forEach(tag => {
      if (tag.length > 3) {
        const current = tagMap.get(tag) || { count: 0, posts: [] };
        current.count++;
        if (!current.posts.includes(post.id)) {
          current.posts.push(post.id);
        }
        tagMap.set(tag, current);
      }
    });
  });
  
  return Array.from(tagMap.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      relevanceScore: data.count / posts.length,
      posts: data.posts
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function extractWordsFromContent(content: string): string[] {
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 4 && !isCommonWord(word));
  
  return Array.from(new Set(words)).slice(0, 5);
}

function isCommonWord(word: string): boolean {
  const commonWords = new Set([
    'that', 'this', 'with', 'have', 'will', 'been', 'from', 'they', 'know',
    'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come',
    'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take',
    'than', 'them', 'well', 'were', 'what', 'your'
  ]);
  return commonWords.has(word);
}






