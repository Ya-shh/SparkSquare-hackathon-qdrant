"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  FiSearch, 
  FiFilter, 
  FiCalendar, 
  FiHash, 
  FiUser, 
  FiMessageCircle, 
  FiX,
  FiAlertCircle,
  FiTrendingUp,
  FiClock,
  FiFolder
} from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import toast from '@/lib/toast';

type SearchFilter = {
  type?: 'post' | 'comment' | 'user' | 'category' | 'all';
  timeframe?: 'day' | 'week' | 'month' | 'year' | 'all';
  category?: string;
  author?: string;
  sortBy?: 'relevance' | 'date' | 'popularity';
};

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface SearchSuggestion {
  id: string;
  type: 'post' | 'category' | 'user';
  title?: string;
  name?: string;
  username?: string;
  slug?: string;
  avatar?: string;
}

export default function AdvancedSearch({ className = '' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilter>({
    type: 'all',
    timeframe: 'all',
    sortBy: 'relevance'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
      
      if (
        filtersRef.current && 
        !filtersRef.current.contains(e.target as Node)
      ) {
        setShowFilters(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query || query.length < 2) {
        setSuggestions([]);
        return;
      }
      
      setIsLoading(true);
      
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [query]);
  
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!query.trim()) return;
    
    let searchQueryParams = `q=${encodeURIComponent(query.trim())}`;
    
    if (filters.type && filters.type !== 'all') {
      searchQueryParams += `&type=${filters.type}`;
    }
    
    if (filters.timeframe && filters.timeframe !== 'all') {
      searchQueryParams += `&timeframe=${filters.timeframe}`;
    }
    
    if (filters.category) {
      searchQueryParams += `&category=${encodeURIComponent(filters.category)}`;
    }
    
    if (filters.author) {
      searchQueryParams += `&author=${encodeURIComponent(filters.author)}`;
    }
    
    if (filters.sortBy && filters.sortBy !== 'relevance') {
      searchQueryParams += `&sort=${filters.sortBy}`;
    }
    
    router.push(`/search?${searchQueryParams}`);
    
    setShowSuggestions(false);
  };
  
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    switch (suggestion.type) {
      case 'post':
        router.push(`/posts/${suggestion.id}`);
        break;
      case 'category':
        router.push(`/categories/${suggestion.slug}`);
        break;
      case 'user':
        router.push(`/users/${suggestion.username}`);
        break;
    }
    
    setShowSuggestions(false);
  };
  
  const handleFilterChange = (key: keyof SearchFilter, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const resetFilters = () => {
    setFilters({
      type: 'all',
      timeframe: 'all',
      sortBy: 'relevance'
    });
    
    toast.info('Search filters have been reset');
  };
  
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'post':
        return <FiMessageCircle className="text-blue-400" />;
      case 'category':
        return <FiFolder className="text-purple-400" />;
      case 'user':
        return <FiUser className="text-green-400" />;
      default:
        return <FiHash className="text-gray-400" />;
    }
  };
  
  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSearch} className="relative">
        <div className="relative flex items-center w-full">
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search for discussions, categories, or users..."
            className="w-full bg-gray-800/70 border border-gray-700 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <FiX className="h-4 w-4" />
              </button>
            )}
            
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-full ${
                Object.values(filters).some(v => v && v !== 'all')
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <FiFilter className="h-4 w-4" />
            </button>
            
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full transition-colors"
            >
              <FiSearch className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>
      
      {}
      <AnimatePresence>
        {showSuggestions && query.length > 1 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-20 w-full mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg overflow-hidden"
          >
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center py-4">
                  <FiClock className="h-5 w-5 text-gray-400 animate-pulse" />
                  <span className="ml-2 text-gray-400">Searching...</span>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="p-4 text-center">
                  <FiAlertCircle className="h-5 w-5 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400">No suggestions found</p>
                </div>
              ) : (
                <>
                  <div className="p-2 bg-gray-800 text-xs text-gray-400 font-medium">
                    Suggestions
                  </div>
                  {suggestions.map((suggestion) => (
                    <div
                      key={`${suggestion.type}-${suggestion.id}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-4 py-3 border-b border-gray-800 hover:bg-gray-800 cursor-pointer transition-colors flex items-center"
                    >
                      <div className="mr-3">
                        {getSuggestionIcon(suggestion.type)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">
                          {suggestion.title || suggestion.name || suggestion.username}
                        </div>
                        <div className="text-xs text-gray-400 capitalize">
                          {suggestion.type}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div 
                    className="p-3 text-center bg-gray-800 cursor-pointer hover:bg-gray-700 transition-colors"
                    onClick={handleSearch}
                  >
                    <span className="text-indigo-400 font-medium flex items-center justify-center">
                      <FiSearch className="mr-2" />
                      Search for "{query}"
                    </span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            ref={filtersRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 z-20 w-80 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg overflow-hidden"
          >
            <div className="p-3 border-b border-gray-800 flex justify-between items-center">
              <h3 className="font-medium text-white">Advanced Filters</h3>
              <button
                onClick={resetFilters}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                Reset All
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Content Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['all', 'post', 'comment', 'user', 'category'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleFilterChange('type', type)}
                      className={`px-3 py-1.5 text-xs rounded-md capitalize ${
                        filters.type === type
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              
              {}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  <FiCalendar className="inline mr-1" />
                  Time Period
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'all', label: 'All Time' },
                    { value: 'day', label: 'Past Day' },
                    { value: 'week', label: 'Past Week' },
                    { value: 'month', label: 'Past Month' },
                    { value: 'year', label: 'Past Year' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleFilterChange('timeframe', option.value)}
                      className={`px-3 py-1.5 text-xs rounded-md ${
                        filters.timeframe === option.value
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {}
              <div>
                <label htmlFor="category-filter" className="block text-sm font-medium text-gray-400 mb-1">
                  <FiFolder className="inline mr-1" />
                  Category
                </label>
                <select
                  id="category-filter"
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  <FiTrendingUp className="inline mr-1" />
                  Sort By
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'relevance', label: 'Relevance' },
                    { value: 'date', label: 'Date' },
                    { value: 'popularity', label: 'Popularity' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleFilterChange('sortBy', option.value)}
                      className={`px-3 py-1.5 text-xs rounded-md ${
                        filters.sortBy === option.value
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSearch}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 