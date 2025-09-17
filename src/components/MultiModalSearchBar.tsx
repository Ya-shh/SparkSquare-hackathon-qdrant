'use client';

import React, { useState, useCallback } from 'react';
import { Search, Image, FileText, Sparkles, Filter, Settings } from 'lucide-react';

interface MultiModalSearchBarProps {
  onSearch: (query: string, modality: string, options?: any) => void;
  onAdvancedSearch?: (options: any) => void;
  placeholder?: string;
  className?: string;
}

interface SearchOptions {
  useAdvancedModel: boolean;
  enableSemanticGapBridging: boolean;
  scoreThreshold: number;
  limit: number;
  enableMistralEnhancement: boolean;
  enableQueryExpansion: boolean;
  searchIntelligence: 'basic' | 'enhanced' | 'intelligent';
}

export default function MultiModalSearchBar({ 
  onSearch, 
  onAdvancedSearch,
  placeholder = "Search across text, images, and documents...",
  className = ""
}: MultiModalSearchBarProps) {
  const [query, setQuery] = useState('');
  const [modality, setModality] = useState<'text' | 'image' | 'document'>('text');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    useAdvancedModel: true,
    enableSemanticGapBridging: true,
    scoreThreshold: 0.7,
    limit: 10,
    enableMistralEnhancement: true,
    enableQueryExpansion: true,
    searchIntelligence: 'enhanced'
  });
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      await onSearch(query, modality, searchOptions);
    } finally {
      setIsSearching(false);
    }
  }, [query, modality, searchOptions, onSearch]);

  const handleAdvancedSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      await onAdvancedSearch?.({
        query,
        modality,
        ...searchOptions
      });
    } finally {
      setIsSearching(false);
    }
  }, [query, modality, searchOptions, onAdvancedSearch]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      {/* Main Search Bar */}
      <div className="relative flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Modality Selector */}
        <div className="flex border-r border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setModality('text')}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              modality === 'text'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => setModality('image')}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              modality === 'image'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Image className="w-4 h-4" />
          </button>
          <button
            onClick={() => setModality('document')}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              modality === 'document'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-transparent focus:outline-none"
        />

        {/* Search Buttons */}
        <div className="flex items-center space-x-2 pr-3">
          <button
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Search</span>
          </button>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title="Advanced Options"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Advanced Options Panel */}
      {showAdvanced && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Advanced Model Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="advancedModel"
                checked={searchOptions.useAdvancedModel}
                onChange={(e) => setSearchOptions(prev => ({
                  ...prev,
                  useAdvancedModel: e.target.checked
                }))}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="advancedModel" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Advanced Model
              </label>
            </div>

            {/* Semantic Gap Bridging Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="semanticGap"
                checked={searchOptions.enableSemanticGapBridging}
                onChange={(e) => setSearchOptions(prev => ({
                  ...prev,
                  enableSemanticGapBridging: e.target.checked
                }))}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="semanticGap" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Semantic Gap Bridging
              </label>
            </div>

            {/* Score Threshold */}
            <div>
              <label htmlFor="scoreThreshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Score Threshold
              </label>
              <input
                type="range"
                id="scoreThreshold"
                min="0.1"
                max="1.0"
                step="0.1"
                value={searchOptions.scoreThreshold}
                onChange={(e) => setSearchOptions(prev => ({
                  ...prev,
                  scoreThreshold: parseFloat(e.target.value)
                }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-xs text-gray-500 mt-1">
                {searchOptions.scoreThreshold.toFixed(1)}
              </div>
            </div>

            {/* Result Limit */}
            <div>
              <label htmlFor="limit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Results Limit
              </label>
              <input
                type="number"
                id="limit"
                min="1"
                max="50"
                value={searchOptions.limit}
                onChange={(e) => setSearchOptions(prev => ({
                  ...prev,
                  limit: parseInt(e.target.value) || 10
                }))}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Mixtral-8x22B AI Enhancement Options */}
          <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <h5 className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-3 flex items-center">
              <Sparkles className="w-4 h-4 mr-2" />
              Mixtral-8x22B AI Enhancement
            </h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Search Intelligence Level */}
              <div>
                <label htmlFor="searchIntelligence" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Intelligence Level
                </label>
                <select
                  id="searchIntelligence"
                  value={searchOptions.searchIntelligence}
                  onChange={(e) => setSearchOptions(prev => ({
                    ...prev,
                    searchIntelligence: e.target.value as 'basic' | 'enhanced' | 'intelligent'
                  }))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="basic">Basic</option>
                  <option value="enhanced">Enhanced (Recommended)</option>
                  <option value="intelligent">Intelligent (AI Reranking)</option>
                </select>
              </div>

              {/* Mistral Enhancement Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enableMistralEnhancement"
                  checked={searchOptions.enableMistralEnhancement}
                  onChange={(e) => setSearchOptions(prev => ({
                    ...prev,
                    enableMistralEnhancement: e.target.checked
                  }))}
                  className="w-3 h-3 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="enableMistralEnhancement" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Query Enhancement
                </label>
              </div>

              {/* Query Expansion Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enableQueryExpansion"
                  checked={searchOptions.enableQueryExpansion}
                  onChange={(e) => setSearchOptions(prev => ({
                    ...prev,
                    enableQueryExpansion: e.target.checked
                  }))}
                  className="w-3 h-3 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="enableQueryExpansion" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Semantic Expansion
                </label>
              </div>
            </div>
            
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
              {searchOptions.searchIntelligence === 'intelligent' 
                ? 'Uses Mixtral-8x22B for query enhancement, semantic expansion, and AI-powered result reranking'
                : searchOptions.searchIntelligence === 'enhanced'
                ? 'Enhances queries with Mixtral-8x22B and applies semantic understanding'
                : 'Basic multimodal search without AI enhancement'
              }
            </p>
          </div>

          {/* Advanced Search Button */}
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => setShowAdvanced(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdvancedSearch}
              disabled={isSearching || !query.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Advanced Search</span>
            </button>
          </div>
        </div>
      )}

      {/* Modality Info */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {modality === 'text' && 'Searching text content with semantic understanding'}
        {modality === 'image' && 'Searching images with visual understanding'}
        {modality === 'document' && 'Searching documents with visual document retrieval'}
      </div>
    </div>
  );
}


