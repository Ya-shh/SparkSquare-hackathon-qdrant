import { NextResponse } from 'next/server';
import { indexPost, indexComment, indexUser, isQdrantReady } from '@/lib/qdrant';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fullReindex = searchParams.get('reindex') === 'true';
    
    const ready = await isQdrantReady();
    if (!ready) {
      return NextResponse.json({ 
        success: false, 
        message: 'Qdrant is not available' 
      });
    }

    // If full reindex requested, clear existing collections first
    if (fullReindex) {
      const { qdrantClient, COLLECTIONS } = await import('@/lib/qdrant');
      const collections = Object.values(COLLECTIONS);
      
      console.log('Starting full re-index - deleting collections:', collections);
      
      for (const collection of collections) {
        try {
          // Check if collection exists first
          try {
            const collectionInfo = await qdrantClient.getCollection(collection);
            console.log(`Deleting existing collection: ${collection}`);
            await qdrantClient.deleteCollection(collection);
            console.log(`Successfully deleted collection: ${collection}`);
          } catch (error) {
            if (error.message.includes('not found')) {
              console.log(`Collection ${collection} does not exist, skipping deletion`);
            } else {
              throw error;
            }
          }
          
          // Add a small delay to ensure collection is fully deleted
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Failed to delete collection ${collection}:`, error.message);
        }
      }
      
      // Re-initialize collections with proper configuration
      const { initQdrantCollections, verifyCollectionDimensions } = await import('@/lib/qdrant');
      const success = await initQdrantCollections();
      
      if (success) {
        console.log('All collections recreated with updated dimensions');
        
        // Verify all collections have correct dimensions before proceeding
        const collectionsToVerify = Object.values(COLLECTIONS); // Use the already imported COLLECTIONS
        let allCollectionsValid = true;
        
        for (const collection of collectionsToVerify) {
          const isValid = await verifyCollectionDimensions(collection);
          if (!isValid) {
            allCollectionsValid = false;
            console.error(`Collection ${collection} has wrong dimensions, cannot proceed with indexing`);
          }
        }
        
        if (!allCollectionsValid) {
          console.error('Some collections have wrong dimensions, aborting indexing');
          return NextResponse.json({
            success: false,
            message: 'Collection dimension mismatch detected',
          }, { status: 500 });
        }
      } else {
        console.error('Failed to initialize Qdrant collections');
        return NextResponse.json({
          success: false,
          message: 'Failed to initialize Qdrant collections for re-indexing',
        }, { status: 500 });
      }
    }

    // Index the mock discussions that appear on homepage
    const mockDiscussions = [
      {
        id: '1',
        title: 'How to improve brain memory and cognition',
        content: "I've been researching techniques to improve memory and cognitive function. Has anyone tried specific supplements or techniques that have worked well?",
        userId: 'sarahc',
        categoryId: 'health',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        user: {
          id: 'sarahc',
          name: 'Sarah Chen',
          username: 'sarahc',
          email: 'sarah@example.com',
          image: 'https://randomuser.me/api/portraits/women/23.jpg',
          bio: 'Neuroscientist researching cognitive enhancement',
          createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          posts: [],
          comments: []
        },
        category: {
          id: 'health',
          name: 'Health & Wellness',
          slug: 'health',
          description: 'Discussions about health, wellness, and medical topics'
        }
      },
      {
        id: '2',
        title: 'The future of AI in healthcare',
        content: "As AI becomes more sophisticated, what applications in healthcare do you think will have the biggest impact in the next 5 years?",
        userId: 'mjohnson',
        categoryId: 'technology',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        user: {
          id: 'mjohnson',
          name: 'Marcus Johnson',
          username: 'mjohnson',
          email: 'marcus@example.com',
          image: 'https://randomuser.me/api/portraits/men/42.jpg',
          bio: 'AI Researcher focusing on healthcare applications',
          createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
          posts: [],
          comments: []
        },
        category: {
          id: 'technology',
          name: 'Technology',
          slug: 'technology',
          description: 'Latest in AI, software development, and tech innovations'
        }
      },
      {
        id: '3',
        title: 'Understanding quantum computing basics',
        content: "I'm trying to wrap my head around quantum computing principles. Can someone explain qubits and superposition in simple terms?",
        userId: 'ewong',
        categoryId: 'science',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        user: {
          id: 'ewong',
          name: 'Eliza Wong',
          username: 'ewong',
          email: 'eliza@example.com',
          image: 'https://randomuser.me/api/portraits/women/56.jpg',
          bio: 'Quantum Computing Expert and Researcher',
          createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000),
          posts: [],
          comments: []
        },
        category: {
          id: 'science',
          name: 'Science',
          slug: 'science',
          description: 'Scientific discoveries, physics, chemistry, and research'
        }
      }
    ];

    const results = {
      posts: 0,
      users: 0,
      categories: 0,
      errors: []
    };

    // Index posts
    for (const discussion of mockDiscussions) {
      try {
        const success = await indexPost(discussion as any);
        if (success) {
          results.posts++;
        } else {
          results.errors.push(`Failed to index post: ${discussion.title}`);
        }
      } catch (error) {
        results.errors.push(`Error indexing post "${discussion.title}": ${error}`);
      }
    }

    // Index users
    const uniqueUsers = Array.from(
      new Map(mockDiscussions.map(d => [d.user.id, d.user])).values()
    );

    for (const user of uniqueUsers) {
      try {
        const success = await indexUser(user as any);
        if (success) {
          results.users++;
        } else {
          results.errors.push(`Failed to index user: ${user.name}`);
        }
      } catch (error) {
        results.errors.push(`Error indexing user "${user.name}": ${error}`);
      }
    }

    // Index categories (we'll also add some mock categories)
    const mockCategories = [
      {
        id: 'health',
        name: 'Health & Wellness',
        slug: 'health',
        description: 'Share knowledge on physical and mental health, nutrition, fitness, mindfulness, and personal well-being.'
      },
      {
        id: 'technology',
        name: 'Technology',
        slug: 'technology',
        description: 'Discuss the latest in AI, software development, hardware, and tech innovations that are shaping our future.'
      },
      {
        id: 'science',
        name: 'Science',
        slug: 'science',
        description: 'Explore scientific discoveries, physics, chemistry, biology, astronomy, and the mysteries of our universe.'
      },
      {
        id: 'neuroscience',
        name: 'Neuroscience',
        slug: 'neuroscience',
        description: 'Brain research, cognitive science, and understanding the mind'
      },
      {
        id: 'ai',
        name: 'Artificial Intelligence',
        slug: 'ai',
        description: 'Machine learning, neural networks, and AI applications'
      },
      {
        id: 'quantum',
        name: 'Quantum Computing',
        slug: 'quantum',
        description: 'Quantum mechanics, quantum computing, and quantum physics'
      }
    ];

    for (const category of mockCategories) {
      try {
        const { indexCategory } = await import('@/lib/qdrant');
        const success = await indexCategory(category as any);
        if (success) {
          results.categories++;
        } else {
          results.errors.push(`Failed to index category: ${category.name}`);
        }
      } catch (error) {
        results.errors.push(`Error indexing category "${category.name}": ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: fullReindex ? 'Full re-index completed successfully' : 'Homepage discussions indexed successfully',
      results
    });

  } catch (error) {
    console.error('Error in homepage indexing:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to index homepage discussions',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Return indexing status and statistics
    const ready = await isQdrantReady();
    
    return NextResponse.json({
      qdrantReady: ready,
      message: ready 
        ? 'Qdrant is ready. Use POST to index homepage discussions.'
        : 'Qdrant is not available.',
      indexedContent: {
        description: 'Homepage discussions are automatically indexed for vector search',
        discussions: [
          'How to improve brain memory and cognition',
          'The future of AI in healthcare', 
          'Understanding quantum computing basics'
        ],
        categories: [
          'Health & Wellness',
          'Technology', 
          'Science',
          'Neuroscience',
          'Artificial Intelligence',
          'Quantum Computing'
        ]
      }
    });

  } catch (error) {
    console.error('Error checking indexing status:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to check indexing status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}






