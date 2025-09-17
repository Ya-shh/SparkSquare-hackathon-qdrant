"use client";

import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { FiSearch, FiX, FiFilter, FiTrendingUp, FiZap, FiLayers, FiAward } from 'react-icons/fi';
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
  relevanceScore?: number;
  isSuggestion?: boolean;
  icon?: string;
  subtitle?: string;
  relevanceIndicators?: string[];
  searchType?: string;
  category?: string;
}

interface SemanticSearchBarProps {
  placeholder?: string;
  className?: string;
  showResults?: boolean;
  onSearch?: (query: string, category?: string) => void;
  onQueryChange?: (query: string) => void;
  initialQuery?: string;
  variant?: 'simple' | 'advanced' | 'semantic';
  size?: 'sm' | 'md' | 'lg';
  defaultCategory?: 'trending' | 'exciting' | 'deep-dive' | 'new' | 'top' | 'ai-recommended' | 'rising' | 'expert-picks';
}

export default function SemanticSearchBar({
  placeholder = "Search with AI...",
  className = "",
  showResults = true,
  onSearch,
  onQueryChange,
  initialQuery = "",
  variant = 'semantic',
  size = 'md',
  defaultCategory = 'trending'
}: SemanticSearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [category, setCategory] = useState(defaultCategory);
  // Always use semantic search - no need for user selection
  const searchType = 'semantic';
  const [showFilters, setShowFilters] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  useOnClickOutside<HTMLDivElement>(searchRef, () => {
    setShowDropdown(false);
    setShowFilters(false);
  });

  // Real-time search effect with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2 && variant === 'semantic' && showResults) {
        performSemanticSearch();
      } else if (query.length < 2) {
        setResults([]);
        setShowDropdown(false);
        setNoResults(false);
      }
      
      if (onQueryChange) {
        onQueryChange(query);
      }
    }, 200);
    
    return () => clearTimeout(timer);
  }, [query, category, variant, showResults, onQueryChange]);

  const performSemanticSearch = async () => {
    if (query.length < 2) return;
    
    setIsLoading(true);
    setNoResults(false);
    
    try {
      const endpoint = `/api/semantic-search`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          searchType: 'semantic',
          category,
          limit: 8,
          scoreThreshold: 0.6
        })
      });
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setResults(data.results);
        setShowDropdown(true);
        setNoResults(false);
      } else {
        setResults([]);
        setNoResults(true);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Error in semantic search:', error);
      setResults([]);
      setNoResults(true);
      setShowDropdown(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowDropdown(false);
      setShowFilters(false);
      
      if (onSearch) {
        onSearch(query.trim(), category);
      } else {
        // Default behavior: navigate to search page with semantic parameters
        const params = new URLSearchParams({
          q: query.trim(),
          type: 'semantic',
          category: category
        });
        router.push(`/search?${params.toString()}`);
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
    
    if (result.isSuggestion || result.type === 'suggestion') {
      setQuery(result.title || '');
      setTimeout(() => performSemanticSearch(), 100);
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

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'trending': return <FiTrendingUp className="w-4 h-4" />;
      case 'exciting': return <FiZap className="w-4 h-4" />;
      case 'deep-dive': return <FiLayers className="w-4 h-4" />;
      case 'expert-picks': return <FiAward className="w-4 h-4" />;
      default: return <FiSearch className="w-4 h-4" />;
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

        {variant === 'semantic' && (
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <FiFilter className={sizeClasses.icon} />
          </button>
        )}
      </form>
      
      {/* Category Filter Panel */}
      {variant === 'semantic' && showFilters && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Content Category</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'trending', label: 'Trending', icon: '🔥' },
                  { value: 'exciting', label: 'Exciting', icon: '⚡' },
                  { value: 'deep-dive', label: 'Deep Dive', icon: '🔬' },
                  { value: 'expert-picks', label: 'Expert Picks', icon: '🎓' }
                ].map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value as any)}
                    className={`p-2 rounded text-left transition-colors flex items-center space-x-2 ${
                      category === cat.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Search Results Dropdown */}
      {variant === 'semantic' && showResults && showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-400">
              <div className="w-6 h-6 border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Searching with AI...
            </div>
          ) : noResults ? (
            <div className="p-4 text-center text-gray-400">
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-1">Try different keywords or adjust search settings</p>
            </div>
          ) : (
            <div className="py-2">
              {/* Search Type Indicator */}
              <div className="px-4 py-2 border-b border-gray-700">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(category)}
                    <span className="capitalize">{searchType} search</span>
                    <span>•</span>
                    <span className="capitalize">{category}</span>
                  </div>
                  <span>{results.length} results</span>
                </div>
              </div>
              
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
                        <div className="flex items-center space-x-2">
                          {result.relevanceScore && result.relevanceScore > 0.8 && (
                            <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">
                              High Match
                            </span>
                          )}
                          {result.searchType && (
                            <span className="ml-1 px-1 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
                              {result.searchType}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {result.content && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {result.content.length > 100 ? `${result.content.substring(0, 100)}...` : result.content}
                        </p>
                      )}
                      
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
                        </div>
                        
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
              
              {results.length > 0 && query.length >= 2 && (
                <div className="border-t border-gray-700 px-4 py-2">
                  <button
                    onClick={() => {
                      const params = new URLSearchParams({
                        q: query,
                        type: searchType,
                        category: category
                      });
                      router.push(`/search?${params.toString()}`);
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
