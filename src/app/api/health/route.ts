import { NextRequest, NextResponse } from 'next/server';
import { isQdrantReady } from '@/lib/qdrant';
import { mistralConfig } from '@/lib/mistral-llm';

export async function GET(request: NextRequest) {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown',
        qdrant: 'unknown',
        mistral: 'unknown'
      },
      features: {
        multimodalSearch: false,
        intelligentRecommendations: false,
        mixtralEnhancement: false
      }
    };

    // Check database connection
    try {
      const { db } = await import('@/lib/db');
      await db.$connect();
      health.services.database = 'healthy';
    } catch (error) {
      health.services.database = 'unhealthy';
      health.status = 'degraded';
    }

    // Check Qdrant connection
    try {
      const qdrantReady = await isQdrantReady();
      health.services.qdrant = qdrantReady ? 'healthy' : 'unhealthy';
      if (!qdrantReady) health.status = 'degraded';
      health.features.multimodalSearch = qdrantReady;
      health.features.intelligentRecommendations = qdrantReady;
    } catch (error) {
      health.services.qdrant = 'unhealthy';
      health.status = 'degraded';
    }

    // Check Mistral configuration
    health.services.mistral = mistralConfig.isAvailable ? 'healthy' : 'not_configured';
    health.features.mixtralEnhancement = mistralConfig.isAvailable;

    // Overall status
    if (health.services.database === 'unhealthy' || health.services.qdrant === 'unhealthy') {
      health.status = 'unhealthy';
    }

    const statusCode = health.status === 'unhealthy' ? 503 : 200;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      },
      { status: 503 }
    );
  }
}
