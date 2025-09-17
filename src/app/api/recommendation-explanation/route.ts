import { NextRequest, NextResponse } from 'next/server';
import { isQdrantReady, qdrantClient, COLLECTIONS } from '@/lib/qdrant';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const feedType = searchParams.get('feedType') || 'trending';
    const resultId = searchParams.get('resultId');

    // Get Qdrant statistics
    const qdrantReady = await isQdrantReady();
    let qdrantInfo = {};
    
    if (qdrantReady) {
      const collections = await qdrantClient.getCollections();
      const collectionStats = {};
      
      for (const collection of collections.collections) {
        try {
          const info = await qdrantClient.getCollection(collection.name);
          collectionStats[collection.name] = {
            points: info.points_count || 0,
            indexed: info.indexed_vectors_count || 0,
            config: {
              vectorSize: info.config?.params?.vectors?.size || 'unknown',
              distance: info.config?.params?.vectors?.distance || 'unknown'
            }
          };
        } catch (error) {
          collectionStats[collection.name] = { error: 'Failed to fetch' };
        }
      }
      
      qdrantInfo = {
        status: 'ready',
        collections: collectionStats,
        totalCollections: collections.collections.length
      };
    } else {
      qdrantInfo = { status: 'unavailable' };
    }

    // Explanation of how different feed types work
    const feedExplanations = {
      trending: {
        title: "🔥 Trending Feed",
        description: "Shows popular discussions gaining momentum",
        algorithm: "Vector Similarity + Engagement Metrics",
        factors: [
          "Semantic similarity to trending topics",
          "Recent engagement patterns", 
          "Community interaction velocity",
          "Content freshness score"
        ],
        qdrantUsage: "Searches for content similar to 'popular discussions' using 1024-dimensional embeddings",
        scoreThreshold: 0.3,
        aiPowered: true
      },
      exciting: {
        title: "⚡ Exciting Feed", 
        description: "Discovers thrilling developments and breakthrough content",
        algorithm: "Semantic Search + Novelty Detection",
        factors: [
          "Content uniqueness score",
          "Breakthrough keyword matching",
          "User excitement indicators",
          "Topic emergence patterns"
        ],
        qdrantUsage: "Finds content matching 'interesting content' with high semantic similarity",
        scoreThreshold: 0.3,
        aiPowered: true
      },
      new: {
        title: "✨ Fresh Feed",
        description: "Latest content and recent discoveries",
        algorithm: "Temporal Ranking + Semantic Relevance", 
        factors: [
          "Publication recency",
          "Content novelty",
          "Author activity patterns",
          "Topic freshness"
        ],
        qdrantUsage: "Searches for 'recent content' with time-weighted scoring",
        scoreThreshold: 0.2,
        aiPowered: true
      },
      "ai-recommended": {
        title: "🤖 AI Curated",
        description: "Personalized recommendations based on your interests",
        algorithm: "User Profile Vector + Collaborative Filtering",
        factors: [
          "Personal interest embeddings",
          "Historical interaction patterns", 
          "Similar user preferences",
          "Content diversity scoring"
        ],
        qdrantUsage: "Matches user preference vectors against content embeddings",
        scoreThreshold: 0.3,
        aiPowered: true
      },
      "deep-dive": {
        title: "🔬 Deep Dive",
        description: "Comprehensive analysis and detailed explorations",
        algorithm: "Content Depth Analysis + Semantic Matching",
        factors: [
          "Content length and detail",
          "Expert author indicators",
          "Reference depth",
          "Analysis complexity"
        ],
        qdrantUsage: "Finds 'detailed discussions' with depth-weighted similarity",
        scoreThreshold: 0.3,
        aiPowered: true
      },
      top: {
        title: "👑 Elite",
        description: "Highest quality discussions and expert insights",
        algorithm: "Quality Score + Authority Ranking",
        factors: [
          "Author expertise level",
          "Content quality metrics",
          "Community validation",
          "Long-term engagement"
        ],
        qdrantUsage: "Searches for 'quality discussions' with authority weighting",
        scoreThreshold: 0.4,
        aiPowered: true
      },
      rising: {
        title: "🚀 Rising",
        description: "Emerging topics gaining momentum",
        algorithm: "Growth Velocity + Trend Detection",
        factors: [
          "Engagement growth rate",
          "Topic emergence speed",
          "Community adoption",
          "Virality indicators"
        ],
        qdrantUsage: "Identifies 'growing topics' using momentum-based scoring",
        scoreThreshold: 0.2,
        aiPowered: true
      },
      "expert-picks": {
        title: "🎓 Expert Zone", 
        description: "Curated content from verified specialists",
        algorithm: "Expert Authority + Content Quality",
        factors: [
          "Author credentials",
          "Domain expertise",
          "Peer recognition",
          "Content authority"
        ],
        qdrantUsage: "Matches 'expert content' with authority verification",
        scoreThreshold: 0.4,
        aiPowered: true
      }
    };

    const explanation = feedExplanations[feedType] || feedExplanations.trending;

    return NextResponse.json({
      feedType,
      explanation,
      qdrantInfo,
      vectorSearchDetails: {
        embeddingModel: "Mistral-Embed (1024 dimensions)",
        similarityMetric: "Cosine Similarity", 
        indexingTechnology: "Qdrant Vector Database",
        realTimeUpdates: true,
        fallbackStrategy: "Database search if vector search fails"
      },
      transparencyNote: "All recommendations are generated using AI-powered vector search combined with real-time engagement data. No personal data is used without consent.",
      technicalDetails: {
        vectorDimensions: 1024,
        totalVectorizedContent: qdrantInfo.collections?.posts?.points || 0,
        searchLatency: "< 100ms typical",
        updateFrequency: "Real-time"
      },
      dataPrivacy: {
        personalDataUsed: "None for anonymous users",
        trackingConsent: "Required for personalized features", 
        dataRetention: "User interactions stored locally only",
        optOut: "Available in user settings"
      }
    });

  } catch (error) {
    console.error('Error in recommendation explanation API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate explanation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
