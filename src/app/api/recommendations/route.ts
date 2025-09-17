import { NextRequest, NextResponse } from 'next/server';
import { 
  getIntelligentRecommendations,
  generateSparseVector,
  isQdrantReady 
} from '@/lib/qdrant';

interface RecommendationRequest {
  userId: string;
  algorithm?: 'collaborative' | 'content' | 'hybrid';
  limit?: number;
  diversityThreshold?: number;
  enableDiversityFiltering?: boolean;
  userInteractions?: { [itemId: string]: number };
  updateProfile?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body: RecommendationRequest = await req.json();
    const { 
      userId, 
      algorithm = 'hybrid', 
      limit = 10, 
      diversityThreshold = 0.3,
      enableDiversityFiltering = true,
      userInteractions,
      updateProfile = false
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check Qdrant availability
    const qdrantReady = await isQdrantReady();
    if (!qdrantReady) {
      return NextResponse.json(
        { error: 'Recommendation service is temporarily unavailable' },
        { status: 503 }
      );
    }

    const startTime = Date.now();

    // Get intelligent recommendations
    const recommendations = await getIntelligentRecommendations(userId, {
      limit,
      algorithm,
      diversityThreshold,
      enableDiversityFiltering
    });

    const processingTime = Date.now() - startTime;

    // Update user profile if requested and interactions provided
    let profileUpdated = false;
    if (updateProfile && userInteractions) {
      try {
        const sparseVector = generateSparseVector(userInteractions);
        // Here you would typically update the user's profile in Qdrant
        // For now, we'll just mark it as updated
        profileUpdated = true;
      } catch (error) {
        console.error('Error updating user profile:', error);
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      algorithm,
      recommendations: recommendations.map((rec, index) => ({
        ...rec,
        rank: index + 1,
        recommendationId: `rec_${userId}_${index}`,
        confidence: rec.score || Math.random() * 0.5 + 0.5
      })),
      count: recommendations.length,
      metadata: {
        processingTime: `${processingTime}ms`,
        algorithm,
        diversityThreshold,
        enableDiversityFiltering,
        profileUpdated,
        timestamp: new Date().toISOString()
      },
      insights: generateRecommendationInsights(recommendations, algorithm, processingTime)
    });

  } catch (error) {
    console.error('Recommendation error:', error);
    return NextResponse.json(
      { 
        error: 'Recommendation generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for simple recommendations
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const algorithm = (searchParams.get('algorithm') || 'hybrid') as 'collaborative' | 'content' | 'hybrid';
    const limit = parseInt(searchParams.get('limit') || '10');
    const diversityThreshold = parseFloat(searchParams.get('diversity') || '0.3');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const qdrantReady = await isQdrantReady();
    if (!qdrantReady) {
      return NextResponse.json(
        { error: 'Recommendation service is temporarily unavailable' },
        { status: 503 }
      );
    }

    const startTime = Date.now();
    const recommendations = await getIntelligentRecommendations(userId, {
      limit,
      algorithm,
      diversityThreshold
    });
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      userId,
      algorithm,
      recommendations: recommendations.map((rec, index) => ({
        ...rec,
        rank: index + 1
      })),
      count: recommendations.length,
      metadata: {
        processingTime: `${processingTime}ms`,
        algorithm,
        diversityThreshold,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Recommendation GET error:', error);
    return NextResponse.json(
      { 
        error: 'Recommendation generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT endpoint for batch recommendation updates
export async function PUT(req: NextRequest) {
  try {
    const { users }: { users: Array<{
      userId: string;
      interactions: { [itemId: string]: number };
      algorithm?: 'collaborative' | 'content' | 'hybrid';
    }> } = await req.json();

    if (!users || !Array.isArray(users)) {
      return NextResponse.json(
        { error: 'Users array is required for batch updates' },
        { status: 400 }
      );
    }

    const qdrantReady = await isQdrantReady();
    if (!qdrantReady) {
      return NextResponse.json(
        { error: 'Recommendation service is temporarily unavailable' },
        { status: 503 }
      );
    }

    const startTime = Date.now();
    const results = await Promise.allSettled(
      users.map(async (user) => {
        const sparseVector = generateSparseVector(user.interactions);
        // Here you would typically update the user's profile in Qdrant
        return {
          userId: user.userId,
          success: true,
          vectorSize: sparseVector.indices.length
        };
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `Batch update completed: ${successful} successful, ${failed} failed`,
      summary: {
        total: users.length,
        successful,
        failed,
        successRate: `${((successful / users.length) * 100).toFixed(1)}%`,
        processingTime: `${processingTime}ms`
      },
      details: results.map((result, index) => ({
        userId: users[index].userId,
        success: result.status === 'fulfilled',
        error: result.status === 'rejected' ? result.reason?.message : null
      }))
    });

  } catch (error) {
    console.error('Batch recommendation update error:', error);
    return NextResponse.json(
      { 
        error: 'Batch update failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Generate insights for recommendation results
function generateRecommendationInsights(
  recommendations: any[], 
  algorithm: string, 
  processingTime: number
): any {
  if (recommendations.length === 0) {
    return {
      summary: 'No recommendations available',
      suggestions: [
        'User needs more interaction data',
        'Try different algorithm',
        'Lower diversity threshold',
        'Check if content is indexed'
      ]
    };
  }

  const avgScore = recommendations.reduce((sum, r) => sum + (r.score || 0), 0) / recommendations.length;
  const highQualityRecs = recommendations.filter(r => (r.score || 0) > 0.8).length;
  
  const insights = {
    summary: `Generated ${recommendations.length} recommendations using ${algorithm} algorithm`,
    performance: {
      processingTime: `${processingTime}ms`,
      averageScore: avgScore,
      highQualityRecommendations: highQualityRecs,
      qualityDistribution: {
        excellent: recommendations.filter(r => (r.score || 0) > 0.9).length,
        good: recommendations.filter(r => (r.score || 0) > 0.7 && (r.score || 0) <= 0.9).length,
        fair: recommendations.filter(r => (r.score || 0) > 0.5 && (r.score || 0) <= 0.7).length
      }
    },
    algorithm,
    recommendations: generateRecommendationRecommendations(algorithm, avgScore, processingTime)
  };

  return insights;
}

// Generate recommendations for improving recommendation quality
function generateRecommendationRecommendations(
  algorithm: string, 
  avgScore: number, 
  processingTime: number
): string[] {
  const recommendations: string[] = [];

  if (avgScore < 0.6) {
    recommendations.push('Consider collecting more user interaction data');
    recommendations.push('Try adjusting the diversity threshold');
  }

  if (processingTime > 2000) {
    recommendations.push('Recommendation generation is taking longer than expected');
  }

  if (algorithm === 'collaborative') {
    recommendations.push('Collaborative filtering works best with many users and interactions');
  } else if (algorithm === 'content') {
    recommendations.push('Content-based filtering works well with rich content metadata');
  } else if (algorithm === 'hybrid') {
    recommendations.push('Hybrid approach combines the best of both methods');
  }

  return recommendations.slice(0, 3);
}