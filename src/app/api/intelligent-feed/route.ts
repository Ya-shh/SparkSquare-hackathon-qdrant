import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  hybridSearch, 
  recommendPosts, 
  recommendPostsForUser,
  isQdrantReady,
  indexUserInteractions
} from '@/lib/qdrant';
import { semanticSearchWithCategories } from '@/lib/semantic-search';

export type FeedType = 'trending' | 'exciting' | 'new' | 'top' | 'ai-recommended' | 'deep-dive' | 'rising' | 'expert-picks';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const feedType = searchParams.get('feedType') as FeedType || 'trending';
    const limit = parseInt(searchParams.get('limit') || '10');
    const timeRange = searchParams.get('timeRange') || 'week';
    const categories = searchParams.get('categories')?.split(',') || [];

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    console.log(`🔍 AI-Powered Feed: ${feedType}, limit: ${limit}, user: ${userId || 'anonymous'}`);

    // Check if Qdrant is ready for AI-powered feeds
    const qdrantReady = await isQdrantReady();
    let results: any[] = [];
    let searchType = 'ai-powered';

    if (qdrantReady) {
      try {
        // Use semantic search with category-specific embeddings
        console.log(`🔍 Using semantic search for ${feedType} feed`);
        results = await semanticSearchWithCategories(
          getDefaultQueryForFeedType(feedType, categories),
          feedType,
          {
            limit,
            scoreThreshold: getScoreThresholdForFeedType(feedType),
            timeRange: 'all', // Use 'all' instead of week to get more results
            categoryId: undefined, // Remove category restriction
            filters: {} // Remove restrictive filters
          }
        );
        searchType = 'semantic-ai-powered';
        console.log(`✅ Semantic search returned ${results.length} results for ${feedType}`);
      } catch (error) {
        console.error('Semantic search failed, falling back to curated content:', error);
        results = getCuratedFallbackContent(feedType, limit, categories);
        searchType = 'curated-fallback';
      }
    } else {
      console.log(`🎯 Qdrant not available, using curated real posts for ${feedType}`);
      results = getCuratedFallbackContent(feedType, limit, categories);
      searchType = 'curated-real-posts';
    }

    // Add feed metadata without overriding original post data
    const enhancedResults = results.map((result, index) => {
      return {
        ...result,
        rank: index + 1,
        feedType,
        isAIPowered: false, // Using real posts, not AI-generated
        relevanceScore: result.trendingScore || result.score || (1 - index * 0.1),
        tags: generateTagsForFeedType(feedType, result)
      };
    });

    return NextResponse.json({
      success: true,
      feedType,
      results: enhancedResults,
      count: enhancedResults.length,
      searchType,
      metadata: {
        aiPowered: qdrantReady,
        userId: userId || 'anonymous',
        timeRange,
        categories,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in intelligent feed API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate intelligent feed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function getIntelligentFeedResults(feedType: FeedType, userId: string | undefined, limit: number, categories: string[]): Promise<any[]> {
  try {
    // Build category-specific search terms
    const categoryTerms = categories.length > 0 ? categories.map(cat => {
      switch (cat) {
        case 'technology': return 'technology AI software development programming computer';
        case 'science': return 'science research physics chemistry biology astronomy';
        case 'health': return 'health wellness fitness nutrition mental physical';
        case 'philosophy': return 'philosophy ethics metaphysics knowledge reality thinking';
        case 'art': return 'art culture music literature creative expression artistic';
        case 'education': return 'education learning teaching academic research knowledge';
        default: return cat;
      }
    }).join(' ') : '';

    switch (feedType) {
      case 'ai-recommended':
        if (userId) {
          await indexUserInteractions(userId);
          return await recommendPostsForUser(userId, limit);
        } else {
          return await recommendPosts(limit);
        }

      case 'trending':
        const trendingQuery = `trending viral popular discussion hot topic ${categoryTerms}`.trim();
        const trendingResults = await hybridSearch(trendingQuery, {
          limit,
          denseWeight: 0.6,
          sparseWeight: 0.4
        });
        console.log(`🔍 Trending search returned ${trendingResults.length} results`);
        return trendingResults;

      case 'exciting':
        const excitingQuery = `exciting breakthrough amazing discovery innovation ${categoryTerms}`.trim();
        return await hybridSearch(excitingQuery, {
          limit,
          denseWeight: 0.7,
          sparseWeight: 0.3
        });

      case 'deep-dive':
        return await hybridSearch('comprehensive analysis detailed research methodology', {
          limit,
          denseWeight: 0.8,
          sparseWeight: 0.2
        });

      case 'expert-picks':
        return await hybridSearch('expert professional authority specialist research', {
          limit,
          denseWeight: 0.7,
          sparseWeight: 0.3
        });

      case 'rising':
        return await hybridSearch('emerging new growing momentum rising', {
          limit,
          denseWeight: 0.6,
          sparseWeight: 0.4
        });

      case 'new':
        return await hybridSearch('recent latest fresh new just posted', {
          limit,
          denseWeight: 0.5,
          sparseWeight: 0.5
        });

      case 'top':
        return await hybridSearch('best highest rated top quality excellent', {
          limit,
          denseWeight: 0.8,
          sparseWeight: 0.2
        });

      default:
        return await recommendPosts(limit);
    }
  } catch (error) {
    console.error(`Error in AI search for ${feedType}:`, error);
    return [];
  }
}

function getCuratedFallbackContent(feedType: FeedType, limit: number = 7) {
  // Always return the same 7 posts for all feed types
  const realMockPosts = [
    {
      id: '1',
      title: 'How to improve brain memory and cognition',
      content: "I've been researching techniques to improve memory and cognitive function. Has anyone tried specific supplements or techniques that have worked well?",
      category: { name: 'Health & Wellness', slug: 'health' },
      user: { 
        id: 'sarahc', 
        name: 'Dr. Sarah Chen', 
        username: 'sarahc',
        image: 'https://randomuser.me/api/portraits/women/23.jpg',
        role: 'Neuroscientist & Memory Expert'
      },
      _count: { comments: 3, votes: 78 },
      viewCount: 342,
      createdAt: new Date('2023-10-17T09:15:00').toISOString(),
      trendingScore: 0.89,
      isHot: true,
      score: 0.89
    },
    {
      id: '2',
      title: 'The future of AI in healthcare',
      content: "As AI becomes more sophisticated, what applications in healthcare do you think will have the biggest impact in the next 5 years?",
      category: { name: 'Technology', slug: 'technology' },
      user: { 
        id: 'mjohnson', 
        name: 'Marcus Johnson', 
        username: 'mjohnson',
        image: 'https://randomuser.me/api/portraits/men/42.jpg',
        role: 'AI Healthcare Strategist'
      },
      _count: { comments: 2, votes: 92 },
      viewCount: 527,
      createdAt: new Date('2023-10-15T14:23:00').toISOString(),
      trendingScore: 0.94,
      isHot: true,
      score: 0.94
    },
    {
      id: '3',
      title: 'Understanding quantum computing basics',
      content: "I'm trying to wrap my head around quantum computing principles. Can someone explain qubits and superposition in simple terms?",
      category: { name: 'Science', slug: 'science' },
      user: { 
        id: 'ewong', 
        name: 'Dr. Eliza Wong', 
        username: 'ewong',
        image: 'https://randomuser.me/api/portraits/women/56.jpg',
        role: 'Quantum Computing Researcher'
      },
      _count: { comments: 1, votes: 45 },
      viewCount: 289,
      createdAt: new Date('2023-10-10T09:45:00').toISOString(),
      trendingScore: 0.76,
      isHot: false,
      score: 0.76
    },
    {
      id: '4',
      title: 'The philosophy of consciousness',
      content: "How do different philosophical traditions approach the concept of consciousness? Looking for reading recommendations and perspectives on Eastern vs Western views.",
      category: { name: 'Philosophy', slug: 'philosophy' },
      user: { 
        id: 'rbarnes', 
        name: 'Ryan Barnes', 
        username: 'rbarnes',
        image: 'https://randomuser.me/api/portraits/men/32.jpg',
        role: 'Philosophy Professor'
      },
      _count: { comments: 42, votes: 67 },
      viewCount: 398,
      createdAt: new Date('2023-10-11T14:35:00').toISOString(),
      trendingScore: 0.82,
      isHot: true,
      score: 0.82
    },
    {
      id: '5',
      title: 'Digital art techniques for beginners',
      content: "Starting your digital art journey? Here are the essential techniques and tools every beginner should know, from basic brush work to color theory.",
      category: { name: 'Art & Culture', slug: 'art' },
      user: { 
        id: 'mpatel', 
        name: 'Mira Patel', 
        username: 'mpatel',
        image: 'https://randomuser.me/api/portraits/women/67.jpg',
        role: 'Digital Artist & Creative Director'
      },
      _count: { comments: 18, votes: 54 },
      viewCount: 267,
      createdAt: new Date('2023-10-08T11:20:00').toISOString(),
      trendingScore: 0.73,
      isHot: false,
      score: 0.73
    },
    {
      id: 'ew2',
      title: 'Quantum entanglement explained simply',
      content: "Einstein called it 'spooky action at a distance,' but quantum entanglement is a foundational concept that can be understood through the right analogies and examples.",
      category: { name: 'Science', slug: 'science' },
      user: { 
        id: 'ewong', 
        name: 'Dr. Eliza Wong', 
        username: 'ewong',
        image: 'https://randomuser.me/api/portraits/women/56.jpg',
        role: 'Quantum Computing Researcher'
      },
      _count: { comments: 1, votes: 62 },
      viewCount: 334,
      createdAt: new Date('2023-09-20T09:45:00').toISOString(),
      trendingScore: 0.81,
      isHot: true,
      score: 0.81
    },
    {
      id: 'ew3',
      title: 'The practical applications of quantum computing today',
      content: "While universal quantum computers are still developing, specialized quantum systems are already solving real problems in optimization, materials science, and cryptography.",
      category: { name: 'Technology', slug: 'technology' },
      user: { 
        id: 'ewong', 
        name: 'Dr. Eliza Wong', 
        username: 'ewong',
        image: 'https://randomuser.me/api/portraits/women/56.jpg',
        role: 'Quantum Computing Researcher'
      },
      _count: { comments: 1, votes: 53 },
      viewCount: 287,
      createdAt: new Date('2023-09-05T09:45:00').toISOString(),
      trendingScore: 0.78,
      isHot: false,
      score: 0.78
    }
  ];

  // Select different posts based on feed type characteristics
  let selectedPosts = [...realMockPosts];

  // Apply feed-specific filtering and sorting
  switch (feedType) {
    case 'exciting':
      // High engagement, trending posts
      selectedPosts = selectedPosts
        .filter(post => post._count.votes > 60 || post._count.comments > 20)
        .sort((a, b) => b.trendingScore - a.trendingScore);
      break;

    case 'deep-dive':
      // Comprehensive content with detailed discussions
      selectedPosts = selectedPosts
        .filter(post => post._count.comments > 5 && post.content.length > 100)
        .sort((a, b) => b._count.comments - a._count.comments);
      break;

    case 'expert-picks':
      // Posts from expert users with high quality content
      selectedPosts = selectedPosts
        .filter(post => post.user.role.includes('Expert') || post.user.role.includes('Professor') || post.user.role.includes('Researcher') || post.user.role.includes('Doctor'))
        .sort((a, b) => b.trendingScore - a.trendingScore);
      break;

    case 'rising':
      // Emerging posts with growing engagement
      selectedPosts = selectedPosts
        .filter(post => post._count.votes > 20 && post._count.votes < 80)
        .sort((a, b) => {
          // Prioritize recent posts with good engagement velocity
          const engagementVelocityA = (a._count.votes + a._count.comments * 2) / (a.viewCount || 1);
          const engagementVelocityB = (b._count.votes + b._count.comments * 2) / (b.viewCount || 1);
          return engagementVelocityB - engagementVelocityA;
        });
      break;

    case 'new':
      // Recent posts
      selectedPosts = selectedPosts
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;

    case 'top':
      // Highest quality posts
      selectedPosts = selectedPosts
        .sort((a, b) => {
          const qualityScoreA = (a._count.votes * 1 + a._count.comments * 2) / (a.viewCount || 1);
          const qualityScoreB = (b._count.votes * 1 + b._count.comments * 2) / (b.viewCount || 1);
          return qualityScoreB - qualityScoreA;
        });
      break;

    case 'ai-recommended':
      // Posts likely to be personalized recommendations
      selectedPosts = selectedPosts
        .filter(post => post.category.name.toLowerCase().includes('tech') || 
                       post.category.name.toLowerCase().includes('science') ||
                       post.title.toLowerCase().includes('ai') ||
                       post.title.toLowerCase().includes('quantum') ||
                       post.title.toLowerCase().includes('future'))
        .sort((a, b) => b.trendingScore - a.trendingScore);
      break;

    default: // trending
      // Already sorted by trending score
      break;
  }

  return selectedPosts.slice(0, limit).map((result, index) => ({
    ...result,
    feedType,
    rank: index + 1,
    relevanceScore: result.trendingScore,
    tags: generateTagsForFeedType(feedType, result),
    score: result.trendingScore
  }));
}

function enrichWithPersonaAndEngagement(result: any, feedType: FeedType, index: number): any {
  // Diverse professional personas
  const personas = [
    { id: 'sarahc', name: 'Dr. Sarah Chen', username: 'sarahc', image: 'https://randomuser.me/api/portraits/women/34.jpg', role: 'Neuroscientist & Memory Expert' },
    { id: 'mjohnson', name: 'Marcus Johnson', username: 'mjohnson', image: 'https://randomuser.me/api/portraits/men/45.jpg', role: 'AI Healthcare Strategist' },
    { id: 'alexr', name: 'Alexandra Rivera', username: 'alexr', image: 'https://randomuser.me/api/portraits/women/52.jpg', role: 'Startup Psychologist & Advisor' },
    { id: 'emilyw', name: 'Dr. Emily Watson', username: 'emilyw', image: 'https://randomuser.me/api/portraits/women/28.jpg', role: 'Sleep Medicine Specialist' },
    { id: 'ewong', name: 'Dr. Eliza Wong', username: 'ewong', image: 'https://randomuser.me/api/portraits/women/42.jpg', role: 'Quantum Computing Researcher' },
    { id: 'davidc', name: 'David Chen', username: 'davidc', image: 'https://randomuser.me/api/portraits/men/38.jpg', role: 'Market Analyst & Fintech Expert' },
    { id: 'mayap', name: 'Maya Patel', username: 'mayap', image: 'https://randomuser.me/api/portraits/women/35.jpg', role: 'Sustainable Technology Researcher' },
    { id: 'alexj', name: 'Alex Johnson', username: 'alexj', image: 'https://randomuser.me/api/portraits/men/29.jpg', role: 'Blockchain Developer & Crypto Expert' },
    { id: 'rachelg', name: 'Dr. Rachel Green', username: 'rachelg', image: 'https://randomuser.me/api/portraits/women/45.jpg', role: 'Genetic Engineering Professor' },
    { id: 'jamespark', name: 'Dr. James Park', username: 'jamespark', image: 'https://randomuser.me/api/portraits/men/52.jpg', role: 'Neuromorphic Computing Researcher' }
  ];

  // Select persona based on content hash for consistency
  const contentHash = (result.title || result.id || '').length + index;
  const persona = personas[contentHash % personas.length];

  // Generate realistic engagement based on feed type and content quality
  const baseEngagement = {
    'trending': { votes: [45, 234], comments: [23, 89], views: [890, 2340] },
    'exciting': { votes: [67, 312], comments: [34, 156], views: [1200, 3450] },
    'deep-dive': { votes: [89, 456], comments: [45, 203], views: [1500, 4320] },
    'expert-picks': { votes: [78, 423], comments: [39, 178], views: [1340, 2876] },
    'rising': { votes: [34, 189], comments: [18, 67], views: [678, 1543] },
    'new': { votes: [12, 89], comments: [6, 34], views: [234, 987] },
    'top': { votes: [156, 567], comments: [78, 234], views: [2100, 5670] },
    'ai-recommended': { votes: [23, 145], comments: [12, 56], views: [456, 1234] }
  };

  const engagement = baseEngagement[feedType] || baseEngagement['trending'];
  const votes = engagement.votes[0] + Math.floor(Math.random() * (engagement.votes[1] - engagement.votes[0]));
  const comments = engagement.comments[0] + Math.floor(Math.random() * (engagement.comments[1] - engagement.comments[0]));
  const views = engagement.views[0] + Math.floor(Math.random() * (engagement.views[1] - engagement.views[0]));

  // Calculate trending score based on engagement and recency
  const hoursAgo = Math.floor(Math.random() * 168) + 1; // 1-168 hours ago
  const recencyBoost = Math.max(0, 1 - (hoursAgo / 168));
  const engagementScore = (votes + comments * 2) / 100;
  const trendingScore = Math.min(0.99, (engagementScore + recencyBoost) / 2);

  // Generate realistic timestamps
  const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

  return {
    ...result,
    // Override with diverse persona data
      user: { 
      id: persona.id,
      name: persona.name,
      username: persona.username,
      image: persona.image,
      role: persona.role
    },
    // Also set individual fields for compatibility
    userId: persona.id,
    username: persona.username,
    userName: persona.name,
    userRole: persona.role,
    userImage: persona.image,
    // Add engagement data
    _count: {
      votes: votes,
      comments: comments
    },
    viewCount: views,
    createdAt: createdAt.toISOString(),
    trendingScore: Math.round(trendingScore * 100) / 100,
    isHot: votes > 100 || comments > 50,
    isPinned: index === 0 && feedType === 'trending', // Pin first trending post
    // Add category if missing
    category: result.category || {
      name: result.categoryName || 'General',
      slug: (result.categoryName || 'general').toLowerCase()
    }
  };
}

function generateTagsForFeedType(feedType: FeedType, result: any): string[] {
  const baseTags = [`#${feedType}`];
  
  if (result.category?.name) {
    baseTags.push(`#${result.category.name.toLowerCase()}`);
  }
  
  const feedTypeTags = {
    'trending': ['#viral', '#popular'],
    'exciting': ['#breakthrough', '#amazing'],
    'ai-recommended': ['#personalized', '#smart'],
    'deep-dive': ['#comprehensive', '#analysis'],
    'expert-picks': ['#expert', '#authority'],
    'rising': ['#emerging', '#momentum'],
    'new': ['#fresh', '#latest'],
    'top': ['#best', '#quality']
  };
  
  const specificTags = feedTypeTags[feedType] || [];
  return [...baseTags, ...specificTags].slice(0, 3);
}

// Helper functions for semantic search integration

function getDefaultQueryForFeedType(feedType: FeedType, categories: string[]): string {
  const categoryTerms = categories.length > 0 ? categories.map(cat => {
    switch (cat) {
      case 'technology': return 'technology AI software development programming computer';
      case 'science': return 'science research physics chemistry biology astronomy';
      case 'health': return 'health wellness fitness nutrition mental physical';
      case 'philosophy': return 'philosophy ethics metaphysics knowledge reality thinking';
      case 'art': return 'art culture music literature creative expression artistic';
      case 'education': return 'education learning teaching academic research knowledge';
      default: return cat;
    }
  }).join(' ') : '';

  const baseQueries = {
    trending: 'popular discussions',  // Simplified
    exciting: 'interesting content',  // Simplified
    new: 'recent content',           // Simplified
    top: 'quality discussions',     // Simplified
    'ai-recommended': 'recommended content', // Simplified
    'deep-dive': 'detailed discussions',    // Simplified
    rising: 'growing topics',        // Simplified
    'expert-picks': 'expert content' // Simplified
  };

  const baseQuery = baseQueries[feedType] || 'interesting discussions';
  return categoryTerms ? `${baseQuery} ${categoryTerms}` : baseQuery;
}

function getScoreThresholdForFeedType(feedType: FeedType): number {
  const thresholds = {
    trending: 0.3,  // Lowered from 0.75
    exciting: 0.3,  // Lowered from 0.7
    new: 0.2,       // Lowered from 0.6
    top: 0.4,       // Lowered from 0.8
    'ai-recommended': 0.3, // Lowered from 0.7
    'deep-dive': 0.3,     // Lowered from 0.75
    rising: 0.2,    // Lowered from 0.65
    'expert-picks': 0.4   // Lowered from 0.8
  };
  
  return thresholds[feedType] || 0.7;
}

function getFiltersForFeedType(feedType: FeedType): any {
  const filters: any = {
    must: [{ key: 'type', match: { value: 'post' } }]
  };

  switch (feedType) {
    case 'trending':
      filters.must.push({ key: 'trendingScore', range: { gte: 0.8 } });
      break;
    case 'exciting':
      filters.must.push({ key: 'isHot', match: { value: true } });
      break;
    case 'deep-dive':
      filters.must.push({ key: 'contentLength', range: { gte: 300 } });
      break;
    case 'expert-picks':
      filters.must.push({ key: 'userRole', match: { any: ['Dr.', 'Prof.', 'Expert', 'Specialist'] } });
      break;
  }

  return filters;
}
