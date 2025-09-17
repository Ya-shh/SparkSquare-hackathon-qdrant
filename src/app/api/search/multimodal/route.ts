import { NextRequest, NextResponse } from 'next/server';
import { generateAdvancedMultiModalEmbedding, performCrossModalSearch } from '@/lib/multimodal-embeddings';
import { qdrantClient, COLLECTIONS } from '@/lib/qdrant';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      query, 
      modality = 'text', 
      targetModality = 'text',
      options = {} 
    } = body;

    // Validate input
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const {
      limit = 10,
      scoreThreshold = 0.7,
      enableSemanticGapBridging = true,
      useAdvancedModel = true,
      extractImagePatches = true,
      filters = {}
    } = options;

    let searchResults;
    let searchMetadata: any = {
      searchType: 'multimodal',
      modality,
      targetModality,
      timestamp: new Date().toISOString()
    };

    // Handle different query types
    if (typeof query === 'string') {
      // Text query - perform cross-modal search
      const result = await performCrossModalSearch(query, targetModality, {
        limit,
        scoreThreshold,
        enableSemanticGapBridging,
        filters
      });
      
      searchResults = result.results;
      searchMetadata = { ...searchMetadata, ...result.searchMetadata };
    } else if (query.type === 'image' && query.data) {
      // Image query - convert base64 to buffer and search
      const imageBuffer = Buffer.from(query.data, 'base64');
      
      const result = await performCrossModalSearch(imageBuffer, targetModality, {
        limit,
        scoreThreshold,
        enableSemanticGapBridging,
        filters
      });
      
      searchResults = result.results;
      searchMetadata = { ...searchMetadata, ...result.searchMetadata };
    } else {
      // Advanced multimodal search with content analysis
      const embeddingResult = await generateAdvancedMultiModalEmbedding({
        text: query.text,
        image: query.image ? Buffer.from(query.image, 'base64') : undefined,
        document: query.document ? Buffer.from(query.document, 'base64') : undefined
      }, {
        useAdvancedModel,
        enableSemanticGapBridging,
        extractImagePatches,
        modality
      });

      // Search with the generated embeddings
      const searchPromises = Object.entries(embeddingResult.embeddings).map(async ([embeddingType, embedding]) => {
        try {
          const results = await qdrantClient.search(COLLECTIONS.MULTIMODAL, {
            vector: embedding,
            using: embeddingType,
            limit,
            score_threshold: scoreThreshold,
            filter: filters,
            with_payload: true
          });

          return results.map(result => ({
            ...result.payload,
            score: result.score,
            embeddingType,
            matchType: `${modality}-to-${embeddingType}`
          }));
        } catch (error) {
          console.error(`Search failed for ${embeddingType}:`, error);
          return [];
        }
      });

      const allResults = (await Promise.all(searchPromises)).flat();
      
      // Apply RRF fusion to combine results from different embeddings
      searchResults = applyRRFFusion(allResults, limit);
      searchMetadata.processingInfo = embeddingResult.processingInfo;
      searchMetadata.embeddingMetadata = embeddingResult.metadata;
    }

    // Enrich results with additional metadata
    const enrichedResults = await enrichSearchResults(searchResults);

    return NextResponse.json({
      success: true,
      results: enrichedResults,
      metadata: {
        ...searchMetadata,
        resultCount: enrichedResults.length,
        processingTimeMs: searchMetadata.processingTimeMs || 0
      }
    });

  } catch (error) {
    console.error('Multimodal search error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// Apply Reciprocal Rank Fusion to combine results from different embeddings
function applyRRFFusion(results: any[], limit: number, k: number = 60): any[] {
  const scoreMap = new Map<string, any>();
  
  // Group results by ID
  results.forEach((result, index) => {
    const id = result.id;
    const rrfScore = 1 / (k + index + 1);
    
    if (scoreMap.has(id)) {
      const existing = scoreMap.get(id);
      existing.fusedScore += rrfScore;
      existing.originalScores.push(result.score);
      existing.embeddingTypes.push(result.embeddingType);
    } else {
      scoreMap.set(id, {
        ...result,
        fusedScore: rrfScore,
        originalScores: [result.score],
        embeddingTypes: [result.embeddingType],
        fusionMethod: 'RRF'
      });
    }
  });
  
  // Sort by fused score and return top results
  return Array.from(scoreMap.values())
    .sort((a, b) => b.fusedScore - a.fusedScore)
    .slice(0, limit);
}

// Enrich search results with additional metadata from database
async function enrichSearchResults(results: any[]): Promise<any[]> {
  if (results.length === 0) return results;
  
  try {
    const { db } = await import('@/lib/db');
    
    const postIds = results
      .filter(r => r.type === 'post' && r.id)
      .map(r => r.id);
    
    if (postIds.length === 0) return results;
    
    const posts = await db.post.findMany({
      where: { id: { in: postIds } },
      include: {
        user: { select: { id: true, name: true, username: true, image: true } },
        category: { select: { id: true, name: true, slug: true } },
        _count: { 
          select: { 
            comments: true, 
            votes: true, 
            bookmarks: true 
          } 
        }
      }
    });
    
    // Create a lookup map
    const postLookup = new Map(posts.map(post => [post.id, post]));
    
    return results.map(result => {
      if (result.type === 'post' && postLookup.has(result.id)) {
        const post = postLookup.get(result.id);
        return {
          ...result,
          title: post?.title,
          content: post?.content,
          author: {
            id: post?.user.id,
            name: post?.user.name,
            username: post?.user.username,
            image: post?.user.image
          },
          category: {
            id: post?.category.id,
            name: post?.category.name,
            slug: post?.category.slug
          },
          stats: post?._count,
          createdAt: post?.createdAt,
          updatedAt: post?.updatedAt
        };
      }
      return result;
    });
  } catch (error) {
    console.error('Error enriching search results:', error);
    return results;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const modality = searchParams.get('modality') || 'text';
  const limit = parseInt(searchParams.get('limit') || '10');
  
  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    );
  }
  
  try {
    // Simple text-based multimodal search for GET requests
    const result = await performCrossModalSearch(query, modality as any, {
      limit,
      scoreThreshold: 0.7,
      enableSemanticGapBridging: true
    });
    
    const enrichedResults = await enrichSearchResults(result.results);
    
    return NextResponse.json({
      success: true,
      results: enrichedResults,
      metadata: result.searchMetadata
    });
  } catch (error) {
    console.error('GET multimodal search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
