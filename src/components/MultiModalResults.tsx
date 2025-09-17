'use client';

import React from 'react';
import { 
  FileText, 
  Image, 
  Search, 
  Clock, 
  Star, 
  Eye, 
  MessageCircle,
  ExternalLink,
  Download,
  Filter
} from 'lucide-react';

interface MultiModalResult {
  id: string;
  title?: string;
  content?: string;
  text?: string;
  imageUrl?: string;
  documentUrl?: string;
  type: 'post' | 'comment' | 'document' | 'image' | 'category';
  score?: number;
  rank?: number;
  matchType?: string;
  metadata?: any;
  createdAt?: string;
  author?: string;
  category?: string;
}

interface MultiModalResultsProps {
  results: MultiModalResult[];
  modality: 'text' | 'image' | 'document';
  searchTime?: string;
  totalCount?: number;
  onResultClick?: (result: MultiModalResult) => void;
  onImageClick?: (imageUrl: string) => void;
  onDocumentClick?: (documentUrl: string) => void;
  className?: string;
}

export default function MultiModalResults({
  results,
  modality,
  searchTime,
  totalCount,
  onResultClick,
  onImageClick,
  onDocumentClick,
  className = ""
}: MultiModalResultsProps) {
  const getModalityIcon = (result: MultiModalResult) => {
    if (result.imageUrl) return <Image className="w-4 h-4" />;
    if (result.documentUrl) return <FileText className="w-4 h-4" />;
    return <Search className="w-4 h-4" />;
  };

  const getMatchTypeColor = (matchType?: string) => {
    switch (matchType) {
      case 'text-to-image':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'image-to-text':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'text-to-document':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'same-modality':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
  };

  const formatScore = (score?: number) => {
    if (!score) return 'N/A';
    return `${(score * 100).toFixed(1)}%`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  if (results.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No results found
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Try adjusting your search terms or switching modalities
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Search Results
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {totalCount || results.length} results found
            {searchTime && ` in ${searchTime}`}
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Filter className="w-4 h-4" />
          <span>Targeting {modality}</span>
        </div>
      </div>

      {/* Results Grid */}
      <div className="space-y-4">
        {results.map((result, index) => (
          <div
            key={result.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onResultClick?.(result)}
          >
            <div className="flex items-start space-x-4">
              {/* Modality Icon */}
              <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                {getModalityIcon(result)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white line-clamp-2">
                      {result.title || result.content || 'Untitled'}
                    </h3>
                    {result.author && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        by {result.author}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {/* Score */}
                    <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                      <Star className="w-4 h-4" />
                      <span>{formatScore(result.score)}</span>
                    </div>
                    {/* Rank */}
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      #{result.rank || index + 1}
                    </div>
                  </div>
                </div>

                {/* Match Type Badge */}
                {result.matchType && (
                  <div className="mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMatchTypeColor(result.matchType)}`}>
                      {result.matchType.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Content Preview */}
                <div className="mb-4">
                  {result.text && (
                    <p className="text-gray-600 dark:text-gray-300 line-clamp-3">
                      {result.text}
                    </p>
                  )}
                  {result.content && result.content !== result.text && (
                    <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mt-2">
                      {result.content}
                    </p>
                  )}
                </div>

                {/* Media Preview */}
                {result.imageUrl && (
                  <div className="mb-4">
                    <div className="relative w-32 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <img
                        src={result.imageUrl}
                        alt="Result preview"
                        className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onImageClick?.(result.imageUrl!);
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    {result.category && (
                      <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                        {result.category}
                      </span>
                    )}
                    {result.createdAt && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(result.createdAt)}</span>
                      </div>
                    )}
                    {result.type && (
                      <span className="capitalize">{result.type}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {result.documentUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDocumentClick?.(result.documentUrl!);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title="View document"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                    {result.imageUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onImageClick?.(result.imageUrl!);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title="View image"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {results.length >= 10 && (
        <div className="mt-8 text-center">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Load More Results
          </button>
        </div>
      )}
    </div>
  );
}


