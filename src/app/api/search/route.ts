import { NextRequest, NextResponse } from 'next/server';
import { vectorSearch, vectorSearchWithFilters, isQdrantReady } from '@/lib/qdrant';

interface SearchResult {
  id: string;
  type: 'post' | 'comment' | 'category' | 'user';
  title?: string;
  content?: string;
  username?: string;
  userName?: string;
  categoryName?: string;
  postTitle?: string;
  slug?: string;
  score: number;
  createdAt?: string;
  avatar?: string;
  description?: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');
    const isTag = searchParams.get('tag') === 'true';
    const typesParam = searchParams.get('types');
    const categoryId = searchParams.get('categoryId') || undefined;
    const timeRange = (searchParams.get('timeRange') as any) || undefined;
    const sort = (searchParams.get('sort') as any) || 'relevance';
    const includeContent = searchParams.get('includeContent') !== 'false';
    
    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Allow single character searches for real-time search experience
    if (query.trim().length < 2) {
      const suggestions = [];
      
      if (query.trim().length === 1) {
        // Single character semantic suggestions
        const char = query.trim().toLowerCase();
        const semanticMap: Record<string, string[]> = {
          'a': ['AI discussions', 'Artificial Intelligence topics', 'Algorithm analysis'],
          'b': ['Brain health', 'Business technology', 'Blockchain innovations'],
          'c': ['Computing science', 'Cognitive research', 'Cloud infrastructure'],
          'd': ['Data analytics', 'Digital transformation', 'Deep learning'],
          'e': ['Engineering marvels', 'Educational technology', 'Energy solutions'],
          'f': ['Future predictions', 'Financial technology', 'Fitness science'],
          'g': ['Gaming industry', 'Genetic research', 'Green technology'],
          'h': ['Healthcare innovation', 'Hardware development', 'Human-computer interaction'],
          'i': ['Internet of Things', 'Investment strategies', 'Innovation culture'],
          'j': ['JavaScript frameworks', 'Job market trends', 'Journalism technology'],
          'k': ['Knowledge management', 'Kubernetes architecture', 'Kinetic energy'],
          'l': ['Learning systems', 'Leadership principles', 'Language processing'],
          'm': ['Machine learning', 'Medical breakthroughs', 'Market analysis'],
          'n': ['Neuroscience research', 'Network security', 'Nutrition science'],
          'o': ['Open source projects', 'Optimization techniques', 'Online communities'],
          'p': ['Programming paradigms', 'Psychology research', 'Privacy technologies'],
          'q': ['Quantum computing', 'Quality assurance', 'Question answering systems'],
          'r': ['Robotics engineering', 'Renewable energy', 'Research methodologies'],
          's': ['Software development', 'Scientific discovery', 'Space technology'],
          't': ['Technology trends', 'Teaching methods', 'Transportation innovation'],
          'u': ['User experience', 'Universal design', 'Urban technology'],
          'v': ['Virtual reality', 'Video technology', 'Value investing'],
          'w': ['Web development', 'Wellness technology', 'Workplace innovation'],
          'x': ['XAI explainability', 'XML technologies', 'X-ray imaging'],
          'y': ['YouTube content', 'Yield optimization', 'Youth technology'],
          'z': ['Zero trust security', 'Zen philosophy', 'Zettabyte storage']
        };
        suggestions.push(...(semanticMap[char] || ['Continue typing for better results']));
      } else {
        // Empty query suggestions
        suggestions.push(
          'Try searching for topics like "AI", "health", "technology"',
          'Search for specific discussions or users',
          'Use keywords related to your interests',
          'Explore trending topics and categories'
        );
      }
      
      return NextResponse.json({
        results: [],
        suggestions: suggestions.slice(0, 5),
        meta: {
          query: query.trim(),
          isTag,
          count: 0,
          searchType: 'suggestion_only'
        }
      });
    }

    let searchQuery = query.trim();
    if (isTag && !searchQuery.startsWith('#')) {
      searchQuery = `#${searchQuery}`;
    }

    const types = typesParam
      ? (typesParam.split(',').map((t) => t.trim()) as Array<'post' | 'comment' | 'category' | 'user'>)
      : undefined;

    // Check Qdrant availability
    const qdrantReady = await isQdrantReady();
    
    let results: SearchResult[];
    let searchType = 'vector';

    // Always use Qdrant when it's ready. Embeddings will use mock or provider per config.
    if (qdrantReady) {
      // Use vector search with filters or basic vector search
      results = (types || categoryId || timeRange || sort !== 'relevance')
        ? await vectorSearchWithFilters({ 
            query: searchQuery, 
            limit: Math.min(limit, 50), // Cap at 50 for performance
            types, 
            categoryId, 
            timeRange, 
            sort 
          })
        : await vectorSearch(searchQuery, Math.min(limit, 50));
    } else {
      // Use intelligent semantic fallback search
      searchType = 'semantic_fallback';
      results = await getFallbackSearchResults(searchQuery, limit);
      console.log(`Semantic fallback search for "${searchQuery}" returned ${results.length} results`);
    }

    // Enhance results with additional metadata
    const enhancedResults = results.map(result => ({
      ...result,
      // Add search relevance indicators
      relevanceIndicators: getRelevanceIndicators(result, searchQuery),
      // Truncate content if requested
      content: includeContent ? result.content : (result.content ? result.content.substring(0, 200) + '...' : undefined)
    }));

    // Generate search suggestions based on query
    const suggestions = generateSearchSuggestions(searchQuery, results);

    return NextResponse.json({
      results: enhancedResults,
      suggestions,
      meta: {
        query: searchQuery,
        originalQuery: query,
        isTag,
        count: enhancedResults.length,
        searchType,
        qdrantAvailable: qdrantReady,
        filters: {
          types: types || ['post', 'comment', 'category', 'user'],
          categoryId,
          timeRange,
          sort
        },
        timing: {
          searchedAt: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json(
      { 
        error: 'An error occurred during search',
        results: [],
        suggestions: ['Try a different search term', 'Check your spelling', 'Use simpler keywords'],
        meta: {
          query: '',
          count: 0,
          searchType: 'error'
        }
      },
      { status: 500 }
    );
  }
}

// Database-backed fallback search
async function getFallbackSearchResults(query: string, limit: number): Promise<SearchResult[]> {
  try {
    const db = (await import('@/lib/db')).db;
    
    // Search for posts
    const postResults = await db.post.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        user: true,
        category: true
      },
      take: Math.ceil(limit * 0.6), // 60% of results from posts
      orderBy: { createdAt: 'desc' }
    });
    
    // Search for categories
    const categoryResults = await db.category.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: Math.ceil(limit * 0.2), // 20% from categories
      orderBy: { name: 'asc' }
    });
    
    // Search for users
    const userResults = await db.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { username: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: Math.ceil(limit * 0.2), // 20% from users
      orderBy: { name: 'asc' }
    });
    
    // Convert database results to search result format
    const results: SearchResult[] = [];
    
    // Add posts
    results.push(...postResults.map(post => ({
      id: post.id,
      type: 'post' as const,
      title: post.title,
      content: post.content,
      username: post.user.username,
      userName: post.user.name,
      categoryName: post.category.name,
      score: 0.8, // Base score for database results
      createdAt: post.createdAt.toISOString()
    })));
    
    // Add categories
    results.push(...categoryResults.map(category => ({
      id: category.id,
      type: 'category' as const,
      title: category.name,
      description: category.description,
      slug: category.slug,
      score: 0.7
    })));
    
    // Add users
    results.push(...userResults.map(user => ({
      id: user.id,
      type: 'user' as const,
      title: user.name,
      username: user.username,
      userName: user.name,
      score: 0.6
    })));
    
    // Limit to requested number
    return results.slice(0, limit);
    
  } catch (error) {
    console.error('Database search fallback failed:', error);
    // Return empty array rather than fake data
    return [];
  }
}

// Generate relevance indicators for search results
function getRelevanceIndicators(result: SearchResult, query: string) {
  const indicators = [];
  const queryLower = query.toLowerCase();
  
  if (result.title?.toLowerCase().includes(queryLower)) {
    indicators.push('title_match');
  }
  if (result.content?.toLowerCase().includes(queryLower)) {
    indicators.push('content_match');
  }
  if (result.categoryName?.toLowerCase().includes(queryLower)) {
    indicators.push('category_match');
  }
  if (result.userName?.toLowerCase().includes(queryLower) || result.username?.toLowerCase().includes(queryLower)) {
    indicators.push('author_match');
  }
  if (result.score && result.score > 0.8) {
    indicators.push('high_relevance');
  }
  
  return indicators;
}

// Generate search suggestions based on query and results
function generateSearchSuggestions(query: string, results: SearchResult[]): string[] {
  const suggestions: string[] = [];
  const queryLower = query.toLowerCase();
  
  // Filter out low-scoring results for suggestions
  const relevantResults = results.filter(result => result.score > 0.6);
  
  // If no relevant results, suggest broader terms
  if (relevantResults.length === 0) {
    suggestions.push(
      'Try broader search terms',
      'Check spelling and try again',
      'Search for topics like "technology", "science", "health"'
    );
    return suggestions.slice(0, 5);
  }
  
  // Suggest related categories from high-scoring results only
  const relevantCategories = [...new Set(relevantResults
    .filter(r => r.categoryName && r.score > 0.7)
    .map(r => r.categoryName)
    .filter(Boolean))];
    
  if (relevantCategories.length > 0) {
    suggestions.push(`Related: ${relevantCategories.slice(0, 3).join(', ')}`);
  }
  
  // Suggest related authors from high-scoring results
  const relevantAuthors = [...new Set(relevantResults
    .filter(r => (r.userName || r.username) && r.score > 0.7)
    .map(r => r.userName || r.username)
    .filter(Boolean))];
    
  if (relevantAuthors.length > 0) {
    suggestions.push(`Experts: ${relevantAuthors.slice(0, 2).join(', ')}`);
  }
  
  // Add query-specific suggestions
  if (queryLower.includes('ai') || queryLower.includes('artificial')) {
    suggestions.push('Try: "Machine Learning", "AI Ethics", "Neural Networks"');
  }
  
  if (queryLower.includes('neuro') || queryLower.includes('brain')) {
    suggestions.push('Try: "Cognitive Science", "Memory Research", "Psychology"');
  }
  
  return suggestions.slice(0, 5);
} 