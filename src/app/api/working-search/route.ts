import { NextRequest, NextResponse } from 'next/server';
import { qdrantClient, COLLECTIONS, generateEmbedding } from '@/lib/qdrant';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (!query.trim()) {
      return NextResponse.json({ 
        results: [], 
        message: 'Empty query', 
        total: 0 
      });
    }

    // Generate embedding for search query
    const queryEmbedding = await generateEmbedding(query, 'query');
    
    // Search in Qdrant
    const searchResults = await qdrantClient.search(COLLECTIONS.POSTS, {
      vector: queryEmbedding,
      limit: limit,
      score_threshold: 0.1, // Lower threshold to get more results
    });

    // Format results
    const results = searchResults.map(result => ({
      id: result.id,
      score: result.score,
      payload: result.payload,
      type: 'qdrant_search'
    }));

    return NextResponse.json({
      results,
      total: results.length,
      query,
      message: `Found ${results.length} results using Qdrant vector search`,
      qdrant_working: true,
      vector_dimensions: queryEmbedding.length
    });

  } catch (error) {
    console.error('Working search error:', error);
    
    return NextResponse.json({
      error: 'Search failed',
      message: error.message,
      qdrant_working: false,
      results: []
    }, { status: 500 });
  }
}
