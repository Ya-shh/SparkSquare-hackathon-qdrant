import { NextRequest, NextResponse } from 'next/server';
import { qdrantClient, isQdrantReady } from '@/lib/qdrant';

export async function GET(request: NextRequest) {
  try {
    const ready = await isQdrantReady();
    if (!ready) {
      return NextResponse.json({ error: 'Qdrant not ready' }, { status: 503 });
    }

    // Get different content for different feed types using actual Qdrant data
    const feedType = request.nextUrl.searchParams.get('feedType') || 'trending';
    
    console.log(`Testing Qdrant for feed type: ${feedType}`);
    
    // Get all posts from Qdrant
    const response = await qdrantClient.scroll('posts', {
      limit: 50,
      with_payload: true,
      with_vector: false
    });

    if (!response.points || response.points.length === 0) {
      return NextResponse.json({ 
        feedType, 
        message: 'No posts found in Qdrant',
        posts: [] 
      });
    }

    let filteredPosts = response.points;

    // Apply different filtering logic based on feed type
    switch (feedType) {
      case 'trending':
        // Filter for posts with trending keywords or tech/breaking news
        filteredPosts = response.points.filter(point => {
          const payload = point.payload as any;
          const title = payload.title?.toLowerCase() || '';
          return title.includes('breaking') || 
                 title.includes('new') || 
                 title.includes('ai') ||
                 payload.categoryName === 'Technology';
        });
        break;
        
      case 'exciting':
        // Filter for posts with exciting keywords or high engagement topics
        filteredPosts = response.points.filter(point => {
          const payload = point.payload as any;
          const title = payload.title?.toLowerCase() || '';
          return title.includes('future') || 
                 title.includes('discovery') || 
                 title.includes('breakthrough') ||
                 payload.categoryName === 'Science';
        });
        break;
        
      case 'new':
        // Filter for fresh/recent topics
        filteredPosts = response.points.filter(point => {
          const payload = point.payload as any;
          const title = payload.title?.toLowerCase() || '';
          return title.includes('2023') || 
                 title.includes('2024') || 
                 title.includes('2025') ||
                 title.includes('new');
        });
        break;
        
      case 'deep-dive':
        // Filter for analytical/comprehensive topics
        filteredPosts = response.points.filter(point => {
          const payload = point.payload as any;
          const title = payload.title?.toLowerCase() || '';
          return title.includes('understand') || 
                 title.includes('how') || 
                 title.includes('guide') ||
                 title.includes('improve');
        });
        break;
        
      case 'expert-picks':
        // Filter for educational/professional topics
        filteredPosts = response.points.filter(point => {
          const payload = point.payload as any;
          return payload.categoryName === 'Health & Wellness' ||
                 payload.categoryName === 'Science' ||
                 payload.categoryName === 'Technology';
        });
        break;
        
      default:
        // Return different slices for other types
        filteredPosts = response.points.slice(0, 10);
    }

    // Format the response
    const posts = filteredPosts.slice(0, 10).map(point => ({
      id: (point.payload as any).id || point.id.toString(),
      title: (point.payload as any).title,
      category: (point.payload as any).categoryName,
      content: (point.payload as any).content,
      username: (point.payload as any).username,
      userName: (point.payload as any).userName,
      qdrantId: point.id
    }));

    return NextResponse.json({
      success: true,
      feedType,
      totalInQdrant: response.points.length,
      filteredCount: filteredPosts.length,
      returnedCount: posts.length,
      posts
    });

  } catch (error) {
    console.error('Error testing Qdrant:', error);
    return NextResponse.json(
      { error: 'Failed to test Qdrant', details: error },
      { status: 500 }
    );
  }
}



