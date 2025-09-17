import { NextRequest, NextResponse } from 'next/server';
import { hybridSearch, isQdrantReady } from '@/lib/qdrant';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';

    // Get posts from Qdrant or fallback data
    let posts = [];
    
    const qdrantReady = await isQdrantReady();
    
    if (qdrantReady) {
      // Use Qdrant search
      const query = search || getQueryForFilter(filter);
      const searchResults = await hybridSearch(query, 'posts', {
        limit,
        scoreThreshold: search ? 0.3 : 0.1 // Higher threshold for specific searches
      });
      
      posts = searchResults.map(result => ({
        id: result.id,
        title: result.title,
        content: result.content,
        createdAt: result.createdAt || new Date().toISOString(),
        user: {
          id: result.userId || '1',
          name: result.userName || 'Anonymous',
          username: result.username || 'user',
          image: '/default-avatar.svg'
        },
        category: {
          id: result.categoryId || '1',
          name: result.categoryName || 'General',
          slug: result.categorySlug || 'general'
        },
        _count: {
          comments: Math.floor(Math.random() * 30) + 5,
          votes: Math.floor(Math.random() * 20) + 1
        },
        score: Math.floor(Math.random() * 15) + 1,
        sourceType: 'qdrant'
      }));
    } else {
      posts = getFallbackPosts(filter);
    }

    // Apply additional filtering if needed
    if (filter !== 'all' && !qdrantReady) {
      posts = applyFilterToPosts(posts, filter);
    }

    return NextResponse.json({
      success: true,
      posts,
      count: posts.length,
      filter,
      search,
      qdrantEnabled: qdrantReady,
      source: qdrantReady ? 'qdrant' : 'fallback',
      metadata: {
        timestamp: new Date().toISOString(),
        explanation: qdrantReady 
          ? 'Posts retrieved using AI-powered vector search' 
          : 'Posts from fallback data due to Qdrant unavailability'
      }
    });

  } catch (error) {
    console.error('Error in posts list API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch posts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function getQueryForFilter(filter: string): string {
  const queries = {
    'ai-recommended': 'recommended interesting quality discussions',
    'trending': 'popular viral trending discussions',
    'recent': 'new latest fresh content',
    'top': 'best quality highest rated discussions',
    'experts': 'expert professional specialist insights',
    'all': 'discussions posts content'
  };
  
  return queries[filter] || queries.all;
}

function applyFilterToPosts(posts: any[], filter: string) {
  switch (filter) {
    case 'trending':
      return posts.filter(p => p.score > 85).sort((a, b) => b.score - a.score);
    case 'recent':
      return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'top':
      return posts.filter(p => p._count.votes > 150).sort((a, b) => b._count.votes - a._count.votes);
    default:
      return posts;
  }
}

function getFallbackPosts(filter: string) {
  const allPosts = [
    {
      id: "1",
      title: "The future of AI in healthcare",
      content: "As AI becomes more sophisticated, what applications in healthcare do you think will have the biggest impact in the next 5 years?",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: "3",
        name: "Marcus Johnson", 
        username: "mjohnson",
        image: "/default-avatar.svg"
      },
      category: {
        id: "2",
        name: "Artificial Intelligence",
        slug: "ai"
      },
      _count: { comments: 63, votes: 201 },
      score: 89,
      sourceType: 'fallback'
    },
    {
      id: "2", 
      title: "How to improve brain memory and cognition",
      content: "I've been researching techniques to improve memory and cognitive function. Has anyone tried specific supplements or techniques that have worked well?",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: "2",
        name: "Dr. Sarah Chen",
        username: "sarahc", 
        image: "/default-avatar.svg"
      },
      category: {
        id: "4",
        name: "Health & Wellness",
        slug: "health"
      },
      _count: { comments: 47, votes: 156 },
      score: 95,
      sourceType: 'fallback'
    },
    {
      id: "3",
      title: "Understanding quantum computing basics",
      content: "I'm trying to wrap my head around quantum computing principles. Can someone explain qubits and superposition in simple terms?",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: "4",
        name: "Dr. Eliza Wong",
        username: "ewong",
        image: "/default-avatar.svg"
      },
      category: {
        id: "3",
        name: "Science",
        slug: "science"
      },
      _count: { comments: 34, votes: 89 },
      score: 76,
      sourceType: 'fallback'
    },
    {
      id: "4",
      title: "Climate engineering: Can we reverse global warming with technology?",
      content: "Exploring cutting-edge geoengineering solutions from carbon capture to solar radiation management. What are the ethical implications?",
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: "5",
        name: "David Rodriguez",
        username: "davidr",
        image: "/default-avatar.svg"
      },
      category: {
        id: "3", 
        name: "Science",
        slug: "science"
      },
      _count: { comments: 71, votes: 189 },
      score: 92,
      sourceType: 'fallback'
    },
    {
      id: "5",
      title: "The psychology behind startup failures and how to avoid them",
      content: "After analyzing 200+ failed startups, I've identified 7 psychological patterns that consistently lead to failure. Here's what every entrepreneur needs to know...",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: "6",
        name: "Emma Thompson",
        username: "emmat",
        image: "/default-avatar.svg"
      },
      category: {
        id: "5",
        name: "Business",
        slug: "business"
      },
      _count: { comments: 52, votes: 143 },
      score: 88,
      sourceType: 'fallback'
    }
  ];

  return allPosts;
}
