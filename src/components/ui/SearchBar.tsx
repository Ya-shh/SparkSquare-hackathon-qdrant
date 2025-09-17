"use client";

import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX, FiMessageCircle, FiFolder, FiUser } from 'react-icons/fi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOnClickOutside } from '@/lib/hooks/useOnClickOutside';

interface SearchResult {
  id: string;
  type: 'post' | 'comment' | 'category';
  title?: string;
  content?: string;
  name?: string;
  description?: string;
  username?: string;
  userName?: string;
  categoryName?: string;
  postTitle?: string;
  postId?: string;
  slug?: string;
  score: number;
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  useOnClickOutside<HTMLDivElement>(searchRef, () => setShowResults(false));
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        performSearch();
      } else {
        setResults([]);
        setShowResults(false);
        setNoResults(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query]);
  
  const performSearch = async () => {
    if (query.length < 2) return;
    
    setIsLoading(true);
    setNoResults(false);
    
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setResults(data.results);
        setShowResults(true);
      } else {
        setResults([]);
        setNoResults(true);
      }
    } catch (error) {
      console.error('Error searching:', error);
      setResults([]);
      setNoResults(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.length >= 2) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setShowResults(false);
    }
  };
  
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setNoResults(false);
  };
  
  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'post':
        return <FiMessageCircle className="w-4 h-4 text-blue-500" />;
      case 'comment':
        return <FiMessageCircle className="w-4 h-4 text-green-500" />;
      case 'category':
        return <FiFolder className="w-4 h-4 text-purple-500" />;
      default:
        return <FiUser className="w-4 h-4 text-gray-500" />;
    }
  };
  
  const getResultLink = (result: SearchResult) => {
    switch (result.type) {
      case 'post':
        return `/posts/${result.id}`;
      case 'comment':
        return `/posts/${result.postId}#comment-${result.id}`;
      case 'category':
        return `/categories/${result.slug || result.id}`;
      default:
        return '#';
    }
  };
  
  const getResultTitle = (result: SearchResult) => {
    switch (result.type) {
      case 'post':
        return result.title || 'Untitled Post';
      case 'comment':
        return `Comment on: ${result.postTitle}`;
      case 'category':
        return result.name || 'Unnamed Category';
      default:
        return 'Unknown result';
    }
  };
  
  const getResultSubtitle = (result: SearchResult) => {
    switch (result.type) {
      case 'post':
        return `Posted in ${result.categoryName} by ${result.userName || result.username}`;
      case 'comment':
        return `By ${result.userName || result.username}`;
      case 'category':
        return result.description || 'No description';
      default:
        return '';
    }
  };
  
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };
  
  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search..."
          className="py-1.5 pl-9 pr-9 rounded-full text-sm bg-gray-800 border-2 border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary w-48 md:w-64 transition-all duration-300 text-white placeholder:text-gray-400"
        />
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <FiX className="h-4 w-4" />
          </button>
        )}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      {showResults && (
        <div className="absolute mt-2 w-full min-w-[300px] bg-gray-800 border-2 border-gray-700 shadow-xl rounded-lg z-50 max-h-[70vh] overflow-y-auto">
          <div className="p-2">
            {results.map((result) => (
              <Link
                key={`${result.type}-${result.id}`}
                href={getResultLink(result)}
                onClick={() => setShowResults(false)}
                className="block p-3 hover:bg-gray-700 rounded-md transition-colors"
              >
                <div className="flex items-start">
                  <div className="mt-0.5 mr-3 p-2 bg-gray-700 rounded-full">
                    {getEntityIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium text-white truncate">
                        {getResultTitle(result)}
                      </p>
                      <span className="ml-2 text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {Math.round(result.score * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-blue-300 mt-0.5">
                      {getResultSubtitle(result)}
                    </p>
                    {result.content && (
                      <p className="text-xs text-gray-300 mt-1">
                        {truncateText(result.content, 100)}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            
            {results.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  onClick={() => setShowResults(false)}
                  className="block text-center text-xs font-medium text-blue-400 hover:text-blue-300 py-2"
                >
                  View all results
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
      
      {noResults && showResults && (
        <div className="absolute mt-2 w-full bg-gray-800 border-2 border-gray-700 shadow-xl rounded-lg z-50">
          <div className="p-4 text-center">
            <p className="text-sm text-white">No results found for "{query}"</p>
          </div>
        </div>
      )}
    </div>
  );
} 