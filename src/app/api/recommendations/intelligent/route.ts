import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getIntelligentRecommendations, RecommendationOptions } from '@/lib/intelligent-recommendations';
import { indexUserInteractions } from '@/lib/qdrant';
import { generateContentRecommendations, analyzeContentWithMistral } from '@/lib/mistral-llm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse recommendation options from query parameters
    const options: RecommendationOptions = {
      algorithm: (searchParams.get('algorithm') as any) || 'hybrid',
      limit: parseInt(searchParams.get('limit') || '10'),
      diversityThreshold: parseFloat(searchParams.get('diversityThreshold') || '0.3'),
      enableDiversityFiltering: searchParams.get('enableDiversityFiltering') !== 'false',
      scoreThreshold: parseFloat(searchParams.get('scoreThreshold') || '0.1'),
      timeDecayFactor: parseFloat(searchParams.get('timeDecayFactor') || '0.95'),
      personalizeByCategory: searchParams.get('personalizeByCategory') !== 'false',
      enableSerendipity: searchParams.get('enableSerendipity') !== 'false',
      serendipityFactor: parseFloat(searchParams.get('serendipityFactor') || '0.1')
    };

    // Get intelligent recommendations for the user
    const result = await getIntelligentRecommendations(session.user.id, options);

    // Enrich recommendations with post data
    const enrichedRecommendations = await enrichRecommendationsWithPostData(result.recommendations);

    return NextResponse.json({
      success: true,
      recommendations: enrichedRecommendations,
      metadata: result.metadata,
      options: options
    });

  } catch (error) {
    console.error('Intelligent recommendations error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      action,
      options = {},
      preferences = {},
      updateUserModel = false
    } = body;

    if (action === 'get_recommendations') {
      // Advanced recommendation request with custom preferences
      const recommendationOptions: RecommendationOptions = {
        algorithm: options.algorithm || 'hybrid',
        limit: options.limit || 10,
        diversityThreshold: options.diversityThreshold || 0.3,
        enableDiversityFiltering: options.enableDiversityFiltering !== false,
        scoreThreshold: options.scoreThreshold || 0.1,
        timeDecayFactor: options.timeDecayFactor || 0.95,
        personalizeByCategory: options.personalizeByCategory !== false,
        enableSerendipity: options.enableSerendipity !== false,
        serendipityFactor: options.serendipityFactor || 0.1
      };

      // Apply user preferences if provided
      if (preferences.categories && Array.isArray(preferences.categories)) {
        // This would modify the recommendation algorithm to prioritize certain categories
        recommendationOptions.personalizeByCategory = true;
      }

      const result = await getIntelligentRecommendations(session.user.id, recommendationOptions);
      const enrichedRecommendations = await enrichRecommendationsWithPostData(result.recommendations);

      return NextResponse.json({
        success: true,
        recommendations: enrichedRecommendations,
        metadata: result.metadata,
        appliedPreferences: preferences
      });

    } else if (action === 'update_user_model') {
      // Update user interaction model for better recommendations
      const updateResult = await indexUserInteractions(session.user.id);
      
      return NextResponse.json({
        success: updateResult,
        message: updateResult 
          ? 'User interaction model updated successfully'
          : 'Failed to update user interaction model'
      });

    } else if (action === 'feedback') {
      // Process recommendation feedback for model improvement
      const { recommendationId, feedback, postId, action: feedbackAction } = body;
      
      const feedbackResult = await processRecommendationFeedback({
        userId: session.user.id,
        recommendationId,
        postId,
        feedback,
        action: feedbackAction
      });

      return NextResponse.json({
        success: feedbackResult.success,
        message: feedbackResult.message
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Supported actions: get_recommendations, update_user_model, feedback' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('POST intelligent recommendations error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// Enrich recommendations with full post data
async function enrichRecommendationsWithPostData(recommendations: any[]): Promise<any[]> {
  if (recommendations.length === 0) return recommendations;

  try {
    const { db } = await import('@/lib/db');
    
    const postIds = recommendations.map(rec => rec.postId).filter(Boolean);
    
    if (postIds.length === 0) return recommendations;

    const posts = await db.post.findMany({
      where: { id: { in: postIds } },
      include: {
        user: { 
          select: { 
            id: true, 
            name: true, 
            username: true, 
            image: true,
            reputation: true
          } 
        },
        category: { 
          select: { 
            id: true, 
            name: true, 
            slug: true, 
            description: true 
          } 
        },
        _count: { 
          select: { 
            comments: true, 
            votes: true, 
            bookmarks: true 
          } 
        }
      }
    });

    const postLookup = new Map(posts.map(post => [post.id, post]));

    return recommendations.map(rec => {
      const post = postLookup.get(rec.postId);
      
      if (!post) return rec;

      return {
        ...rec,
        post: {
          id: post.id,
          title: post.title,
          content: post.content,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          viewCount: post.viewCount,
          author: post.user,
          category: post.category,
          stats: post._count
        },
        enriched: true,
        enrichmentTimestamp: new Date().toISOString()
      };
    });

  } catch (error) {
    console.error('Error enriching recommendations:', error);
    return recommendations.map(rec => ({ ...rec, enrichmentError: true }));
  }
}

// Process recommendation feedback for model improvement
async function processRecommendationFeedback(feedback: {
  userId: string;
  recommendationId?: string;
  postId: string;
  feedback: 'positive' | 'negative' | 'not_interested' | 'irrelevant';
  action: 'click' | 'like' | 'share' | 'bookmark' | 'dismiss';
}): Promise<{ success: boolean; message: string }> {
  try {
    const { db } = await import('@/lib/db');

    // Store feedback in database for future model improvements
    // In a real implementation, you might want to create a feedback table
    const feedbackData = {
      userId: feedback.userId,
      postId: feedback.postId,
      feedbackType: feedback.feedback,
      actionType: feedback.action,
      timestamp: new Date(),
      recommendationId: feedback.recommendationId
    };

    // For now, we'll update user interactions based on feedback
    if (feedback.feedback === 'positive') {
      // Create a positive interaction record
      if (feedback.action === 'like') {
        // Check if vote already exists
        const existingVote = await db.vote.findUnique({
          where: {
            userId_postId_commentId: {
              userId: feedback.userId,
              postId: feedback.postId,
              commentId: null
            }
          }
        });

        if (!existingVote) {
          await db.vote.create({
            data: {
              userId: feedback.userId,
              postId: feedback.postId,
              value: 1
            }
          });
        }
      } else if (feedback.action === 'bookmark') {
        // Check if bookmark already exists
        const existingBookmark = await db.bookmark.findUnique({
          where: {
            userId_postId: {
              userId: feedback.userId,
              postId: feedback.postId
            }
          }
        });

        if (!existingBookmark) {
          await db.bookmark.create({
            data: {
              userId: feedback.userId,
              postId: feedback.postId
            }
          });
        }
      }
    }

    // Update user interaction model after feedback
    await indexUserInteractions(feedback.userId);

    return {
      success: true,
      message: 'Feedback processed successfully'
    };

  } catch (error) {
    console.error('Error processing recommendation feedback:', error);
    return {
      success: false,
      message: 'Failed to process feedback'
    };
  }
}

// Batch recommendations endpoint for multiple users (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin (you might want to implement proper role checking)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, userIds } = body;

    if (action === 'batch_update_models') {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return NextResponse.json(
          { error: 'userIds array is required' },
          { status: 400 }
        );
      }

      // Update recommendation models for multiple users
      const results = await Promise.allSettled(
        userIds.map(userId => indexUserInteractions(userId))
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
      const failed = results.length - successful;

      return NextResponse.json({
        success: true,
        message: `Updated ${successful} user models, ${failed} failed`,
        results: {
          successful,
          failed,
          total: results.length
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action for PUT request' },
      { status: 400 }
    );

  } catch (error) {
    console.error('PUT intelligent recommendations error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
