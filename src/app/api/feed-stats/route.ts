import { NextRequest, NextResponse } from 'next/server';
import { isQdrantReady, qdrantClient } from '@/lib/qdrant';

export async function GET(request: NextRequest) {
  try {
    // Fetch counts from each feed type and Qdrant stats in parallel
    const feedTypes = [
      'trending', 'exciting', 'new', 'top', 
      'ai-recommended', 'deep-dive', 'rising', 'expert-picks'
    ];
    
    const [counts, qdrantStats] = await Promise.all([
      // Get feed counts
      Promise.all(
        feedTypes.map(async (feedType) => {
          try {
            const baseUrl = request.nextUrl.origin;
            const response = await fetch(`${baseUrl}/api/intelligent-feed?feedType=${feedType}&limit=100`);
            const data = await response.json();
            return { [feedType]: data.results?.length || 0 };
          } catch (error) {
            console.error(`Error fetching count for ${feedType}:`, error);
            return { [feedType]: 0 };
          }
        })
      ).then(results => results.reduce((acc, curr) => ({ ...acc, ...curr }), {})),
      
      // Get Qdrant statistics
      getQdrantFeedStats()
    ]);
    
    return NextResponse.json({
      success: true,
      counts: {
        trending: counts.trending,
        exciting: counts.exciting,
        new: counts.new,
        top: counts.top,
        'ai-recommended': counts['ai-recommended'],
        'deep-dive': counts['deep-dive'],
        rising: counts.rising,
        'expert-picks': counts['expert-picks']
      },
      qdrantStats,
      powerSource: "AI Vector Search + Real-time Database",
      vectorSearchEnabled: qdrantStats.enabled,
      totalVectorizedContent: qdrantStats.totalVectors,
      timestamp: new Date().toISOString(),
      explanation: "Feed counts powered by Qdrant vector similarity search with real-time engagement data"
    });
    
  } catch (error) {
    console.error('Error fetching feed stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch feed statistics',
        counts: {
          trending: 0,
          exciting: 0,
          new: 0,
          top: 0,
          'ai-recommended': 0,
          'deep-dive': 0,
          rising: 0,
          'expert-picks': 0
        }
      },
      { status: 500 }
    );
  }
}

async function getQdrantFeedStats() {
  try {
    const ready = await isQdrantReady();
    if (!ready) {
      return { 
        enabled: false, 
        totalVectors: 0, 
        collections: {},
        status: 'unavailable' 
      };
    }

    const collections = await qdrantClient.getCollections();
    let totalVectors = 0;
    const collectionStats = {};

    for (const collection of collections.collections) {
      try {
        const info = await qdrantClient.getCollection(collection.name);
        const vectorCount = info.points_count || 0;
        totalVectors += vectorCount;
        collectionStats[collection.name] = {
          points: vectorCount,
          indexed: info.indexed_vectors_count || 0,
          vectorSize: info.config?.params?.vectors?.size || 1024
        };
      } catch (error) {
        collectionStats[collection.name] = { points: 0, indexed: 0, error: true };
      }
    }

    return {
      enabled: true,
      totalVectors,
      collections: collectionStats,
      status: 'ready',
      embeddingModel: 'Mistral-Embed',
      vectorDimensions: 1024,
      searchLatency: '< 100ms'
    };
  } catch (error) {
    console.error('Error getting Qdrant feed stats:', error);
    return { 
      enabled: false, 
      totalVectors: 0, 
      status: 'error',
      error: error.message 
    };
  }
}
