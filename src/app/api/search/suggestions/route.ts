import { NextRequest, NextResponse } from 'next/server';
import { qdrantClient, COLLECTIONS, generateEmbedding, isQdrantReady } from '@/lib/qdrant';
import { db } from '@/lib/db';

// Semantic keyword mapping for single-character suggestions
const semanticMap: Record<string, string[]> = {
  'a': ['AI', 'Artificial Intelligence', 'Algorithms', 'Analysis', 'Apps'],
  'b': ['Brain', 'Biology', 'Business', 'Blockchain', 'Books'],
  'c': ['Computing', 'Chemistry', 'Cognitive', 'Code', 'Cloud'],
  'd': ['Data', 'Development', 'Design', 'Deep Learning', 'Digital'],
  'e': ['Engineering', 'Education', 'Energy', 'Environment', 'E-commerce'],
  'f': ['Future', 'Finance', 'Fitness', 'Food', 'Framework'],
  'g': ['Gaming', 'Genetics', 'Growth', 'Green Tech', 'Gadgets'],
  'h': ['Health', 'Hardware', 'Hacking', 'History', 'Humanities'],
  'i': ['Innovation', 'Internet', 'IoT', 'Investment', 'Ideas'],
  'j': ['JavaScript', 'Java', 'Journalism', 'Jobs', 'Justice'],
  'k': ['Knowledge', 'Kubernetes', 'Kotlin', 'Kinetics', 'Kernel'],
  'l': ['Learning', 'Leadership', 'Lifestyle', 'Logic', 'Languages'],
  'm': ['Machine Learning', 'Math', 'Medicine', 'Marketing', 'Music'],
  'n': ['Neuroscience', 'Networking', 'Nutrition', 'Nature', 'News'],
  'o': ['Open Source', 'Optimization', 'Operations', 'Online', 'Opportunities'],
  'p': ['Programming', 'Psychology', 'Physics', 'Productivity', 'Privacy'],
  'q': ['Quantum', 'Quality', 'Questions', 'Quotes', 'Quick Tips'],
  'r': ['Research', 'Robotics', 'Renewable', 'Relationships', 'Reviews'],
  's': ['Science', 'Software', 'Security', 'Startups', 'Sustainability'],
  't': ['Technology', 'Trends', 'Tools', 'Training', 'Travel'],
  'u': ['UX/UI', 'Updates', 'Universities', 'Utilities', 'Understanding'],
  'v': ['Virtual Reality', 'Venture', 'Video', 'Vision', 'Values'],
  'w': ['Web Development', 'Wellness', 'Work', 'Writing', 'World'],
  'x': ['XAI (Explainable AI)', 'Xenon', 'XML', 'Xcode', 'X-ray'],
  'y': ['YouTube', 'Yoga', 'Yield', 'Youth', 'Yearly Reviews'],
  'z': ['Zero Trust', 'Zen', 'Zettabyte', 'Zig', 'Zone']
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '5');
    
    if (!query || query.length === 0) {
      return NextResponse.json({
        suggestions: [],
        message: 'Query parameter is required'
      }, { status: 400 });
    }
    
    // For single character queries, use semantic mapping
    if (query.length === 1) {
      const lowerChar = query.toLowerCase();
      const suggestions = semanticMap[lowerChar] || [];
      
      return NextResponse.json({
        suggestions: suggestions.slice(0, limit),
        query: query,
        type: 'semantic_single_char'
      });
    }
    
    // For longer queries, provide contextual suggestions
    const contextualSuggestions = generateContextualSuggestions(query);
    
    return NextResponse.json({
      suggestions: contextualSuggestions.slice(0, limit),
      query: query,
      type: 'contextual'
    });
    
  } catch (error) {
    console.error('Error in search suggestions API:', error);
    return NextResponse.json({
      suggestions: [],
      error: 'Failed to generate suggestions'
    }, { status: 500 });
  }
}

async function getSearchSuggestions(query: string, limit: number): Promise<string[]> {
  try {
    const ready = await isQdrantReady();
    if (!ready) {
      return getBasicSuggestions(query, limit);
    }

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query, 'query');
    
    // Search across all collections to find similar content
    const [postsResults, categoriesResults] = await Promise.all([
      qdrantClient.search(COLLECTIONS.POSTS, {
        vector: queryEmbedding,
        limit: limit * 2,
      }),
      qdrantClient.search(COLLECTIONS.CATEGORIES, {
        vector: queryEmbedding,
        limit: Math.ceil(limit / 2),
      })
    ]);

    const suggestions = new Set<string>();
    
    // Extract suggestions from post titles
    postsResults.forEach((result: any) => {
      const title = result.payload?.title;
      if (title && suggestions.size < limit) {
        // Extract key phrases from titles
        const phrases = extractKeyPhrases(title, query);
        phrases.forEach(phrase => {
          if (suggestions.size < limit) {
            suggestions.add(phrase);
          }
        });
      }
    });

    // Add category names as suggestions
    categoriesResults.forEach((result: any) => {
      const name = result.payload?.name;
      if (name && suggestions.size < limit) {
        suggestions.add(name);
      }
    });

    // If we still need more suggestions, add query variations
    if (suggestions.size < limit) {
      const variations = generateQueryVariations(query);
      variations.forEach(variation => {
        if (suggestions.size < limit) {
          suggestions.add(variation);
        }
      });
    }

    return Array.from(suggestions).slice(0, limit);

  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return getBasicSuggestions(query, limit);
  }
}

async function getBasicSuggestions(query: string, limit: number): Promise<string[]> {
  try {
    // Fallback: search database for matching titles and categories
    const [posts, categories] = await Promise.all([
      db.post.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: { title: true },
        take: limit * 2
      }),
      db.category.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: { name: true },
        take: Math.ceil(limit / 2)
      })
    ]);

    const suggestions = new Set<string>();
    
    // Add post title phrases
    posts.forEach(post => {
      const phrases = extractKeyPhrases(post.title, query);
      phrases.forEach(phrase => {
        if (suggestions.size < limit) {
          suggestions.add(phrase);
        }
      });
    });

    // Add category names
    categories.forEach(category => {
      if (suggestions.size < limit) {
        suggestions.add(category.name);
      }
    });

    return Array.from(suggestions).slice(0, limit);

  } catch (error) {
    console.error('Error in basic suggestions:', error);
    return [];
  }
}

function extractKeyPhrases(text: string, query: string): string[] {
  const phrases: string[] = [];
  const words = text.toLowerCase().split(/\s+/);
  const queryWords = query.toLowerCase().split(/\s+/);
  
  // Look for phrases that contain query words
  for (let i = 0; i < words.length; i++) {
    for (let len = 2; len <= Math.min(4, words.length - i); len++) {
      const phrase = words.slice(i, i + len).join(' ');
      
      // Check if phrase contains any query words
      const containsQueryWord = queryWords.some(qWord => 
        phrase.includes(qWord) && qWord.length > 2
      );
      
      if (containsQueryWord && phrase.length > query.length) {
        phrases.push(phrase);
      }
    }
  }
  
  return phrases.slice(0, 3); // Return max 3 phrases per text
}

function generateQueryVariations(query: string): string[] {
  const variations: string[] = [];
  const words = query.split(/\s+/);
  
  if (words.length > 1) {
    // Add individual words as suggestions
    words.forEach(word => {
      if (word.length > 3) {
        variations.push(word);
      }
    });
    
    // Add partial combinations
    if (words.length > 2) {
      for (let i = 0; i < words.length - 1; i++) {
        variations.push(`${words[i]} ${words[i + 1]}`);
      }
    }
  }
  
  // Add common related terms based on context
  const contextTerms = getContextualTerms(query);
  variations.push(...contextTerms);
  
  return variations.slice(0, 5);
}

function getContextualTerms(query: string): string[] {
  const q = query.toLowerCase();
  const contextMap: Record<string, string[]> = {
    'ai': ['artificial intelligence', 'machine learning', 'neural networks', 'deep learning'],
    'brain': ['neuroscience', 'cognitive', 'memory', 'psychology'],
    'quantum': ['physics', 'computing', 'mechanics', 'entanglement'],
    'health': ['wellness', 'medical', 'healthcare', 'fitness'],
    'science': ['research', 'discovery', 'experiment', 'theory'],
    'technology': ['tech', 'innovation', 'digital', 'software'],
    'programming': ['coding', 'software', 'development', 'algorithm'],
    'memory': ['cognition', 'brain', 'learning', 'recall']
  };
  
  const terms: string[] = [];
  Object.entries(contextMap).forEach(([key, values]) => {
    if (q.includes(key)) {
      terms.push(...values);
    }
  });
  
  return terms.slice(0, 3);
}

// Generate contextual suggestions based on query content
function generateContextualSuggestions(query: string): string[] {
  const queryLower = query.toLowerCase();
  const suggestions: string[] = [];
  
  // Add common search patterns
  if (queryLower.includes('ai') || queryLower.includes('artificial')) {
    suggestions.push('Artificial Intelligence', 'Machine Learning', 'Neural Networks');
  }
  
  if (queryLower.includes('brain') || queryLower.includes('memory')) {
    suggestions.push('Cognitive Science', 'Neuroscience', 'Brain Health');
  }
  
  if (queryLower.includes('quantum')) {
    suggestions.push('Quantum Computing', 'Quantum Physics', 'Qubits');
  }
  
  if (queryLower.includes('health') || queryLower.includes('medical')) {
    suggestions.push('Healthcare', 'Wellness', 'Medicine');
  }
  
  if (queryLower.includes('tech') || queryLower.includes('software')) {
    suggestions.push('Technology', 'Programming', 'Development');
  }
  
  if (queryLower.includes('science') || queryLower.includes('research')) {
    suggestions.push('Scientific Research', 'Physics', 'Biology');
  }
  
  // Add generic suggestions if none matched
  if (suggestions.length === 0) {
    suggestions.push(
      'Try different keywords',
      'Search for specific topics',
      'Explore categories',
      'Check spelling'
    );
  }
  
  return [...new Set(suggestions)]; // Remove duplicates
}




