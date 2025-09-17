import { qdrantClient, COLLECTIONS, generateEmbedding } from './qdrant';
import { generateSparseVector } from './qdrant';

// Intelligent recommendation system with collaborative filtering and content-based approaches
export interface RecommendationOptions {
  algorithm?: 'collaborative' | 'content' | 'hybrid';
  limit?: number;
  diversityThreshold?: number;
  enableDiversityFiltering?: boolean;
  scoreThreshold?: number;
  timeDecayFactor?: number;
  personalizeByCategory?: boolean;
  enableSerendipity?: boolean;
  serendipityFactor?: number;
}

export interface UserInteractionData {
  userId: string;
  postInteractions: { postId: string; type: 'view' | 'like' | 'comment' | 'bookmark'; timestamp: Date; weight?: number }[];
  categoryPreferences: { categoryId: string; score: number }[];
  userProfile: {
    interests: string[];
    expertise: string[];
    activityLevel: 'low' | 'medium' | 'high';
    joinDate: Date;
  };
}

export interface RecommendationResult {
  postId: string;
  score: number;
  reason: string;
  algorithm: string;
  diversity: number;
  serendipity?: number;
  metadata?: any;
}

// Main recommendation engine
export async function getIntelligentRecommendations(
  userId: string,
  options: RecommendationOptions = {}
): Promise<{
  recommendations: RecommendationResult[];
  metadata: {
    totalProcessingTime: number;
    algorithmsUsed: string[];
    diversityApplied: boolean;
    personalizedForUser: boolean;
  };
}> {
  const {
    algorithm = 'hybrid',
    limit = 10,
    diversityThreshold = 0.3,
    enableDiversityFiltering = true,
    scoreThreshold = 0.1,
    timeDecayFactor = 0.95,
    personalizeByCategory = true,
    enableSerendipity = true,
    serendipityFactor = 0.1
  } = options;

  const startTime = Date.now();
  let recommendations: RecommendationResult[] = [];
  const algorithmsUsed: string[] = [];

  try {
    // Get user interaction data
    const userData = await getUserInteractionData(userId);
    if (!userData) {
      return {
        recommendations: await getFallbackRecommendations(userId, limit),
        metadata: {
          totalProcessingTime: Date.now() - startTime,
          algorithmsUsed: ['fallback'],
          diversityApplied: false,
          personalizedForUser: false
        }
      };
    }

    // Apply different recommendation algorithms
    if (algorithm === 'collaborative' || algorithm === 'hybrid') {
      const collaborativeRecs = await getCollaborativeFilteringRecommendations(userData, {
        limit: Math.ceil(limit * 0.6),
        scoreThreshold,
        timeDecayFactor
      });
      recommendations.push(...collaborativeRecs);
      algorithmsUsed.push('collaborative_filtering');
    }

    if (algorithm === 'content' || algorithm === 'hybrid') {
      const contentRecs = await getContentBasedRecommendations(userData, {
        limit: Math.ceil(limit * 0.4),
        scoreThreshold,
        personalizeByCategory
      });
      recommendations.push(...contentRecs);
      algorithmsUsed.push('content_based');
    }

    // Apply matrix factorization for enhanced collaborative filtering
    if (algorithm === 'hybrid') {
      const matrixFactorizationRecs = await getMatrixFactorizationRecommendations(userData, {
        limit: Math.ceil(limit * 0.3),
        scoreThreshold
      });
      recommendations.push(...matrixFactorizationRecs);
      algorithmsUsed.push('matrix_factorization');
    }

    // Apply time decay to reduce bias toward recent content
    recommendations = applyTimeDecay(recommendations, timeDecayFactor);

    // Apply diversity filtering to prevent echo chambers
    if (enableDiversityFiltering) {
      recommendations = applyAdvancedDiversityFiltering(recommendations, {
        threshold: diversityThreshold,
        enableSerendipity,
        serendipityFactor
      });
    }

    // Remove duplicates and apply final scoring
    recommendations = removeDuplicatesAndRerank(recommendations);

    // Apply serendipity injection for discovery
    if (enableSerendipity) {
      recommendations = await injectSerendipitousContent(recommendations, userData, serendipityFactor);
      algorithmsUsed.push('serendipity_injection');
    }

    // Final sort and limit
    recommendations = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return {
      recommendations,
      metadata: {
        totalProcessingTime: Date.now() - startTime,
        algorithmsUsed,
        diversityApplied: enableDiversityFiltering,
        personalizedForUser: true
      }
    };
  } catch (error) {
    console.error('Error generating intelligent recommendations:', error);
    return {
      recommendations: await getFallbackRecommendations(userId, limit),
      metadata: {
        totalProcessingTime: Date.now() - startTime,
        algorithmsUsed: ['fallback'],
        diversityApplied: false,
        personalizedForUser: false
      }
    };
  }
}

// Collaborative filtering using sparse vectors (no heavy training required)
async function getCollaborativeFilteringRecommendations(
  userData: UserInteractionData,
  options: { limit: number; scoreThreshold: number; timeDecayFactor: number }
): Promise<RecommendationResult[]> {
  try {
    // Build user interaction sparse vector
    const userRatings: { [postId: string]: number } = {};
    
    userData.postInteractions.forEach(interaction => {
      const weight = getInteractionWeight(interaction.type);
      const timeDecay = calculateTimeDecay(interaction.timestamp, options.timeDecayFactor);
      userRatings[interaction.postId] = weight * timeDecay * (interaction.weight || 1);
    });

    if (Object.keys(userRatings).length < 3) {
      return []; // Need minimum interactions for collaborative filtering
    }

    const userSparseVector = generateSparseVector(userRatings);
    
    // Find similar users
    const similarUsers = await qdrantClient.search(COLLECTIONS.RECOMMENDATIONS, {
      vector: userSparseVector,
      limit: 50,
      score_threshold: options.scoreThreshold,
      with_payload: true
    });

    const recommendations: RecommendationResult[] = [];
    const seenPosts = new Set(Object.keys(userRatings));

    for (const similarUser of similarUsers) {
      const similarity = similarUser.score || 0;
      const userPayload = similarUser.payload as any;
      
      if (userPayload.recommendedPosts) {
        userPayload.recommendedPosts.forEach((postId: string, index: number) => {
          if (!seenPosts.has(postId) && recommendations.length < options.limit) {
            const score = similarity * (1 / (index + 1)); // Position-based decay
            recommendations.push({
              postId,
              score,
              reason: `Users with similar preferences also liked this (similarity: ${(similarity * 100).toFixed(1)}%)`,
              algorithm: 'collaborative_filtering',
              diversity: 0,
              metadata: { similarUserScore: similarity, position: index }
            });
            seenPosts.add(postId);
          }
        });
      }
    }

    return recommendations;
  } catch (error) {
    console.error('Collaborative filtering failed:', error);
    return [];
  }
}

// Content-based recommendations using dense vectors
async function getContentBasedRecommendations(
  userData: UserInteractionData,
  options: { limit: number; scoreThreshold: number; personalizeByCategory: boolean }
): Promise<RecommendationResult[]> {
  try {
    // Build user interest profile from interactions and preferences
    const userInterests = [
      ...userData.userProfile.interests,
      ...userData.userProfile.expertise,
      ...userData.categoryPreferences.map(cp => `category_preference_${cp.categoryId}`)
    ].join(' ');

    if (!userInterests.trim()) {
      return [];
    }

    // Generate user interest embedding
    const userInterestEmbedding = await generateEmbedding(userInterests, 'query');
    
    // Build category preference filters if enabled
    const filters: any = {
      must_not: [{ key: 'userId', match: { value: userData.userId } }],
      must: [{ key: 'type', match: { value: 'post' } }]
    };

    if (options.personalizeByCategory && userData.categoryPreferences.length > 0) {
      const preferredCategories = userData.categoryPreferences
        .filter(cp => cp.score > 0)
        .slice(0, 5)
        .map(cp => cp.categoryId);
      
      if (preferredCategories.length > 0) {
        filters.should = preferredCategories.map(categoryId => ({
          key: 'categoryId',
          match: { value: categoryId }
        }));
      }
    }

    // Search for similar content
    const searchResults = await qdrantClient.search(COLLECTIONS.POSTS, {
      vector: userInterestEmbedding,
      limit: options.limit * 2,
      score_threshold: options.scoreThreshold,
      filter: filters,
      with_payload: true
    });

    return searchResults.map((result, index) => ({
      postId: result.payload?.id || result.id,
      score: result.score || 0,
      reason: `Matches your interests in ${userData.userProfile.interests.slice(0, 2).join(', ')}`,
      algorithm: 'content_based',
      diversity: 0,
      metadata: { 
        vectorScore: result.score, 
        position: index,
        matchedInterests: userData.userProfile.interests.slice(0, 2)
      }
    }));
  } catch (error) {
    console.error('Content-based recommendations failed:', error);
    return [];
  }
}

// Matrix factorization approach for collaborative filtering without explicit training
async function getMatrixFactorizationRecommendations(
  userData: UserInteractionData,
  options: { limit: number; scoreThreshold: number }
): Promise<RecommendationResult[]> {
  try {
    // Simplified matrix factorization using user-item interaction patterns
    const userVector = buildUserFactorVector(userData);
    
    // Search for posts with similar factor patterns
    const results = await qdrantClient.search(COLLECTIONS.POSTS, {
      vector: userVector,
      limit: options.limit,
      score_threshold: options.scoreThreshold,
      filter: {
        must_not: [{ key: 'userId', match: { value: userData.userId } }],
        must: [{ key: 'type', match: { value: 'post' } }]
      },
      with_payload: true
    });

    return results.map((result, index) => ({
      postId: result.payload?.id || result.id,
      score: (result.score || 0) * 0.8, // Slight penalty for being implicit
      reason: 'Based on latent preference patterns similar to yours',
      algorithm: 'matrix_factorization',
      diversity: 0,
      metadata: { factorScore: result.score, position: index }
    }));
  } catch (error) {
    console.error('Matrix factorization recommendations failed:', error);
    return [];
  }
}

// Build user factor vector from interaction patterns
function buildUserFactorVector(userData: UserInteractionData): number[] {
  const vector = new Array(1024).fill(0); // Use same dimension as embeddings
  
  // Encode category preferences
  userData.categoryPreferences.forEach((pref, index) => {
    if (index < 100) { // Use first 100 dimensions for categories
      vector[index] = pref.score;
    }
  });
  
  // Encode interaction patterns
  const interactionTypes = ['view', 'like', 'comment', 'bookmark'];
  userData.postInteractions.forEach((interaction, index) => {
    const typeIndex = interactionTypes.indexOf(interaction.type);
    const vectorIndex = 100 + (index % 200) + typeIndex * 50; // Use next 200 dimensions
    if (vectorIndex < vector.length) {
      vector[vectorIndex] += getInteractionWeight(interaction.type);
    }
  });
  
  // Encode user activity level
  const activityMultiplier = {
    'low': 0.5,
    'medium': 1.0,
    'high': 1.5
  }[userData.userProfile.activityLevel];
  
  return vector.map(val => val * activityMultiplier);
}

// Apply time decay to reduce recency bias
function applyTimeDecay(recommendations: RecommendationResult[], decayFactor: number): RecommendationResult[] {
  const now = Date.now();
  
  return recommendations.map(rec => {
    // Assume posts have some timestamp in metadata
    const postAge = rec.metadata?.createdAt 
      ? (now - new Date(rec.metadata.createdAt).getTime()) / (1000 * 60 * 60 * 24) // Days
      : 1;
    
    const timeDecay = Math.pow(decayFactor, postAge);
    
    return {
      ...rec,
      score: rec.score * timeDecay,
      metadata: { ...rec.metadata, timeDecay, postAge }
    };
  });
}

// Advanced diversity filtering to prevent echo chambers
function applyAdvancedDiversityFiltering(
  recommendations: RecommendationResult[],
  options: { threshold: number; enableSerendipity: boolean; serendipityFactor: number }
): RecommendationResult[] {
  if (recommendations.length <= 1) return recommendations;

  const diverse: RecommendationResult[] = [recommendations[0]]; // Always include top result
  const seenCategories = new Set();
  const seenAuthors = new Set();
  const seenTopics = new Set();

  for (let i = 1; i < recommendations.length; i++) {
    const candidate = recommendations[i];
    let diversityScore = 0;
    let shouldInclude = false;

    // Calculate diversity metrics
    const category = candidate.metadata?.categoryId;
    const author = candidate.metadata?.userId;
    const topics = candidate.metadata?.topics || [];

    // Category diversity
    if (category && !seenCategories.has(category)) {
      diversityScore += 0.4;
      shouldInclude = true;
    }

    // Author diversity
    if (author && !seenAuthors.has(author)) {
      diversityScore += 0.3;
      shouldInclude = true;
    }

    // Topic diversity
    const topicOverlap = topics.filter((topic: string) => seenTopics.has(topic)).length;
    const topicDiversity = topics.length > 0 ? 1 - (topicOverlap / topics.length) : 0;
    if (topicDiversity > options.threshold) {
      diversityScore += 0.3;
      shouldInclude = true;
    }

    // Serendipity bonus for unexpected but high-quality content
    if (options.enableSerendipity && candidate.score < 0.5 && diversityScore > 0.7) {
      diversityScore += options.serendipityFactor;
      shouldInclude = true;
      candidate.serendipity = diversityScore;
    }

    candidate.diversity = diversityScore;

    // Include if diverse enough or if we haven't filled the list
    if (shouldInclude || diverse.length < 3) {
      diverse.push(candidate);
      
      if (category) seenCategories.add(category);
      if (author) seenAuthors.add(author);
      topics.forEach((topic: string) => seenTopics.add(topic));
    }
  }

  return diverse;
}

// Remove duplicates and apply final ranking
function removeDuplicatesAndRerank(recommendations: RecommendationResult[]): RecommendationResult[] {
  const seen = new Set();
  const unique = recommendations.filter(rec => {
    if (seen.has(rec.postId)) return false;
    seen.add(rec.postId);
    return true;
  });

  // Re-rank considering diversity and serendipity
  return unique.map(rec => ({
    ...rec,
    score: rec.score + (rec.diversity || 0) * 0.1 + (rec.serendipity || 0) * 0.05
  }));
}

// Inject serendipitous content for discovery
async function injectSerendipitousContent(
  recommendations: RecommendationResult[],
  userData: UserInteractionData,
  serendipityFactor: number
): Promise<RecommendationResult[]> {
  try {
    // Find content from categories user hasn't explored much
    const underexploredCategories = await findUnderexploredCategories(userData);
    
    if (underexploredCategories.length === 0) {
      return recommendations;
    }

    // Get high-quality content from underexplored categories
    const serendipitousContent = await qdrantClient.search(COLLECTIONS.POSTS, {
      vector: await generateEmbedding('high quality popular trending content', 'query'),
      limit: 3,
      filter: {
        must: [
          { key: 'type', match: { value: 'post' } },
          { key: 'categoryId', match: { any: underexploredCategories } }
        ],
        must_not: [{ key: 'userId', match: { value: userData.userId } }]
      },
      with_payload: true
    });

    const serendipitousRecs = serendipitousContent.map((result, index) => ({
      postId: result.payload?.id || result.id,
      score: (result.score || 0) * serendipityFactor,
      reason: `Discover something new in ${result.payload?.categoryName}`,
      algorithm: 'serendipity_injection',
      diversity: 1.0,
      serendipity: 1.0,
      metadata: { 
        ...result.payload, 
        isSerendipitous: true, 
        unexploredCategory: true 
      }
    }));

    // Insert serendipitous content at strategic positions
    const combined = [...recommendations];
    serendipitousRecs.forEach((rec, index) => {
      const insertPosition = Math.min((index + 1) * 3, combined.length);
      combined.splice(insertPosition, 0, rec);
    });

    return combined;
  } catch (error) {
    console.error('Serendipity injection failed:', error);
    return recommendations;
  }
}

// Find categories user hasn't explored much
async function findUnderexploredCategories(userData: UserInteractionData): Promise<string[]> {
  const { db } = await import('./db');
  
  try {
    // Get all categories
    const allCategories = await db.category.findMany({
      select: { id: true, name: true }
    });

    // Find categories with low interaction
    const exploredCategories = new Set(userData.categoryPreferences.map(cp => cp.categoryId));
    const underexplored = allCategories
      .filter(cat => !exploredCategories.has(cat.id))
      .slice(0, 5)
      .map(cat => cat.id);

    return underexplored;
  } catch (error) {
    console.error('Error finding underexplored categories:', error);
    return [];
  }
}

// Get user interaction data
async function getUserInteractionData(userId: string): Promise<UserInteractionData | null> {
  const { db } = await import('./db');
  
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        posts: { take: 10, orderBy: { createdAt: 'desc' } },
        comments: { take: 20, orderBy: { createdAt: 'desc' } },
        votes: { 
          take: 100, 
          orderBy: { createdAt: 'desc' },
          include: { post: { select: { id: true, categoryId: true } } }
        },
        bookmarks: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: { post: { select: { id: true, categoryId: true } } }
        }
      }
    });

    if (!user) return null;

    // Build interaction data
    const postInteractions: UserInteractionData['postInteractions'] = [
      ...user.votes.map(vote => ({
        postId: vote.post.id,
        type: vote.value > 0 ? 'like' as const : 'view' as const,
        timestamp: vote.createdAt,
        weight: Math.abs(vote.value)
      })),
      ...user.comments.map(comment => ({
        postId: comment.postId,
        type: 'comment' as const,
        timestamp: comment.createdAt,
        weight: 1
      })),
      ...user.bookmarks.map(bookmark => ({
        postId: bookmark.post.id,
        type: 'bookmark' as const,
        timestamp: bookmark.createdAt,
        weight: 1
      }))
    ];

    // Calculate category preferences
    const categoryStats: { [categoryId: string]: { count: number; score: number } } = {};
    
    postInteractions.forEach(interaction => {
      const post = user.votes.find(v => v.post.id === interaction.postId)?.post ||
                   user.bookmarks.find(b => b.post.id === interaction.postId)?.post;
      
      if (post?.categoryId) {
        const categoryId = post.categoryId;
        if (!categoryStats[categoryId]) {
          categoryStats[categoryId] = { count: 0, score: 0 };
        }
        categoryStats[categoryId].count++;
        categoryStats[categoryId].score += getInteractionWeight(interaction.type) * (interaction.weight || 1);
      }
    });

    const categoryPreferences = Object.entries(categoryStats).map(([categoryId, stats]) => ({
      categoryId,
      score: stats.score / stats.count // Average score
    }));

    // Determine activity level
    const totalInteractions = postInteractions.length;
    const activityLevel = totalInteractions > 50 ? 'high' : totalInteractions > 20 ? 'medium' : 'low';

    return {
      userId,
      postInteractions,
      categoryPreferences,
      userProfile: {
        interests: extractInterestsFromContent(user.posts, user.comments),
        expertise: extractExpertiseFromActivity(user.posts, user.comments),
        activityLevel,
        joinDate: user.createdAt
      }
    };
  } catch (error) {
    console.error('Error getting user interaction data:', error);
    return null;
  }
}

// Get interaction weight based on type
function getInteractionWeight(type: string): number {
  const weights = {
    'view': 0.1,
    'like': 0.5,
    'comment': 0.8,
    'bookmark': 1.0
  };
  return weights[type as keyof typeof weights] || 0.1;
}

// Calculate time decay
function calculateTimeDecay(timestamp: Date, decayFactor: number): number {
  const daysSince = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
  return Math.pow(decayFactor, daysSince);
}

// Extract interests from user content
function extractInterestsFromContent(posts: any[], comments: any[]): string[] {
  // Simple keyword extraction - in production, use NLP
  const allText = [
    ...posts.map(p => `${p.title} ${p.content}`),
    ...comments.map(c => c.content)
  ].join(' ').toLowerCase();

  const commonWords = ['technology', 'ai', 'programming', 'design', 'science', 'business', 'health'];
  return commonWords.filter(word => allText.includes(word));
}

// Extract expertise from activity patterns
function extractExpertiseFromActivity(posts: any[], comments: any[]): string[] {
  // Identify expertise areas based on posting patterns
  const expertise = [];
  
  if (posts.length > 10) expertise.push('content_creator');
  if (comments.length > 50) expertise.push('active_commenter');
  if (posts.some((p: any) => p.content.length > 1000)) expertise.push('detailed_writer');
  
  return expertise;
}

// Fallback recommendations
async function getFallbackRecommendations(userId: string, limit: number): Promise<RecommendationResult[]> {
  const { db } = await import('./db');
  
  try {
    const posts = await db.post.findMany({
      where: { userId: { not: userId } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        category: true,
        user: { select: { name: true, username: true } },
        _count: { select: { comments: true, votes: true } }
      }
    });

    return posts.map((post, index) => ({
      postId: post.id,
      score: 0.5 - (index * 0.01), // Decreasing score by recency
      reason: 'Recent popular content',
      algorithm: 'fallback',
      diversity: 0,
      metadata: post
    }));
  } catch (error) {
    console.error('Fallback recommendations failed:', error);
    return [];
  }
}

// Export utility functions
export {
  getUserInteractionData,
  getInteractionWeight,
  calculateTimeDecay,
  applyTimeDecay,
  applyAdvancedDiversityFiltering
};
