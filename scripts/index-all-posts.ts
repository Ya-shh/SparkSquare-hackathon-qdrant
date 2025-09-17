#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { qdrantClient, generateEmbedding, COLLECTIONS } from '../src/lib/qdrant';

const prisma = new PrismaClient();

async function indexAllPosts() {
  console.log('🚀 Indexing all posts from database to Qdrant...');
  
  try {
    // Get all posts from the database
    const posts = await prisma.post.findMany({
      include: {
        user: true,
        category: true,
        _count: {
          select: {
            comments: true,
            votes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📝 Found ${posts.length} posts to index`);

    if (posts.length === 0) {
      console.log('❌ No posts found in database');
      return;
    }

    // Clear existing posts from Qdrant
    console.log('🧹 Clearing existing posts from Qdrant...');
    await qdrantClient.delete(COLLECTIONS.POSTS, {
      filter: {
        must: [
          {
            key: 'type',
            match: { value: 'post' }
          }
        ]
      }
    });

    // Index each post
    let successCount = 0;
    let errorCount = 0;

    for (const post of posts) {
      try {
        // Generate embedding for the post content
        const content = `${post.title} ${post.content}`;
        const embedding = await generateEmbedding(content, 'passage');
        
        // Ensure embedding is 1024 dimensions
        if (embedding.length !== 1024) {
          console.log(`⚠️  Embedding dimension mismatch: expected 1024, got ${embedding.length}`);
          // Truncate or pad to 1024 dimensions
          const adjustedEmbedding = embedding.length > 1024 
            ? embedding.slice(0, 1024)
            : [...embedding, ...Array(1024 - embedding.length).fill(0)];
          embedding.splice(0, embedding.length, ...adjustedEmbedding);
        }

        // Prepare the point data
        const pointData = {
          id: parseInt(post.id.replace(/\D/g, '')) || Math.floor(Math.random() * 1000000), // Convert to integer
          vector: embedding,
          payload: {
            type: 'post',
            title: post.title,
            content: post.content,
            categoryName: post.category?.name || 'Uncategorized',
            categorySlug: post.category?.slug || 'uncategorized',
            authorName: post.user?.name || 'Anonymous',
            authorUsername: post.user?.username || 'anonymous',
            authorRole: post.user?.role || 'Member',
            authorImage: post.user?.image || null,
            commentCount: post._count.comments,
            voteCount: post._count.votes,
            viewCount: post.viewCount || 0,
            trendingScore: post.trendingScore || 0,
            isHot: post.isHot || false,
            isPinned: post.isPinned || false,
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString(),
            tags: post.tags || [],
            // Add searchable text fields
            searchableText: `${post.title} ${post.content} ${post.category?.name || ''} ${post.user?.name || ''}`.toLowerCase(),
            // Add metadata for filtering
            metadata: {
              category: post.category?.name || 'Uncategorized',
              author: post.user?.name || 'Anonymous',
              engagement: post._count.comments + post._count.votes,
              recency: new Date(post.createdAt).getTime()
            }
          }
        };

        // Insert the point into Qdrant
        await qdrantClient.upsert(COLLECTIONS.POSTS, {
          points: [pointData]
        });

        console.log(`✅ Indexed post: ${post.title}`);
        successCount++;

      } catch (error) {
        console.error(`❌ Failed to index post "${post.title}":`, error);
        errorCount++;
      }
    }

    console.log(`\n🎉 Indexing complete!`);
    console.log(`✅ Successfully indexed: ${successCount} posts`);
    console.log(`❌ Failed to index: ${errorCount} posts`);

    // Test the search
    console.log('\n🔍 Testing search with indexed posts...');
    const testQueries = [
      'AI healthcare applications',
      'quantum computing explained',
      'startup psychology patterns',
      'climate change solutions',
      'memory improvement techniques'
    ];

    for (const query of testQueries) {
      try {
        const queryEmbedding = await generateEmbedding(query, 'query');
        
        // Ensure query embedding is 1024 dimensions
        let adjustedQueryEmbedding = queryEmbedding;
        if (queryEmbedding.length !== 1024) {
          adjustedQueryEmbedding = queryEmbedding.length > 1024 
            ? queryEmbedding.slice(0, 1024)
            : [...queryEmbedding, ...Array(1024 - queryEmbedding.length).fill(0)];
        }
        
        const searchResults = await qdrantClient.search(COLLECTIONS.POSTS, {
          vector: adjustedQueryEmbedding,
          limit: 3,
          score_threshold: 0.7
        });

        console.log(`\n🔍 Query: "${query}"`);
        searchResults.forEach((result, index) => {
          console.log(`  ${index + 1}. ${result.payload?.title} (score: ${result.score?.toFixed(3)})`);
        });
      } catch (error) {
        console.error(`❌ Search test failed for "${query}":`, error);
      }
    }

  } catch (error) {
    console.error('❌ Error indexing posts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the indexing
indexAllPosts().catch(console.error);
