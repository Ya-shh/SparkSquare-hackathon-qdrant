'use client';

import React, { useState, useCallback } from 'react';
import MultiModalSearchBar from '@/components/MultiModalSearchBar';
import MultiModalResults from '@/components/MultiModalResults';
import { Sparkles, Zap, Brain, Search } from 'lucide-react';

interface SearchResult {
  id: string;
  title?: string;
  content?: string;
  text?: string;
  imageUrl?: string;
  documentUrl?: string;
  type: 'post' | 'comment' | 'document';
  score?: number;
  rank?: number;
  matchType?: string;
  metadata?: any;
  createdAt?: string;
  author?: string;
  category?: string;
}

interface SearchResponse {
  success: boolean;
  query: string;
  targetModality: string;
  results: SearchResult[];
  count: number;
  metadata: {
    searchTime: string;
    scoreThreshold: number;
    targetModality: string;
    queryType: string;
    timestamp: string;
  };
  insights: any;
}

export default function MultiModalSearchPage() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentModality, setCurrentModality] = useState<'text' | 'image' | 'document'>('text');
  const [searchMetadata, setSearchMetadata] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (
    query: string, 
    modality: string, 
    options?: any
  ) => {
    setIsSearching(true);
    setError(null);
    setCurrentModality(modality as 'text' | 'image' | 'document');

    try {
      const response = await fetch('/api/multimodal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'search',
          query,
          targetModality: modality,
          limit: options?.limit || 10,
          scoreThreshold: options?.scoreThreshold || 0.7,
          filters: options?.filters
        }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data: SearchResponse = await response.json();
      
      if (data.success) {
        setSearchResults(data.results);
        setSearchMetadata(data.metadata);
      } else {
        throw new Error('Search request failed');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleAdvancedSearch = useCallback(async (options: any) => {
    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch('/api/search/advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: options.query,
          searchType: 'hybrid',
          options: {
            limit: options.limit || 10,
            fusionMethod: 'rrf',
            scoreThreshold: options.scoreThreshold || 0.7,
            enableSparse: true,
            enableDense: true
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Advanced search failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.results);
        setSearchMetadata(data.metadata);
      } else {
        throw new Error('Advanced search request failed');
      }
    } catch (err) {
      console.error('Advanced search error:', err);
      setError(err instanceof Error ? err.message : 'Advanced search failed');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleResultClick = useCallback((result: SearchResult) => {
    // Navigate to the result's detail page
    if (result.type === 'post') {
      window.location.href = `/posts/${result.id}`;
    } else if (result.type === 'comment') {
      // Find the parent post and navigate to it
      window.location.href = `/posts/${result.id}`;
    } else if (result.type === 'document') {
      // Open document in new tab
      window.open(result.documentUrl, '_blank');
    }
  }, []);

  const handleImageClick = useCallback((imageUrl: string) => {
    // Open image in modal or new tab
    window.open(imageUrl, '_blank');
  }, []);

  const handleDocumentClick = useCallback((documentUrl: string) => {
    // Open document in new tab
    window.open(documentUrl, '_blank');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Multi-Modal Search
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Search across text, images, and documents with AI-powered understanding
            </p>
            
            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400">
                <Brain className="w-5 h-5" />
                <span>Semantic Understanding</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400">
                <Zap className="w-5 h-5" />
                <span>Cross-Modal Search</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400">
                <Sparkles className="w-5 h-5" />
                <span>AI-Powered Results</span>
              </div>
            </div>

            {/* Search Bar */}
            <MultiModalSearchBar
              onSearch={handleSearch}
              onAdvancedSearch={handleAdvancedSearch}
              placeholder="Search across text, images, and documents..."
              className="max-w-4xl"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Search className="w-5 h-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Search Error
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Searching...
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Using AI to find the best results across all content types
            </p>
          </div>
        )}

        {/* Search Results */}
        {!isSearching && searchResults.length > 0 && (
          <MultiModalResults
            results={searchResults}
            modality={currentModality}
            searchTime={searchMetadata?.searchTime}
            totalCount={searchMetadata?.count}
            onResultClick={handleResultClick}
            onImageClick={handleImageClick}
            onDocumentClick={handleDocumentClick}
          />
        )}

        {/* No Results State */}
        {!isSearching && searchResults.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Start Your Search
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Enter a query above to search across text, images, and documents
            </p>
            
            {/* Search Tips */}
            <div className="max-w-2xl mx-auto">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                Search Tips
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Use descriptive terms for better semantic matching</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Switch between text, image, and document search</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Try advanced search for hybrid results</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Adjust score threshold for more/fewer results</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


