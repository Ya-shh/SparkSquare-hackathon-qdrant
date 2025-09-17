"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiLoader, FiMessageCircle, FiFolder, FiUser, FiImage, FiFileText, FiSettings, FiZap } from 'react-icons/fi';
import MultiModalSearchBar from '@/components/MultiModalSearchBar';
import MultiModalResults from '@/components/MultiModalResults';

interface SearchResult {
  id: string;
  type: 'post' | 'comment' | 'category' | 'document' | 'image';
  title?: string;
  content?: string;
  text?: string;
  name?: string;
  description?: string;
  username?: string;
  userName?: string;
  categoryName?: string;
  postTitle?: string;
  postId?: string;
  slug?: string;
  score: number;
  matchType?: string;
  embeddingType?: string;
  fusedScore?: number;
  imageUrl?: string;
  documentUrl?: string;
  metadata?: any;
  author?: any;
  category?: any;
  stats?: any;
  createdAt?: string;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const isTag = searchParams.get('tag') === 'true';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'traditional' | 'multimodal'>('traditional');
  const [searchMetadata, setSearchMetadata] = useState<any>(null);
  const [multimodalQuery, setMultimodalQuery] = useState<string>('');
  
  // Traditional search effect
  useEffect(() => {
    const performSearch = async () => {
      if (!query || searchMode === 'multimodal') {
        setResults([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const apiUrl = `/api/search?q=${encodeURIComponent(query)}${isTag ? '&tag=true' : ''}&limit=20`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error('Search request failed');
        }
        
        const data = await response.json();
        
        if (data.results) {
          setResults(data.results);
          setSearchMetadata(data.metadata);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error('Error performing search:', err);
        setError('An error occurred while searching. Please try again.');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    performSearch();
  }, [query, isTag, searchMode]);

  // Multimodal search handlers
  const handleMultiModalSearch = async (searchQuery: string, modality: string, options?: any) => {
    setIsLoading(true);
    setError(null);
    setMultimodalQuery(searchQuery);
    
    try {
      // Use enhanced search if Mixtral features are enabled
      const useEnhancedSearch = options?.enableMistralEnhancement || options?.searchIntelligence !== 'basic';
      const apiEndpoint = useEnhancedSearch ? '/api/search/enhanced' : '/api/search/multimodal';
      
      const requestBody = useEnhancedSearch ? {
        query: searchQuery,
        searchMode: options?.searchIntelligence || 'enhanced',
        options: {
          limit: 20,
          scoreThreshold: 0.7,
          enableQueryEnhancement: options?.enableMistralEnhancement !== false,
          enableSemanticExpansion: options?.enableQueryExpansion !== false,
          enableCrossModalSearch: true,
          ...options
        },
        userContext: {
          // Add user context for better personalization
          previousQueries: [],
          userInterests: []
        }
      } : {
        query: searchQuery,
        modality,
        targetModality: modality,
        options: {
          limit: 20,
          scoreThreshold: 0.7,
          enableSemanticGapBridging: true,
          useAdvancedModel: true,
          ...options
        }
      };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`${useEnhancedSearch ? 'Enhanced' : 'Multimodal'} search request failed`);
      }

      const data = await response.json();
      
      if (data.success && data.results) {
        setResults(data.results);
        setSearchMetadata({
          ...data.metadata,
          enhancedSearchUsed: useEnhancedSearch,
          mixtralEnhanced: options?.enableMistralEnhancement,
          searchIntelligence: options?.searchIntelligence
        });
      } else {
        setResults([]);
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      console.error('Error performing search:', err);
      setError('An error occurred during search. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdvancedMultiModalSearch = async (options: any) => {
    return handleMultiModalSearch(options.query, options.modality, options);
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'post':
        return <FiMessageCircle className="w-5 h-5 text-blue-500" />;
      case 'comment':
        return <FiMessageCircle className="w-5 h-5 text-green-500" />;
      case 'category':
        return <FiFolder className="w-5 h-5 text-purple-500" />;
      case 'image':
        return <FiImage className="w-5 h-5 text-pink-500" />;
      case 'document':
        return <FiFileText className="w-5 h-5 text-orange-500" />;
      default:
        return <FiUser className="w-5 h-5 text-gray-500" />;
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
  
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Search Mode Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {searchMode === 'multimodal' ? 'AI-Powered Multimodal Search' : 'Traditional Search'}
        </h1>
        <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setSearchMode('traditional')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              searchMode === 'traditional'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Traditional
          </button>
          <button
            onClick={() => setSearchMode('multimodal')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
              searchMode === 'multimodal'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FiZap className="w-4 h-4" />
            <span>AI Multimodal</span>
          </button>
        </div>
      </div>

      {/* Multimodal Search Interface */}
      {searchMode === 'multimodal' && (
        <div className="mb-8">
          <MultiModalSearchBar
            onSearch={handleMultiModalSearch}
            onAdvancedSearch={handleAdvancedMultiModalSearch}
            placeholder="Search across text, images, and documents with AI..."
            className="mb-4"
          />
        </div>
      )}

      {/* Traditional Search Header */}
      {searchMode === 'traditional' && query && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">
            {isTag ? (
              <span>Posts tagged with <span className="text-indigo-400">#{query}</span></span>
            ) : (
              <span>Search Results for "{query}"</span>
            )}
          </h2>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground">
          {isLoading 
            ? 'Searching...' 
            : results.length > 0 
              ? `Found ${results.length} result${results.length === 1 ? '' : 's'}`
              : searchMode === 'multimodal' && !multimodalQuery
                ? 'Enter a search query to begin'
                : 'No results found'
          }
        </p>
        {searchMetadata && (
          <div className="text-sm text-gray-400 flex flex-wrap items-center gap-2">
            {searchMetadata.searchType && (
              <span className="bg-gray-800 px-2 py-1 rounded text-xs">
                {searchMetadata.searchType}
              </span>
            )}
            {searchMetadata.enhancedSearchUsed && (
              <span className="bg-purple-900 text-purple-300 px-2 py-1 rounded text-xs">
                Enhanced Search
              </span>
            )}
            {searchMetadata.mixtralEnhanced && (
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-1 rounded text-xs">
                Mixtral-8x22B
              </span>
            )}
            {searchMetadata.searchIntelligence && (
              <span className="bg-blue-900 text-blue-300 px-2 py-1 rounded text-xs">
                {searchMetadata.searchIntelligence} mode
              </span>
            )}
            {searchMetadata.enhancedQueriesUsed && (
              <span className="bg-green-900 text-green-300 px-2 py-1 rounded text-xs">
                {searchMetadata.enhancedQueriesUsed} enhanced queries
              </span>
            )}
            {searchMetadata.totalProcessingTime && (
              <span className="text-gray-500">
                {searchMetadata.totalProcessingTime}ms
              </span>
            )}
            {searchMetadata.insights?.resultQuality && (
              <span className={`px-2 py-1 rounded text-xs ${
                searchMetadata.insights.resultQuality === 'excellent' ? 'bg-green-900 text-green-300' :
                searchMetadata.insights.resultQuality === 'good' ? 'bg-blue-900 text-blue-300' :
                searchMetadata.insights.resultQuality === 'moderate' ? 'bg-yellow-900 text-yellow-300' :
                'bg-red-900 text-red-300'
              }`}>
                {searchMetadata.insights.resultQuality} quality
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <FiLoader className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-900 text-red-200 p-4 rounded-lg border-2 border-red-700">
          {error}
        </div>
      ) : results.length === 0 ? (
        <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-12 text-center">
          <p className="text-lg text-white">
            {searchMode === 'multimodal' && !multimodalQuery
              ? 'Start your AI-powered search above'
              : isTag 
                ? `No results found for tag #${query}` 
                : searchMode === 'multimodal'
                  ? `No results found for "${multimodalQuery}"`
                  : `No results found for "${query}"`
            }
          </p>
          <p className="text-sm text-gray-400 mt-2">
            {searchMode === 'multimodal'
              ? 'Try different keywords, upload an image, or adjust your search settings'
              : `Try using different ${isTag ? 'tags' : 'keywords'} or check your spelling.`
            }
          </p>
        </div>
      ) : searchMode === 'multimodal' ? (
        /* Multimodal Results */
        <MultiModalResults
          results={results.map(result => ({
            ...result,
            text: result.content || result.text,
            author: result.userName || result.username,
            category: result.categoryName
          }))}
          modality="text" // This would come from the search query
          searchTime={searchMetadata?.totalProcessingTime ? `${searchMetadata.totalProcessingTime}ms` : undefined}
          totalCount={results.length}
          onResultClick={(result) => {
            // Handle result click
            if (result.type === 'post') {
              window.location.href = `/posts/${result.id}`;
            }
          }}
          onImageClick={(imageUrl) => {
            // Handle image click - open in modal or new tab
            window.open(imageUrl, '_blank');
          }}
          onDocumentClick={(documentUrl) => {
            // Handle document click
            window.open(documentUrl, '_blank');
          }}
        />
      ) : (
        /* Traditional Results */
        <div className="space-y-4">
          {results.map((result) => (
            <Link
              key={`${result.type}-${result.id}`}
              href={getResultLink(result)}
              className="block bg-gray-800 border-2 border-gray-700 rounded-lg p-4 hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-start">
                <div className="mt-1 mr-4 p-3 bg-gray-700 rounded-full">
                  {getEntityIcon(result.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h2 className="text-lg font-medium text-white">
                      {getResultTitle(result)}
                    </h2>
                    <div className="flex items-center space-x-2 ml-4">
                      <span className="text-sm text-blue-300 bg-blue-900 px-2 py-1 rounded-full whitespace-nowrap">
                        {Math.round(result.score * 100)}% match
                      </span>
                      {result.matchType && (
                        <span className="text-xs text-purple-300 bg-purple-900 px-2 py-1 rounded-full whitespace-nowrap">
                          {result.matchType}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-blue-300 mt-1">
                    {getResultSubtitle(result)}
                  </p>
                  {(result.content || result.text) && (
                    <p className="text-sm text-gray-300 mt-2 line-clamp-3">
                      {result.content || result.text}
                    </p>
                  )}
                  <div className="mt-3 flex items-center space-x-2">
                    <span className="text-xs px-2 py-1 bg-blue-900 text-blue-300 font-medium rounded-full capitalize">
                      {result.type}
                    </span>
                    {result.embeddingType && (
                      <span className="text-xs px-2 py-1 bg-green-900 text-green-300 font-medium rounded-full">
                        {result.embeddingType} vector
                      </span>
                    )}
                    {result.fusedScore && (
                      <span className="text-xs px-2 py-1 bg-orange-900 text-orange-300 font-medium rounded-full">
                        RRF: {(result.fusedScore * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 