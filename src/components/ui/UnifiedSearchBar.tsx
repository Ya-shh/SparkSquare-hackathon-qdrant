"use client";

import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useOnClickOutside } from '@/lib/hooks/useOnClickOutside';

interface SearchResult {
  id: string;
  type: 'post' | 'comment' | 'category' | 'user' | 'suggestion';
  title?: string;
  content?: string;
  name?: string;
  username?: string;
  userName?: string;
  categoryName?: string;
  postTitle?: string;
  postId?: string;
  slug?: string;
  score: number;
  isSuggestion?: boolean;
  icon?: string;
  subtitle?: string;
  relevanceIndicators?: string[];
}

interface UnifiedSearchBarProps {
  placeholder?: string;
  className?: string;
  showResults?: boolean;
  onSearch?: (query: string) => void;
  onQueryChange?: (query: string) => void;
  initialQuery?: string;
  variant?: 'simple' | 'advanced';
  size?: 'sm' | 'md' | 'lg';
}

export default function UnifiedSearchBar({
  placeholder = "Search...",
  className = "",
  showResults = true,
  onSearch,
  onQueryChange,
  initialQuery = "",
  variant = 'advanced',
  size = 'md'
}: UnifiedSearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [noResults, setNoResults] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  useOnClickOutside<HTMLDivElement>(searchRef, () => setShowDropdown(false));

  // Real-time search effect with minimal debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 1 && variant === 'advanced' && showResults) {
        performSearch();
      } else if (query.length < 1) {
        setResults([]);
        setShowDropdown(false);
        setNoResults(false);
      }
      
      // Call onQueryChange callback
      if (onQueryChange) {
        onQueryChange(query);
      }
    }, 150); // Reduced debounce for faster response
    
    return () => clearTimeout(timer);
  }, [query, variant, showResults, onQueryChange]);

  // Semantic keyword mapping for single-character suggestions
  const getSemanticSuggestions = (char: string): string[] => {
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
    
    const lowerChar = char.toLowerCase();
    return semanticMap[lowerChar] || [];
  };

  // Enhanced validation to filter out invalid mock data
  const validateSearchResults = async (results: SearchResult[]): Promise<SearchResult[]> => {
    // List of valid mock post IDs that actually exist in the post page
    const validMockPostIds = new Set([
      '1', '2', '3', '4', '5',           // Primary numeric IDs
      's1', 's2',                        // Science IDs
      't1', 't2',                        // Technology IDs
      'h1', 'h2', 'h3',                  // Health IDs
      'mj2', 'mj3',                      // Marcus Johnson additional posts
      'ew2', 'ew3',                      // Eliza Wong additional posts
      'p2',                              // Philosophy extension
      'a2',                              // Art extension
      'ed1', 'ed2'                       // Education extension
    ]);
    
    return results.filter(result => {
      // Always show suggestions
      if (result.isSuggestion || result.type === 'suggestion') {
        return true;
      }
      
      // For posts, check if they're valid mock posts or real database entries
      if (result.type === 'post') {
        // Real database entries use CUIDs (long alphanumeric strings starting with 'c')
        const isRealDatabaseEntry = /^c[a-z0-9]{20,}$/.test(result.id);
        
        // Check if it's a valid mock post ID
        const isValidMockPost = validMockPostIds.has(result.id);
        
        // Keep results that are either real database entries OR valid mock posts
        return isRealDatabaseEntry || isValidMockPost;
      }
      
      // For other types (categories, users), use the existing validation
      const isLikelyRealDatabaseEntry = /^c[a-z0-9]{20,}$/.test(result.id);
      const isLikelyMock = 
        /^\d+$/.test(result.id) ||
        (result.title && result.id === result.title.toLowerCase()) ||
        result.id.length < 5;
      
      return isLikelyRealDatabaseEntry || !isLikelyMock;
    });
  };

  const performSearch = async () => {
    if (query.length < 1) return;
    
    setIsLoading(true);
    setNoResults(false);
    
    try {
      // Special handling for single character searches
      if (query.length === 1) {
        // Use semantic suggestions API for single characters
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}&limit=8`);
        const data = await response.json();
        
        if (data.suggestions && data.suggestions.length > 0) {
          const suggestionResults = data.suggestions.map((suggestion: string, index: number) => ({
            id: `suggestion-${index}`,
            type: 'suggestion' as const,
            title: suggestion,
            content: 'Try this search suggestion',
            score: 0.9,
            isSuggestion: true
          }));
          setResults(suggestionResults);
          setShowDropdown(true);
          setNoResults(false);
        } else {
          // Fallback to semantic keyword mapping
          const semanticSuggestions = getSemanticSuggestions(query);
          if (semanticSuggestions.length > 0) {
            const suggestionResults = semanticSuggestions.map((suggestion, index) => ({
              id: `semantic-${index}`,
              type: 'suggestion' as const,
              title: suggestion,
              content: 'Related topic suggestion',
              score: 0.8,
              isSuggestion: true
            }));
            setResults(suggestionResults);
            setShowDropdown(true);
            setNoResults(false);
          } else {
            setResults([]);
            setNoResults(true);
            setShowDropdown(true);
          }
        }
        return;
      }
      
      // For longer queries, use the semantic search API
      const endpoint = `/api/semantic-search?q=${encodeURIComponent(query)}&limit=8&searchType=semantic&category=trending`;
      const response = await fetch(endpoint);
      const data = await response.json();
      
      // Validate results to ensure they exist in the database
      const validatedResults = await validateSearchResults(data.results);
      setResults(validatedResults);
      // setSuggestions(data.suggestions || []); // This line was removed from the new_code, so it's removed here.

      if (validatedResults.length > 0) {
        setShowDropdown(true);
        setNoResults(false);
      } else {
        setResults([]);
        setNoResults(query.length >= 2);
        setShowDropdown(query.length >= 2);
      }
    } catch (error) {
      console.error('Error searching:', error);
      setResults([]);
      setNoResults(query.length >= 2);
      setShowDropdown(query.length >= 2);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowDropdown(false);
      
      if (onSearch) {
        onSearch(query.trim());
      } else {
        // Default behavior: navigate to search page
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    setNoResults(false);
    if (onQueryChange) {
      onQueryChange('');
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setShowDropdown(false);
    
    // Handle suggestions by updating the search query
    if (result.isSuggestion || result.type === 'suggestion') {
      setQuery(result.title || '');
      // Trigger a new search with the suggestion
      setTimeout(() => performSearch(), 100);
      return;
    }
    
    const link = getResultLink(result);
    if (link && link !== '#') {
      router.push(link);
    }
  };

  const getResultLink = (result: SearchResult): string => {
    switch (result.type) {
      case 'post':
        return `/posts/${result.id}`;
      case 'comment':
        return `/posts/${result.postId}#comment-${result.id}`;
      case 'category':
        return `/categories/${result.slug || result.id}`;
      case 'user':
        return `/users/${result.username}`;
      default:
        return '#';
    }
  };

  const getResultIcon = (type: string) => {
    const iconClasses = "w-4 h-4";
    switch (type) {
      case 'post':
        return <div className={`${iconClasses} bg-blue-500 rounded`}></div>;
      case 'comment':
        return <div className={`${iconClasses} bg-green-500 rounded`}></div>;
      case 'category':
        return <div className={`${iconClasses} bg-purple-500 rounded`}></div>;
      default:
        return <div className={`${iconClasses} bg-gray-500 rounded`}></div>;
    }
  };

  const getResultTitle = (result: SearchResult): string => {
    // Handle suggestions first
    if (result.isSuggestion || result.type === 'suggestion') {
      return result.title || 'Search suggestion';
    }
    
    switch (result.type) {
      case 'post':
        return result.title || 'Untitled Post';
      case 'comment':
        return `Comment on: ${result.postTitle}`;
      case 'category':
        return result.name || result.title || 'Unnamed Category';
      case 'user':
        return result.userName || result.username || result.title || 'Unknown User';
      default:
        return result.title || 'Search result';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          input: "py-1.5 pl-8 pr-8 text-sm",
          icon: "h-4 w-4",
          container: "w-48"
        };
      case 'lg':
        return {
          input: "py-3 pl-12 pr-12 text-lg",
          icon: "h-6 w-6",
          container: "w-full max-w-2xl"
        };
      default: // md
        return {
          input: "py-2 pl-10 pr-10 text-base",
          icon: "h-5 w-5",
          container: "w-64"
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className={`relative ${sizeClasses.container} ${className}`} ref={searchRef}>
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={placeholder}
          className={`${sizeClasses.input} w-full rounded-full bg-gray-800 border-2 border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-300 text-white placeholder:text-gray-400`}
        />
        
        <FiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${sizeClasses.icon}`} />
        
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <FiX className={sizeClasses.icon} />
          </button>
        )}
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {variant === 'simple' && (
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            Search
          </button>
        )}
      </form>
      
      {/* Search Results Dropdown */}
      {variant === 'advanced' && showResults && showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-400">
              <div className="w-6 h-6 border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Searching...
            </div>
          ) : noResults ? (
            <div className="p-4 text-center text-gray-400">
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-1">Try different keywords or check spelling</p>
            </div>
          ) : (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}-${index}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-700 focus:bg-gray-700 focus:outline-none transition-colors group"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {result.isSuggestion && result.icon ? (
                        <span className="text-sm">{result.icon}</span>
                      ) : (
                        getResultIcon(result.type)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white truncate">
                          {getResultTitle(result)}
                        </p>
                        {result.score && result.score > 0.8 && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">
                            High Match
                          </span>
                        )}
                      </div>
                      
                      {/* Subtitle for suggestions or content preview */}
                      {result.isSuggestion && result.subtitle ? (
                        <p className="text-xs text-gray-400 mt-1">
                          {result.subtitle}
                        </p>
                      ) : result.content && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {result.content.length > 100 ? `${result.content.substring(0, 100)}...` : result.content}
                        </p>
                      )}
                      
                      {/* Enhanced metadata row */}
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center text-xs text-gray-500">
                          <span className="capitalize">{result.type}</span>
                          {result.categoryName && (
                            <>
                              <span className="mx-1">•</span>
                              <span>{result.categoryName}</span>
                            </>
                          )}
                          {result.userName && (
                            <>
                              <span className="mx-1">•</span>
                              <span>{result.userName}</span>
                            </>
                          )}
                          {result.username && !result.userName && (
                            <>
                              <span className="mx-1">•</span>
                              <span>@{result.username}</span>
                            </>
                          )}
                        </div>
                        
                        {/* Relevance indicators */}
                        {result.relevanceIndicators && result.relevanceIndicators.length > 0 && (
                          <div className="flex items-center space-x-1">
                            {result.relevanceIndicators.includes('title_match') && (
                              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" title="Title match"></span>
                            )}
                            {result.relevanceIndicators.includes('content_match') && (
                              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" title="Content match"></span>
                            )}
                            {result.relevanceIndicators.includes('category_match') && (
                              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" title="Category match"></span>
                            )}
                            {result.relevanceIndicators.includes('author_match') && (
                              <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" title="Author match"></span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              
              {/* Show more results link */}
              {results.length > 0 && query.length >= 2 && (
                <div className="border-t border-gray-700 px-4 py-2">
                  <button
                    onClick={() => {
                      router.push(`/search?q=${encodeURIComponent(query)}`);
                      setShowDropdown(false);
                    }}
                    className="w-full text-left text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View all results for "{query}" →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}



