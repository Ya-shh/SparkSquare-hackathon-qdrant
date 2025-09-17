import { qdrantClient, COLLECTIONS, generateEmbedding, isQdrantReady } from './qdrant';

// Category-specific query prompts for semantic steering
const CATEGORY_PROMPTS = {
  trending: (topic: string) => `What's buzzing right now in ${topic}? Popular recent updates and viral discussions.`,
  exciting: (topic: string) => `Thrilling, high-impact stories about ${topic}. Edge-of-your-seat developments and breakthrough moments.`,
  'deep-dive': (topic: string) => `Comprehensive, in-depth exploration of ${topic}. Detailed analysis, research insights, and thorough explanations.`,
  new: (topic: string) => `Latest developments and fresh perspectives on ${topic}. Recent discoveries and emerging trends.`,
  top: (topic: string) => `Highest quality content about ${topic}. Best discussions, expert insights, and most valuable information.`,
  'ai-recommended': (topic: string) => `AI-curated personalized content about ${topic}. Intelligent recommendations based on user interests.`,
  rising: (topic: string) => `Fast-growing discussions gaining momentum in ${topic}. Emerging topics with increasing engagement.`,
  'expert-picks': (topic: string) => `Expert-curated content about ${topic}. Professional insights from verified specialists and thought leaders.`
};

// Enhanced semantic search with category-specific embeddings
export async function semanticSearchWithCategories(
  query: string,
  category: 'trending' | 'exciting' | 'deep-dive' | 'new' | 'top' | 'ai-recommended' | 'rising' | 'expert-picks' = 'trending',
  options: {
    limit?: number;
    scoreThreshold?: number;
    filters?: any;
    timeRange?: 'day' | 'week' | 'month' | 'year' | 'all';
    categoryId?: string;
  } = {}
) {
  const {
    limit = 15,
    scoreThreshold = 0.7,
    filters = {},
    timeRange = 'week',
    categoryId
  } = options;

  try {
    const ready = await isQdrantReady();
    if (!ready) {
      console.warn('Qdrant not available, falling back to basic search');
      return await fallbackSearch(query, limit);
    }

    // Generate category-specific query embedding
    const categoryPrompt = CATEGORY_PROMPTS[category](query);
    const queryEmbedding = await generateEmbedding(categoryPrompt, 'query');

    // Build enhanced filters
    const enhancedFilters = buildEnhancedFilters(filters, categoryId, timeRange, category);

    // Perform vector search with category-specific embedding
    const results = await qdrantClient.search(COLLECTIONS.POSTS, {
      vector: queryEmbedding,
      limit: limit * 2, // Get more results for diversity filtering
      score_threshold: scoreThreshold,
      filter: enhancedFilters,
      with_payload: true
    });

    // Apply diversity filtering and category-specific ranking
    const diversifiedResults = applyDiversityAndRanking(results, category, limit);

    return diversifiedResults.map(result => ({
      ...result.payload,
      score: result.score,
      category: category,
      relevanceScore: calculateRelevanceScore(result.payload, query, category)
    }));

  } catch (error) {
    console.error('Semantic search with categories failed:', error);
    return await fallbackSearch(query, limit);
  }
}

// Multi-vector search for different content aspects
export async function multiVectorSearch(
  query: string,
  options: {
    limit?: number;
    vectors?: ('title' | 'content' | 'category' | 'author')[];
    fusionMethod?: 'rrf' | 'dbsf';
    scoreThreshold?: number;
  } = {}
) {
  const {
    limit = 10,
    vectors = ['title', 'content'],
    fusionMethod = 'rrf',
    scoreThreshold = 0.6
  } = options;

  try {
    const ready = await isQdrantReady();
    if (!ready) {
      return await fallbackSearch(query, limit);
    }

    const queryEmbedding = await generateEmbedding(query, 'query');

    // Create multi-vector collection if it doesn't exist
    await ensureMultiVectorCollection();

    // Perform hybrid search with multiple vectors
    const results = await qdrantClient.query(COLLECTIONS.MULTIMODAL, {
      prefetch: vectors.map(vectorType => ({
        query: queryEmbedding,
        using: vectorType,
        limit: limit * 2
      })),
      query: {
        fusion: fusionMethod.toUpperCase() as any,
        ...(fusionMethod === 'rrf' && { rrf_k: 60 })
      },
      limit,
      score_threshold: scoreThreshold,
      with_payload: true
    });

    return results.points?.map(point => ({
      ...point.payload,
      score: point.score
    })) || [];

  } catch (error) {
    console.error('Multi-vector search failed:', error);
    return await fallbackSearch(query, limit);
  }
}

// Advanced hybrid search with dense and sparse vectors
export async function hybridSemanticSearch(
  query: string,
  options: {
    limit?: number;
    denseWeight?: number;
    sparseWeight?: number;
    scoreThreshold?: number;
    filters?: any;
  } = {}
) {
  const {
    limit = 10,
    denseWeight = 0.7,
    sparseWeight = 0.3,
    scoreThreshold = 0.6,
    filters = {}
  } = options;

  try {
    const ready = await isQdrantReady();
    if (!ready) {
      return await fallbackSearch(query, limit);
    }

    const queryEmbedding = await generateEmbedding(query, 'query');
    const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
    const sparseQuery = generateSparseVector(queryTerms);

    // Use Qdrant's built-in hybrid search
    const results = await qdrantClient.query(COLLECTIONS.POSTS, {
      prefetch: [
        {
          query: queryEmbedding,
          using: 'dense',
          limit: limit * 2
        },
        {
          query: sparseQuery,
          using: 'sparse',
          limit: limit * 2
        }
      ],
      query: {
        fusion: 'RRF',
        rrf_k: 60
      },
      filter: filters,
      limit,
      score_threshold: scoreThreshold,
      with_payload: true
    });

    return results.points?.map(point => ({
      ...point.payload,
      score: point.score
    })) || [];

  } catch (error) {
    console.error('Hybrid semantic search failed:', error);
    return await fallbackSearch(query, limit);
  }
}

// Content type-specific search with semantic steering
export async function searchByContentType(
  query: string,
  contentType: 'trending' | 'exciting' | 'deep-dive',
  options: {
    limit?: number;
    topic?: string;
    scoreThreshold?: number;
  } = {}
) {
  const {
    limit = 10,
    topic = query,
    scoreThreshold = 0.75
  } = options;

  try {
    const ready = await isQdrantReady();
    if (!ready) {
      return await fallbackSearch(query, limit);
    }

    // Create content-specific prompts
    const contentPrompts = {
      trending: `Viral and popular discussions about ${topic}. High engagement, trending topics, and community buzz.`,
      exciting: `Thrilling and dynamic content about ${topic}. Breakthrough moments, exciting developments, and high-energy discussions.`,
      'deep-dive': `Comprehensive analysis and detailed exploration of ${topic}. In-depth research, expert insights, and thorough explanations.`
    };

    const prompt = contentPrompts[contentType];
    const queryEmbedding = await generateEmbedding(prompt, 'query');

    // Search with content type filters
    const results = await qdrantClient.search(COLLECTIONS.POSTS, {
      vector: queryEmbedding,
      limit: limit * 2,
      score_threshold: scoreThreshold,
      filter: {
        must: [
          { key: 'type', match: { value: 'post' } },
          // Add content type indicators if available in payload
          ...(contentType === 'trending' ? [{ key: 'isHot', match: { value: true } }] : []),
          ...(contentType === 'deep-dive' ? [{ key: 'contentLength', range: { gte: 500 } }] : [])
        ]
      },
      with_payload: true
    });

    // Apply content type-specific ranking
    const rankedResults = applyContentTypeRanking(results, contentType, limit);

    return rankedResults.map(result => ({
      ...result.payload,
      score: result.score,
      contentType,
      relevanceScore: calculateContentTypeRelevance(result.payload, contentType)
    }));

  } catch (error) {
    console.error('Content type search failed:', error);
    return await fallbackSearch(query, limit);
  }
}

// Helper functions

function buildEnhancedFilters(
  baseFilters: any,
  categoryId?: string,
  timeRange?: string,
  category?: string
) {
  const filters: any = {
    must: [
      { key: 'type', match: { value: 'post' } },
      ...(baseFilters.must || [])
    ]
  };

  if (categoryId) {
    filters.must.push({ key: 'categoryId', match: { value: categoryId } });
  }

  if (timeRange && timeRange !== 'all') {
    const timeRanges = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000
    };
    const sinceTs = Date.now() - timeRanges[timeRange as keyof typeof timeRanges];
    filters.must.push({ key: 'createdAtTs', range: { gte: sinceTs } });
  }

  // Add category-specific filters (relaxed for better results)
  // Remove restrictive filters that cause empty results
  // if (category === 'trending') {
  //   filters.must.push({ key: 'trendingScore', range: { gte: 0.8 } });
  // } else if (category === 'exciting') {
  //   filters.must.push({ key: 'isHot', match: { value: true } });
  // } else if (category === 'deep-dive') {
  //   filters.must.push({ key: 'contentLength', range: { gte: 300 } });
  // }

  return filters.must.length > 1 ? filters : undefined;
}

function applyDiversityAndRanking(
  results: any[],
  category: string,
  limit: number
) {
  // Sort by score first
  const sortedResults = results.sort((a, b) => (b.score || 0) - (a.score || 0));

  // Apply diversity filtering
  const diverseResults = [];
  const seenAuthors = new Set();
  const seenCategories = new Set();

  for (const result of sortedResults) {
    const payload = result.payload || {};
    const authorId = payload.userId;
    const categoryId = payload.categoryId;

    // Ensure diversity in authors and categories
    if (
      diverseResults.length < limit &&
      (!seenAuthors.has(authorId) || diverseResults.length < limit / 2) &&
      (!seenCategories.has(categoryId) || diverseResults.length < limit / 3)
    ) {
      diverseResults.push(result);
      seenAuthors.add(authorId);
      seenCategories.add(categoryId);
    }
  }

  return diverseResults;
}

function applyContentTypeRanking(
  results: any[],
  contentType: string,
  limit: number
) {
  const scoredResults = results.map(result => {
    const payload = result.payload || {};
    let additionalScore = 0;

    // Apply content type-specific scoring
    switch (contentType) {
      case 'trending':
        additionalScore += (payload.trendingScore || 0) * 0.3;
        additionalScore += (payload.viewCount || 0) / 1000 * 0.1;
        break;
      case 'exciting':
        additionalScore += (payload.isHot ? 0.2 : 0);
        additionalScore += ((payload._count?.comments || 0) + (payload._count?.votes || 0)) / 100 * 0.1;
        break;
      case 'deep-dive':
        additionalScore += Math.min((payload.content?.length || 0) / 1000, 0.3);
        additionalScore += (payload._count?.comments || 0) / 50 * 0.1;
        break;
    }

    return {
      ...result,
      score: (result.score || 0) + additionalScore
    };
  });

  return scoredResults
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, limit);
}

function calculateRelevanceScore(payload: any, query: string, category: string) {
  let score = 0;
  const queryLower = query.toLowerCase();

  // Title match
  if (payload.title?.toLowerCase().includes(queryLower)) {
    score += 0.4;
  }

  // Content match
  if (payload.content?.toLowerCase().includes(queryLower)) {
    score += 0.3;
  }

  // Category match
  if (payload.categoryName?.toLowerCase().includes(queryLower)) {
    score += 0.2;
  }

  // Author match
  if (payload.userName?.toLowerCase().includes(queryLower) || 
      payload.username?.toLowerCase().includes(queryLower)) {
    score += 0.1;
  }

  return Math.min(score, 1.0);
}

function calculateContentTypeRelevance(payload: any, contentType: string) {
  let score = 0;

  switch (contentType) {
    case 'trending':
      score += (payload.trendingScore || 0) * 0.5;
      score += (payload.isHot ? 0.3 : 0);
      score += Math.min((payload.viewCount || 0) / 1000, 0.2);
      break;
    case 'exciting':
      score += (payload.isHot ? 0.4 : 0);
      score += Math.min(((payload._count?.comments || 0) + (payload._count?.votes || 0)) / 200, 0.3);
      score += (payload.trendingScore || 0) * 0.3;
      break;
    case 'deep-dive':
      score += Math.min((payload.content?.length || 0) / 2000, 0.4);
      score += Math.min((payload._count?.comments || 0) / 100, 0.3);
      score += (payload.user?.role?.includes('Dr.') || payload.user?.role?.includes('Prof.') ? 0.3 : 0);
      break;
  }

  return Math.min(score, 1.0);
}

function generateSparseVector(terms: string[]) {
  const indices: number[] = [];
  const values: number[] = [];
  
  terms.forEach((term, index) => {
    const termIndex = hashStringToNumber(term) % 30000;
    const weight = 1.0 / (index + 1);
    
    indices.push(termIndex);
    values.push(weight);
  });
  
  return { indices, values };
}

function hashStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

async function ensureMultiVectorCollection() {
  try {
    const collections = await qdrantClient.getCollections();
    const exists = collections.collections.some(c => c.name === COLLECTIONS.MULTIMODAL);
    
    if (!exists) {
      await qdrantClient.createCollection(COLLECTIONS.MULTIMODAL, {
        vectors: {
          title: { size: 1024, distance: 'Cosine' },
          content: { size: 1024, distance: 'Cosine' },
          category: { size: 1024, distance: 'Cosine' },
          author: { size: 1024, distance: 'Cosine' }
        }
      });
    }
  } catch (error) {
    console.error('Failed to ensure multi-vector collection:', error);
  }
}

async function fallbackSearch(query: string, limit: number) {
  try {
    // Return empty array for fallback search when database is unavailable
    console.log('Database unavailable, returning empty fallback results');
    return [];
  } catch (error) {
    console.error('Fallback search failed:', error);
    return [];
  }
}

// Export the main semantic search function for easy use
export { semanticSearchWithCategories as semanticSearch };
