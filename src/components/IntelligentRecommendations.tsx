'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  Sparkles, 
  TrendingUp, 
  Clock, 
  User, 
  MessageCircle, 
  Heart, 
  Bookmark,
  RefreshCw,
  Settings,
  Eye,
  ThumbsUp,
  ArrowRight,
  Zap,
  Brain
} from 'lucide-react';

interface RecommendationResult {
  postId: string;
  score: number;
  reason: string;
  algorithm: string;
  diversity: number;
  serendipity?: number;
  metadata?: any;
  post?: {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    viewCount: number;
    author: {
      id: string;
      name: string;
      username: string;
      image?: string;
      reputation: number;
    };
    category: {
      id: string;
      name: string;
      slug: string;
      description?: string;
    };
    stats: {
      comments: number;
      votes: number;
      bookmarks: number;
    };
  };
  enriched: boolean;
}

interface RecommendationMetadata {
  totalProcessingTime: number;
  algorithmsUsed: string[];
  diversityApplied: boolean;
  personalizedForUser: boolean;
}

interface IntelligentRecommendationsProps {
  className?: string;
  limit?: number;
  showControls?: boolean;
  algorithm?: 'collaborative' | 'content' | 'hybrid';
  enableDiversityFiltering?: boolean;
  enableSerendipity?: boolean;
}

export default function IntelligentRecommendations({
  className = "",
  limit = 6,
  showControls = true,
  algorithm = 'hybrid',
  enableDiversityFiltering = true,
  enableSerendipity = true
}: IntelligentRecommendationsProps) {
  const { data: session } = useSession();
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [metadata, setMetadata] = useState<RecommendationMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    algorithm,
    diversityThreshold: 0.3,
    enableDiversityFiltering,
    scoreThreshold: 0.1,
    timeDecayFactor: 0.95,
    personalizeByCategory: true,
    enableSerendipity,
    serendipityFactor: 0.1
  });
  const [showSettings, setShowSettings] = useState(false);

  // Load recommendations
  const loadRecommendations = async (customSettings?: any) => {
    if (!session?.user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        algorithm: customSettings?.algorithm || settings.algorithm,
        limit: limit.toString(),
        diversityThreshold: (customSettings?.diversityThreshold || settings.diversityThreshold).toString(),
        enableDiversityFiltering: (customSettings?.enableDiversityFiltering !== undefined ? customSettings.enableDiversityFiltering : settings.enableDiversityFiltering).toString(),
        scoreThreshold: (customSettings?.scoreThreshold || settings.scoreThreshold).toString(),
        timeDecayFactor: (customSettings?.timeDecayFactor || settings.timeDecayFactor).toString(),
        personalizeByCategory: (customSettings?.personalizeByCategory !== undefined ? customSettings.personalizeByCategory : settings.personalizeByCategory).toString(),
        enableSerendipity: (customSettings?.enableSerendipity !== undefined ? customSettings.enableSerendipity : settings.enableSerendipity).toString(),
        serendipityFactor: (customSettings?.serendipityFactor || settings.serendipityFactor).toString()
      });

      const response = await fetch(`/api/recommendations/intelligent?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to load recommendations');
      }

      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.recommendations);
        setMetadata(data.metadata);
      } else {
        setError(data.error || 'Failed to load recommendations');
      }
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError('An error occurred while loading recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  // Load recommendations on mount and when session changes
  useEffect(() => {
    loadRecommendations();
  }, [session?.user?.id]);

  // Handle feedback
  const handleFeedback = async (recommendationId: string, postId: string, feedback: 'positive' | 'negative', action: string) => {
    try {
      await fetch('/api/recommendations/intelligent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'feedback',
          recommendationId,
          postId,
          feedback,
          action
        })
      });
    } catch (error) {
      console.error('Error sending feedback:', error);
    }
  };

  // Handle settings change
  const handleSettingsChange = (newSettings: any) => {
    setSettings({ ...settings, ...newSettings });
    loadRecommendations(newSettings);
  };

  // Get algorithm icon
  const getAlgorithmIcon = (algorithm: string) => {
    switch (algorithm) {
      case 'collaborative_filtering':
        return <User className="w-4 h-4" />;
      case 'content_based':
        return <Brain className="w-4 h-4" />;
      case 'matrix_factorization':
        return <Zap className="w-4 h-4" />;
      case 'serendipity_injection':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  // Get algorithm color
  const getAlgorithmColor = (algorithm: string) => {
    switch (algorithm) {
      case 'collaborative_filtering':
        return 'bg-blue-900 text-blue-300';
      case 'content_based':
        return 'bg-green-900 text-green-300';
      case 'matrix_factorization':
        return 'bg-purple-900 text-purple-300';
      case 'serendipity_injection':
        return 'bg-yellow-900 text-yellow-300';
      default:
        return 'bg-gray-900 text-gray-300';
    }
  };

  if (!session?.user?.id) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 text-center ${className}`}>
        <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Intelligent Recommendations
        </h3>
        <p className="text-gray-400">
          Sign in to get personalized AI-powered content recommendations
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                AI Recommendations
              </h3>
              <p className="text-sm text-gray-400">
                Personalized content just for you
              </p>
            </div>
          </div>
          
          {showControls && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => loadRecommendations()}
                disabled={isLoading}
                className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 p-4 bg-gray-700 rounded-lg">
            <h4 className="font-medium text-white mb-3">Recommendation Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Algorithm
                </label>
                <select
                  value={settings.algorithm}
                  onChange={(e) => handleSettingsChange({ algorithm: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded-md text-sm"
                >
                  <option value="hybrid">Hybrid (Recommended)</option>
                  <option value="collaborative">Collaborative Filtering</option>
                  <option value="content">Content-Based</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Diversity Threshold
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={settings.diversityThreshold}
                  onChange={(e) => handleSettingsChange({ diversityThreshold: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="text-xs text-gray-400 mt-1">
                  {settings.diversityThreshold.toFixed(1)}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enableSerendipity"
                  checked={settings.enableSerendipity}
                  onChange={(e) => handleSettingsChange({ enableSerendipity: e.target.checked })}
                  className="w-4 h-4 text-purple-600 bg-gray-600 border-gray-500 rounded"
                />
                <label htmlFor="enableSerendipity" className="text-sm text-gray-300">
                  Enable Serendipity
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="personalizeByCategory"
                  checked={settings.personalizeByCategory}
                  onChange={(e) => handleSettingsChange({ personalizeByCategory: e.target.checked })}
                  className="w-4 h-4 text-purple-600 bg-gray-600 border-gray-500 rounded"
                />
                <label htmlFor="personalizeByCategory" className="text-sm text-gray-300">
                  Personalize by Category
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Metadata */}
        {metadata && (
          <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center space-x-4">
              <span>
                {metadata.algorithmsUsed.length} algorithm{metadata.algorithmsUsed.length !== 1 ? 's' : ''}
              </span>
              <span>
                {metadata.totalProcessingTime}ms
              </span>
              {metadata.diversityApplied && (
                <span className="bg-green-900 text-green-300 px-2 py-1 rounded">
                  Diversified
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              {metadata.algorithmsUsed.map(algo => (
                <span
                  key={algo}
                  className={`px-2 py-1 rounded text-xs flex items-center space-x-1 ${getAlgorithmColor(algo)}`}
                >
                  {getAlgorithmIcon(algo)}
                  <span>{algo.replace('_', ' ')}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <RefreshCw className="w-6 h-6 text-purple-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => loadRecommendations()}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">
              No recommendations available yet. Interact with more content to improve your recommendations.
            </p>
            <button
              onClick={() => loadRecommendations()}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Generate Recommendations
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div
                key={rec.postId}
                className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-purple-300">
                      #{index + 1}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs flex items-center space-x-1 ${getAlgorithmColor(rec.algorithm)}`}>
                      {getAlgorithmIcon(rec.algorithm)}
                      <span>{rec.algorithm.replace('_', ' ')}</span>
                    </span>
                    <span className="text-xs text-gray-400">
                      {(rec.score * 100).toFixed(1)}% match
                    </span>
                    {rec.serendipity && (
                      <span className="px-2 py-1 bg-yellow-900 text-yellow-300 rounded text-xs">
                        Serendipitous
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    Diversity: {(rec.diversity * 100).toFixed(0)}%
                  </div>
                </div>

                {rec.post && (
                  <Link href={`/posts/${rec.post.id}`} className="block">
                    <h4 className="font-medium text-white mb-2 hover:text-purple-300 transition-colors">
                      {rec.post.title}
                    </h4>
                    <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                      {rec.post.content}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{rec.post.author.username}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-3 h-3" />
                          <span>{rec.post.stats.comments}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ThumbsUp className="w-3 h-3" />
                          <span>{rec.post.stats.votes}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{rec.post.viewCount}</span>
                        </div>
                      </div>
                      <span className="bg-gray-600 px-2 py-1 rounded">
                        {rec.post.category.name}
                      </span>
                    </div>
                  </Link>
                )}

                <div className="mt-3 pt-3 border-t border-gray-600">
                  <p className="text-xs text-gray-400 mb-2">{rec.reason}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleFeedback(rec.postId, rec.postId, 'positive', 'like')}
                        className="p-1 text-gray-400 hover:text-green-400 transition-colors"
                        title="Like this recommendation"
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleFeedback(rec.postId, rec.postId, 'positive', 'bookmark')}
                        className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                        title="Bookmark this post"
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                    </div>
                    <Link
                      href={`/posts/${rec.postId}`}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center space-x-1"
                    >
                      <span>Read more</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
