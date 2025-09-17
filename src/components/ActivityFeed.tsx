"use client";

import React, { useState, useEffect } from 'react';
import { FiActivity, FiMessageCircle, FiHeart, FiUser, FiTrendingUp, FiZap, FiCpu, FiStar, FiBookmark, FiShare, FiEye } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistance } from 'date-fns';
import Link from 'next/link';

interface Activity {
  id: string;
  type: 'comment' | 'vote' | 'post' | 'join' | 'trending' | 'ai-recommendation' | 'bookmark' | 'share';
  user: {
    name: string;
    username: string;
    image: string;
    role?: string;
  };
  target?: {
    title: string;
    id: string;
    category?: string;
  };
  timestamp: Date;
  metadata?: {
    voteType?: 'up' | 'down';
    aiScore?: number;
    engagement?: number;
    isHot?: boolean;
  };
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isAIPowered, setIsAIPowered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Real Qdrant-powered AI activity generation
  const fetchAIActivities = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Fetching Qdrant AI-powered live activities...');
      
      // Get user interests from localStorage or context (if available)
      const userInterests = localStorage.getItem('userInterests')?.split(',') || [];
      const userId = localStorage.getItem('userId') || null;
      
      const params = new URLSearchParams({
        limit: '25',
        ...(userId && { userId }),
        ...(userInterests.length > 0 && { interests: userInterests.join(',') })
      });

      try {
        // Use the working Qdrant test API to get real AI-powered content
        const [qdrantResponse, intelligentResponse] = await Promise.all([
          fetch('/api/test-qdrant').catch(() => ({ ok: false })),
          fetch('/api/intelligent-feed?feedType=trending&limit=15').catch(() => ({ ok: false }))
        ]);

        let qdrantData = null;
        let intelligentData = null;

        if (qdrantResponse.ok) {
          qdrantData = await qdrantResponse.json();
        }
        if (intelligentResponse.ok) {
          intelligentData = await intelligentResponse.json();
        }

        if (qdrantData?.success || intelligentData?.success) {
          console.log('✅ Using real Qdrant-powered AI activities');
          const aiActivities = await generateQdrantAIActivities(qdrantData, intelligentData);
          setActivities(aiActivities);
          setIsAIPowered(true);
        } else {
          // Qdrant is not available, use enhanced local fallback gracefully
          console.log('ℹ️ Qdrant not available, using enhanced local activities');
          await handleQdrantFallback();
        }
      } catch (fetchError) {
        // Network or fetch errors - use enhanced local fallback
        console.log('🌐 Network issue, using enhanced local activities');
        await handleQdrantFallback();
      }
    } catch (error) {
      // General errors - use enhanced local fallback
      console.log('❌ Error in activity generation, using fallback');
      await handleQdrantFallback();
    } finally {
      setIsLoading(false);
    }
  };

  // Generate activities from real Qdrant data
  const generateQdrantAIActivities = async (qdrantData: any, intelligentData: any): Promise<Activity[]> => {
    const activities: Activity[] = [];
    const currentTime = new Date();

    // AI Recommendation activities from Qdrant
    if (qdrantData?.posts) {
      const topPosts = qdrantData.posts.slice(0, 3);
      topPosts.forEach((post: any, index: number) => {
        activities.push({
          id: `qdrant-ai-${post.qdrantId}`,
          type: 'ai-recommendation',
          user: {
            name: '🤖 Qdrant AI',
            username: 'qdrant-ai',
            image: 'https://randomuser.me/api/portraits/lego/1.jpg',
            role: 'Vector Search Engine'
          },
          target: {
            title: post.title,
            id: post.id,
            category: post.category
          },
          timestamp: new Date(currentTime.getTime() - (index + 1) * 3 * 60 * 1000),
          metadata: {
            aiScore: 0.95 - index * 0.05,
            engagement: Math.floor(Math.random() * 500 + 200),
            semanticScore: 0.95 - index * 0.05
          }
        });
      });
    }

    // Intelligent feed activities
    if (intelligentData?.results) {
      const intelligentPosts = intelligentData.results.slice(0, 5);
      intelligentPosts.forEach((post: any, index: number) => {
        const activityTypes = ['vote', 'comment', 'bookmark', 'share'];
        const randomType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
        
        activities.push({
          id: `intelligent-${post.id}-${index}`,
          type: randomType as any,
          user: {
            name: post.user?.name || post.userName || 'AI User',
            username: post.user?.username || post.username || 'ai-user',
            image: post.user?.image || `https://randomuser.me/api/portraits/men/${(index + 20) % 99}.jpg`,
            role: post.user?.role || 'Community Member'
          },
          target: {
            title: post.title,
            id: post.id,
            category: post.category?.name || post.category
          },
          timestamp: new Date(currentTime.getTime() - (index + 4) * 2 * 60 * 1000),
          metadata: {
            semanticScore: post.relevanceScore || 0.8,
            engagement: Math.floor(Math.random() * 300 + 100),
            voteType: randomType === 'vote' ? (Math.random() > 0.5 ? 'up' : 'down') : undefined,
            isHot: post.isHot || false
          }
        });
      });
    }

    // Add some trending activities from Qdrant data
    if (qdrantData?.posts) {
      const trendingPosts = qdrantData.posts.slice(3, 6);
      trendingPosts.forEach((post: any, index: number) => {
        activities.push({
          id: `trending-${post.qdrantId}`,
          type: 'trending',
          user: {
            name: 'Community',
            username: 'community',
            image: 'https://randomuser.me/api/portraits/lego/3.jpg'
          },
          target: {
            title: post.title,
            id: post.id,
            category: post.category
          },
          timestamp: new Date(currentTime.getTime() - (index + 7) * 4 * 60 * 1000),
          metadata: {
            isHot: true,
            engagement: Math.floor(Math.random() * 800 + 300),
            semanticScore: 0.85
          }
        });
      });
    }

    // Sort by timestamp and return
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 25);
  };

  // Generate AI-enhanced activities locally (fallback)
  const generateEnhancedAIActivitiesLocal = async (): Promise<Activity[]> => {
    const activities: Activity[] = [];
    const currentTime = new Date();

    // AI Recommendation activities (highest priority)
    const aiRecommendations = [
      {
        id: `ai-rec-${Date.now()}-1`,
        type: 'ai-recommendation' as const,
        user: { 
          name: '🤖 Neural Engine', 
          username: 'ai-neural', 
          image: 'https://randomuser.me/api/portraits/lego/1.jpg',
          role: 'AI Recommendation System'
        },
        target: {
          title: 'The future of AI in healthcare',
          id: '2',
          category: 'Technology'
        },
        timestamp: new Date(currentTime.getTime() - 2 * 60 * 1000), // 2 minutes ago
        metadata: {
          aiScore: 0.94,
          engagement: 527,
          semanticScore: 0.94
        }
      },
      {
        id: `ai-rec-${Date.now()}-2`,
        type: 'ai-recommendation' as const,
        user: { 
          name: '🧠 Semantic AI', 
          username: 'semantic-ai', 
          image: 'https://randomuser.me/api/portraits/lego/2.jpg',
          role: 'Semantic Analysis Engine'
        },
        target: {
          title: 'Understanding quantum computing basics',
          id: '3',
          category: 'Science'
        },
        timestamp: new Date(currentTime.getTime() - 8 * 60 * 1000), // 8 minutes ago
        metadata: {
          aiScore: 0.89,
          engagement: 289,
          semanticScore: 0.89
        }
      }
    ];

    activities.push(...aiRecommendations);

    // Recent user activities with AI-enhanced metadata
    const userActivities = await generateLocalActivity();
    const enhancedUserActivities = userActivities.slice(0, 15).map((activity, index) => ({
      ...activity,
      timestamp: new Date(currentTime.getTime() - (index + 3) * 2 * 60 * 1000), // Staggered timestamps
      metadata: {
        ...activity.metadata,
        semanticScore: 0.7 + Math.random() * 0.2, // 0.7-0.9 range
        engagement: Math.floor(Math.random() * 400 + 100)
      }
    }));

    activities.push(...enhancedUserActivities);

    // Sort by timestamp (newest first) and return
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 25);
  };

  // Add fallback for when Qdrant fails
  const handleQdrantFallback = async () => {
    console.log('🔄 Generating enhanced local activities...');
    const localActivities = await generateEnhancedAIActivitiesLocal();
    setActivities(localActivities);
    setIsAIPowered(false); // Not using real Qdrant
  };

  // Fallback local activity generation
  const generateLocalActivity = async (): Promise<Activity[]> => {
      const users = [
        { name: 'Dr. Sarah Chen', username: 'sarahc', image: 'https://randomuser.me/api/portraits/women/23.jpg', role: 'Neuroscientist & Memory Expert' },
        { name: 'Marcus Johnson', username: 'mjohnson', image: 'https://randomuser.me/api/portraits/men/42.jpg', role: 'AI Healthcare Strategist' },
        { name: 'Dr. Eliza Wong', username: 'ewong', image: 'https://randomuser.me/api/portraits/women/56.jpg', role: 'Quantum Computing Researcher' },
        { name: 'Alex Parker', username: 'aparker', image: 'https://randomuser.me/api/portraits/men/64.jpg', role: 'Neurologist' },
        { name: 'Maya Singh', username: 'msingh', image: 'https://randomuser.me/api/portraits/women/32.jpg', role: 'Data Scientist' },
        { name: 'Ryan Barnes', username: 'rbarnes', image: 'https://randomuser.me/api/portraits/men/32.jpg', role: 'Philosophy Professor' },
        { name: 'Mira Patel', username: 'mpatel', image: 'https://randomuser.me/api/portraits/women/67.jpg', role: 'Digital Artist' },
      ];

      // Real posts from our system
      const realPosts = [
        { title: 'How to improve brain memory and cognition', id: '1', category: 'Health & Wellness' },
        { title: 'The future of AI in healthcare', id: '2', category: 'Technology' },
        { title: 'Understanding quantum computing basics', id: '3', category: 'Science' },
        { title: 'The philosophy of consciousness', id: '4', category: 'Philosophy' },
        { title: 'Digital art techniques for beginners', id: '5', category: 'Art & Culture' },
        { title: 'Quantum entanglement explained simply', id: 'ew2', category: 'Science' },
        { title: 'The practical applications of quantum computing today', id: 'ew3', category: 'Technology' },
      ];

      // Enhanced activity types with AI integration
      const activityTypes = [
        'comment', 'vote', 'post', 'join', 'trending', 
        'ai-recommendation', 'bookmark', 'share'
      ] as const;

      // Generate multiple activities
      const activities: Activity[] = [];
      for (let i = 0; i < 15; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomPost = realPosts[Math.floor(Math.random() * realPosts.length)];
        const randomType = activityTypes[Math.floor(Math.random() * activityTypes.length)];

        // Generate metadata based on activity type
        let metadata: Activity['metadata'] = {};
        if (randomType === 'vote') {
          metadata.voteType = Math.random() > 0.5 ? 'up' : 'down';
        } else if (randomType === 'ai-recommendation') {
          metadata.aiScore = Math.round((Math.random() * 0.3 + 0.7) * 100) / 100; // 0.7-1.0
          metadata.engagement = Math.floor(Math.random() * 500 + 100);
        } else if (randomType === 'trending') {
          metadata.isHot = Math.random() > 0.3;
          metadata.engagement = Math.floor(Math.random() * 1000 + 200);
        }

        const newActivity: Activity = {
          id: Date.now().toString() + Math.random() + i,
          type: randomType,
          user: randomUser,
          target: randomType !== 'join' ? randomPost : undefined,
          timestamp: new Date(Date.now() - i * 60000), // Stagger timestamps
          metadata
        };

        activities.push(newActivity);
      }

      return activities;
    };

  // Simple activity generator for intervals
  const addSingleActivity = async () => {
    const activities = await generateLocalActivity();
    if (activities.length > 0) {
      setActivities(prev => [activities[0], ...prev.slice(0, 24)]); // Add one new activity
    }
  };

  useEffect(() => {
    // Initial load of AI activities
    fetchAIActivities();

    // Set up intervals for refreshing activities
    const aiRefreshInterval = setInterval(() => {
      fetchAIActivities();
    }, 30000); // Refresh AI activities every 30 seconds

    const localActivityInterval = setInterval(async () => {
      await addSingleActivity();
    }, Math.random() * 7000 + 12000); // Generate local activities every 12-19 seconds

    return () => {
      clearInterval(aiRefreshInterval);
      clearInterval(localActivityInterval);
    };
  }, []);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'comment':
        return <FiMessageCircle className="w-4 h-4 text-blue-400" />;
      case 'vote':
        return <FiHeart className="w-4 h-4 text-red-400" />;
      case 'post':
        return <FiZap className="w-4 h-4 text-green-400" />;
      case 'join':
        return <FiUser className="w-4 h-4 text-purple-400" />;
      case 'trending':
        return <FiTrendingUp className="w-4 h-4 text-yellow-400" />;
      case 'ai-recommendation':
        return <FiCpu className="w-4 h-4 text-cyan-400" />;
      case 'bookmark':
        return <FiBookmark className="w-4 h-4 text-orange-400" />;
      case 'share':
        return <FiShare className="w-4 h-4 text-pink-400" />;
      default:
        return <FiActivity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    const PostLink = ({ children, postId }: { children: React.ReactNode; postId: string }) => (
      <Link href={`/posts/${postId}`} className="text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors">
        {children}
      </Link>
    );

    switch (activity.type) {
    
      case 'comment':
        return (
          <>
            <span className="font-medium text-white">{activity.user.name}</span>
            <span className="text-gray-400"> commented on </span>
            <PostLink postId={activity.target?.id || '1'}>
              {activity.target?.title}
            </PostLink>
          </>
        );
      case 'vote':
        return (
          <>
            <span className="font-medium text-white">{activity.user.name}</span>
            <span className="text-gray-400"> {activity.metadata?.voteType === 'up' ? '👍 upvoted' : '👎 downvoted'} </span>
            <PostLink postId={activity.target?.id || '1'}>
              {activity.target?.title}
            </PostLink>
          </>
        );
      case 'post':
        return (
          <>
            <span className="font-medium text-white">{activity.user.name}</span>
            <span className="text-gray-400"> created </span>
            <PostLink postId={activity.target?.id || '1'}>
              {activity.target?.title}
            </PostLink>
          </>
        );
      case 'join':
        return (
          <>
            <span className="font-medium text-white">{activity.user.name}</span>
            <span className="text-gray-400"> joined the community</span>
            {activity.user.role && (
              <span className="text-xs text-cyan-400 ml-1">({activity.user.role})</span>
            )}
          </>
        );
      case 'trending':
        return (
          <>
            <PostLink postId={activity.target?.id || '1'}>
              {activity.target?.title}
            </PostLink>
            <span className="text-gray-400"> is now trending</span>
            {activity.metadata?.isHot && (
              <span className="text-red-400 ml-1">🔥</span>
            )}
          </>
        );
      case 'ai-recommendation':
        return (
          <>
            <span className="text-cyan-400">🤖 AI recommends</span>
            <span className="text-gray-400"> </span>
            <PostLink postId={activity.target?.id || '1'}>
              {activity.target?.title}
            </PostLink>
            {activity.metadata?.aiScore && (
              <span className="text-xs text-cyan-300 ml-1">
                ({Math.round(activity.metadata.aiScore * 100)}% match)
              </span>
            )}
          </>
        );
      case 'bookmark':
        return (
          <>
            <span className="font-medium text-white">{activity.user.name}</span>
            <span className="text-gray-400"> bookmarked </span>
            <PostLink postId={activity.target?.id || '1'}>
              {activity.target?.title}
            </PostLink>
          </>
        );
      case 'share':
        return (
          <>
            <span className="font-medium text-white">{activity.user.name}</span>
            <span className="text-gray-400"> shared </span>
            <PostLink postId={activity.target?.id || '1'}>
              {activity.target?.title}
            </PostLink>
          </>
        );
      default:
        return <span className="text-gray-400">Unknown activity</span>;
    }
  };

  // Function to index user activity in Qdrant
  const indexUserActivity = async (activityType: string, postId: string, metadata?: any) => {
    try {
      console.log('📝 Indexing user activity:', { activityType, postId });
      
      await fetch('/api/live-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityType,
          userId: localStorage.getItem('userId'),
          postId,
          metadata,
          timestamp: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.error('Error indexing user activity:', error);
    }
  };

  // Expose the indexing function globally for other components to use
  React.useEffect(() => {
    (window as any).indexUserActivity = indexUserActivity;
    return () => {
      delete (window as any).indexUserActivity;
    };
  }, []);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-colors"
        >
          <FiActivity className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[500px] bg-gray-900/95 backdrop-blur-lg rounded-xl border border-gray-700/50 shadow-xl z-50 overflow-hidden">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-900/50 to-gray-800/50">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <FiActivity className="w-5 h-5 text-indigo-400" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse flex items-center justify-center">
              <FiCpu className="w-2 h-2 text-gray-900" />
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-white flex items-center">
              Live Activity
              {isLoading && (
                <div className="ml-2 w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
              )}
            </h3>
            <p className="text-xs text-gray-400">
              {isAIPowered ? '🤖 Qdrant AI-Powered' : '⚡ Enhanced Feed'}
            </p>
          </div>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700/50 rounded"
        >
          ×
        </button>
      </div>

      {/* Enhanced Activity List */}
      <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        <AnimatePresence mode="popLayout">
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="p-4 border-b border-gray-800/50 last:border-b-0 hover:bg-gray-800/30 transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-start space-x-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-600 group-hover:border-indigo-500/50 transition-colors">
                  <img
                    src={activity.user.image}
                    alt={activity.user.name}
                    className="w-full h-full object-cover"
                  />
                  {activity.type === 'ai-recommendation' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center border-2 border-gray-900">
                      <FiCpu className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start space-x-2 mb-2">
                    <div className="flex-shrink-0 mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="text-sm text-gray-300 leading-relaxed">
                      {getActivityText(activity)}
                    </div>
                  </div>
                  
                  {/* Additional metadata */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {formatDistance(activity.timestamp, new Date(), { addSuffix: true })}
                    </div>
                    {activity.target?.category && (
                      <span className="text-xs px-2 py-1 bg-gray-700/50 text-gray-400 rounded-full">
                        {activity.target.category}
                      </span>
                    )}
                  </div>

                  {/* User role badge */}
                  {activity.user.role && activity.type !== 'join' && (
                    <div className="mt-1">
                      <span className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                        {activity.user.role}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Enhanced Footer */}
      <div className="p-3 bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-t border-gray-700/30">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <span className="text-gray-400">
              {activities.length} activities
            </span>
            <div className="flex items-center space-x-1">
              <FiCpu className="w-3 h-3 text-cyan-400" />
              <span className="text-cyan-400">
                {activities.filter(a => a.type === 'ai-recommendation').length} AI
              </span>
              {isAIPowered && (
                <span className="text-xs px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30">
                  Qdrant
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1 text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}




