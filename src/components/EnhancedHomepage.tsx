"use client";

import { useEffect, useState, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiTrendingUp, FiZap, FiEye, FiMessageCircle, FiHeart, FiShare, FiBookmark, FiArrowUp, FiClock, FiUsers, FiStar, FiCpu, FiTarget, FiCompass, FiLayers, FiAward, FiFolder, FiInfo, FiDatabase } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistance } from 'date-fns';
import UnifiedSearchBar from './ui/UnifiedSearchBar';
import SemanticSearchBar from './SemanticSearchBar';
import TrendingTags from './TrendingTags';
import LoadingIndicator from './LoadingIndicator';
import ActivityFeed from './ActivityFeed';
import TransparencyModal from './TransparencyModal';

interface Thread {
  id: string;
  title: string;
  content: string;
  category: { name: string; slug: string };
  user: { 
    id: string;
    name: string;
    username: string;
    image: string;
    role?: string;
  };
  _count: { comments: number; votes: number };
  viewCount?: number;
  createdAt: string;
  trendingScore?: number;
  isHot?: boolean;
  isPinned?: boolean;
}

interface TrendingTag {
  name: string;
  count: number;
}

interface EnhancedHomepageProps {
  initialThreads?: Thread[];
  initialTags?: TrendingTag[];
}

const safeJsonFetch = async (url: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Expected JSON response but got: ${contentType}`);
    }
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse JSON response:', e);
      throw new Error('Invalid JSON response');
    }
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    throw error;
  }
};

export default function EnhancedHomepage({ initialThreads = [], initialTags = [] }: EnhancedHomepageProps) {
  const [activeTab, setActiveTab] = useState<'trending' | 'exciting' | 'new' | 'top' | 'ai-recommended' | 'deep-dive' | 'rising' | 'expert-picks'>('trending');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>(initialTags);
  const [highlights, setHighlights] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    activeUsers: 0,
    dailyDiscussions: 0,
    topicsCovered: 0,
    expertContributors: 0,
    aiRecommendations: 0,
    trendingTopics: 0
  });
  const [feedCounts, setFeedCounts] = useState({
    trending: 0,
    exciting: 0,
    new: 0,
    top: 0,
    'ai-recommended': 0,
    'deep-dive': 0,
    rising: 0,
    'expert-picks': 0
  });
  
  const [showTransparency, setShowTransparency] = useState(false);
  const [transparencyData, setTransparencyData] = useState(null);
  const [qdrantStats, setQdrantStats] = useState(null);
  
  const router = useRouter();

  // Read URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam && categoryParam !== 'all') {
      setActiveCategory(categoryParam);
    }
  }, []);

  useEffect(() => {
    fetchContent();
    fetchStatistics();
    // Auto-index homepage discussions for vector search
    indexHomepageContent();
    // Fetch real feed counts on component mount
    if (Object.values(feedCounts).every(count => count === 0)) {
      fetchFeedCounts();
    }
  }, [activeTab, activeCategory]);

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/statistics');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchFeedCounts = async () => {
    try {
      const response = await fetch('/api/feed-stats');
      const data = await response.json();
      if (data.success) {
        setFeedCounts(data.counts);
      }
    } catch (error) {
      console.error('Error fetching feed counts:', error);
    }
  };

  const indexHomepageContent = async () => {
    try {
      await fetch('/api/homepage/index', { method: 'POST' });
    } catch (error) {
      console.log('Indexing not available:', error);
    }
  };

  const fetchContent = async () => {
    setIsLoading(true);
    try {
      // Fetch intelligent content using semantic search API
      const categoryParam = activeCategory !== 'all' ? `&category=${activeCategory}` : '';
      const [semanticFeedResponse, tagsResponse, highlightsResponse] = await Promise.all([
        safeJsonFetch(`/api/homepage/semantic-feed?tab=${activeTab}&limit=15&timeRange=week${categoryParam}`).catch(() => ({ results: [] })),
        safeJsonFetch(`/api/trending?type=tags&limit=15`).catch(() => ({ tags: [] })),
        // Use trending posts as highlights instead of personalized recommendations for public homepage
        safeJsonFetch(`/api/trending?limit=8&timeRange=day`).catch(() => ({ results: [] }))
      ]);

      // Process and sort threads based on active tab
      let processedThreads = semanticFeedResponse.results || [];
      
      if (processedThreads.length === 0) {
        // Enhanced mock data with diverse author personalities and professional backgrounds
        processedThreads = [
          {
            id: '1',
            title: 'How to improve brain memory and cognition',
            content: "I've been researching techniques to improve memory and cognitive function. Has anyone tried specific supplements or techniques that have worked well?",
            category: { name: 'Health', slug: 'health' },
            user: { 
              id: 'sarahc', 
              name: 'Dr. Sarah Chen', 
              username: 'sarahc',
              image: 'https://randomuser.me/api/portraits/women/23.jpg',
              role: 'Neuroscientist & Memory Expert'
            },
            _count: { comments: 47, votes: 156 },
            viewCount: 892,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            trendingScore: 0.95,
            isHot: true
          },
          {
            id: '2',
            title: 'The future of AI in healthcare',
            content: "As AI becomes more sophisticated, what applications in healthcare do you think will have the biggest impact in the next 5 years?",
            category: { name: 'Technology', slug: 'technology' },
            user: { 
              id: 'mjohnson', 
              name: 'Marcus Johnson', 
              username: 'mjohnson',
              image: 'https://randomuser.me/api/portraits/men/42.jpg',
              role: 'AI Healthcare Strategist'
            },
            _count: { comments: 63, votes: 201 },
            viewCount: 1247,
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            trendingScore: 0.89,
            isPinned: true
          },
          {
            id: '3',
            title: 'Understanding quantum computing basics',
            content: "I'm trying to wrap my head around quantum computing principles. Can someone explain qubits and superposition in simple terms?",
            category: { name: 'Science', slug: 'science' },
            user: { 
              id: 'ewong', 
              name: 'Dr. Eliza Wong', 
              username: 'ewong',
              image: 'https://randomuser.me/api/portraits/women/56.jpg',
              role: 'Quantum Computing Researcher'
            },
            _count: { comments: 34, votes: 89 },
            viewCount: 567,
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            trendingScore: 0.76
          },
          {
            id: '4',
            title: 'The psychology behind startup failures and how to avoid them',
            content: "After analyzing 200+ failed startups, I've identified 7 psychological patterns that consistently lead to failure. Here's what every entrepreneur needs to know...",
            category: { name: 'Business', slug: 'business' },
            user: { 
              id: 'alexr', 
              name: 'Alexandra Rivera', 
              username: 'alexr',
              image: 'https://randomuser.me/api/portraits/women/67.jpg',
              role: 'Startup Psychologist & Advisor'
            },
            _count: { comments: 52, votes: 143 },
            viewCount: 734,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            trendingScore: 0.88,
            isHot: true
          },
          {
            id: '5',
            title: 'Climate engineering: Can we reverse global warming with technology?',
            content: "Exploring cutting-edge geoengineering solutions from carbon capture to solar radiation management. What are the ethical implications?",
            category: { name: 'Environment', slug: 'environment' },
            user: { 
              id: 'davidk', 
              name: 'Prof. David Kim', 
              username: 'davidk',
              image: 'https://randomuser.me/api/portraits/men/78.jpg',
              role: 'Climate Engineering Specialist'
            },
            _count: { comments: 71, votes: 189 },
            viewCount: 1089,
            createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            trendingScore: 0.92,
            isPinned: true
          },
          {
            id: '6',
            title: 'The hidden mathematics of music composition',
            content: "How mathematical patterns, fractals, and algorithms shape the music we love. A deep dive into the intersection of math and creativity.",
            category: { name: 'Arts', slug: 'arts' },
            user: { 
              id: 'sophiam', 
              name: 'Sophia Martinez', 
              username: 'sophiam',
              image: 'https://randomuser.me/api/portraits/women/34.jpg',
              role: 'Computational Musicologist'
            },
            _count: { comments: 28, votes: 95 },
            viewCount: 423,
            createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            trendingScore: 0.73
          },
          {
            id: '7',
            title: 'Decentralized finance: Beyond the hype to real-world applications',
            content: "DeFi has evolved beyond speculation. Here are 5 practical applications that are actually solving real financial problems today.",
            category: { name: 'Finance', slug: 'finance' },
            user: { 
              id: 'rajp', 
              name: 'Raj Patel', 
              username: 'rajp',
              image: 'https://randomuser.me/api/portraits/men/56.jpg',
              role: 'DeFi Protocol Architect'
            },
            _count: { comments: 45, votes: 127 },
            viewCount: 678,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            trendingScore: 0.81,
            isHot: true
          },
          {
            id: '8',
            title: 'Biohacking your sleep: Science-backed techniques for better rest',
            content: "From circadian rhythm optimization to sleep environment design - a comprehensive guide based on the latest sleep research.",
            category: { name: 'Health', slug: 'health' },
            user: { 
              id: 'emilyw', 
              name: 'Dr. Emily Watson', 
              username: 'emilyw',
              image: 'https://randomuser.me/api/portraits/women/45.jpg',
              role: 'Sleep Medicine Specialist'
            },
            _count: { comments: 39, votes: 112 },
            viewCount: 556,
            createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            trendingScore: 0.79
          },
          {
            id: '9',
            title: 'The future of work: How AI will reshape careers in the next decade',
            content: "Which jobs will disappear, which will emerge, and how to future-proof your career. Insights from workforce transformation research.",
            category: { name: 'Career', slug: 'career' },
            user: { 
              id: 'mikeb', 
              name: 'Michael Brown', 
              username: 'mikeb',
              image: 'https://randomuser.me/api/portraits/men/67.jpg',
              role: 'Future of Work Consultant'
            },
            _count: { comments: 67, votes: 178 },
            viewCount: 923,
            createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
            trendingScore: 0.86,
            isHot: true
          },
          {
            id: '10',
            title: 'Space tourism: The economics and ethics of commercializing space',
            content: "As space tourism becomes reality, what are the long-term implications for humanity, the environment, and space exploration?",
            category: { name: 'Space', slug: 'space' },
            user: { 
              id: 'lisaz', 
              name: 'Dr. Lisa Zhang', 
              username: 'lisaz',
              image: 'https://randomuser.me/api/portraits/women/89.jpg',
              role: 'Space Policy Researcher'
            },
            _count: { comments: 31, votes: 98 },
            viewCount: 445,
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            trendingScore: 0.74
          },
          {
            id: '11',
            title: 'Mindfulness in the digital age: Reclaiming focus in a distracted world',
            content: "Practical strategies for maintaining mental clarity and emotional balance while navigating our hyperconnected reality.",
            category: { name: 'Psychology', slug: 'psychology' },
            user: { 
              id: 'jamest', 
              name: 'James Thompson', 
              username: 'jamest',
              image: 'https://randomuser.me/api/portraits/men/23.jpg',
              role: 'Digital Wellness Expert'
            },
            _count: { comments: 43, votes: 134 },
            viewCount: 612,
            createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
            trendingScore: 0.82
          },
          {
            id: '12',
            title: 'The art of scientific communication: Making complex ideas accessible',
            content: "How to bridge the gap between cutting-edge research and public understanding. Lessons from successful science communicators.",
            category: { name: 'Education', slug: 'education' },
            user: { 
              id: 'mariad', 
              name: 'Dr. Maria Davis', 
              username: 'mariad',
              image: 'https://randomuser.me/api/portraits/women/78.jpg',
              role: 'Science Communication Specialist'
            },
            _count: { comments: 25, votes: 87 },
            viewCount: 378,
            createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            trendingScore: 0.71
          }
        ];
      }

      // Sort based on active tab with intelligent filtering
      switch (activeTab) {
        case 'trending':
          processedThreads.sort((a: Thread, b: Thread) => (b.trendingScore || 0) - (a.trendingScore || 0));
          break;
        case 'exciting':
          processedThreads = processedThreads.filter((t: Thread) => t.isHot || ((t._count?.comments || 0) + (t._count?.votes || 0)) > 100);
          processedThreads.sort((a: Thread, b: Thread) => ((b._count?.comments || 0) + (b._count?.votes || 0)) - ((a._count?.comments || 0) + (a._count?.votes || 0)));
          break;
        case 'new':
          processedThreads.sort((a: Thread, b: Thread) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'top':
          processedThreads.sort((a: Thread, b: Thread) => ((b._count?.votes || 0) + (b._count?.comments || 0)) - ((a._count?.votes || 0) + (a._count?.comments || 0)));
          break;
        case 'ai-recommended':
          // AI-powered recommendations based on user interests and trending topics
          processedThreads = processedThreads.filter((t: Thread) => 
            t.category?.name && ['Technology', 'Science', 'Health', 'Business'].includes(t.category.name)
          ).sort((a: Thread, b: Thread) => (b.trendingScore || 0) * ((b._count?.votes || 0) + (b._count?.comments || 0)) - (a.trendingScore || 0) * ((a._count?.votes || 0) + (a._count?.comments || 0)));
          break;
        case 'deep-dive':
          // Long-form, in-depth discussions with high engagement
          processedThreads = processedThreads.filter((t: Thread) => 
            (t.content?.length || 0) > 100 && (t._count?.comments || 0) > 20
          ).sort((a: Thread, b: Thread) => (b._count?.comments || 0) - (a._count?.comments || 0));
          break;
        case 'rising':
          // Recently created posts with growing engagement
          const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
          processedThreads = processedThreads.filter((t: Thread) => 
            new Date(t.createdAt || Date.now()).getTime() > oneDayAgo && ((t._count?.comments || 0) + (t._count?.votes || 0)) > 30
          ).sort((a: Thread, b: Thread) => ((b._count?.comments || 0) + (b._count?.votes || 0)) / Math.max(1, (Date.now() - new Date(b.createdAt || Date.now()).getTime()) / (1000 * 60 * 60)) - 
                          ((a._count?.comments || 0) + (a._count?.votes || 0)) / Math.max(1, (Date.now() - new Date(a.createdAt || Date.now()).getTime()) / (1000 * 60 * 60)));
          break;
        case 'expert-picks':
          // Content from verified experts and professionals
          processedThreads = processedThreads.filter((t: Thread) => 
            t.user?.role && (t.user.role.includes('Dr.') || t.user.role.includes('Prof.') || t.user.role.includes('Expert') || t.user.role.includes('Specialist'))
          ).sort((a: Thread, b: Thread) => (b.trendingScore || 0) - (a.trendingScore || 0));
          break;
      }

      setThreads(processedThreads);
      setTrendingTags(tagsResponse.tags || [
        { name: 'memory', count: 15 },
        { name: 'ai', count: 22 },
        { name: 'brain_health', count: 18 },
        { name: 'quantum_computing', count: 7 },
        { name: 'healthcare', count: 16 },
        { name: 'neuroscience', count: 9 }
      ]);
      setHighlights(highlightsResponse.posts || highlightsResponse.results || processedThreads.slice(0, 3));

    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagClick = (tag: string) => {
    router.push(`/search?q=${encodeURIComponent(tag)}&tag=true`);
  };

  const handleShowTransparency = () => {
    setShowTransparency(true);
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'trending': return <FiTrendingUp className="w-4 h-4" />;
      case 'exciting': return <FiZap className="w-4 h-4" />;
      case 'new': return <FiClock className="w-4 h-4" />;
      case 'top': return <FiArrowUp className="w-4 h-4" />;
      case 'ai-recommended': return <FiCpu className="w-4 h-4" />;
      case 'deep-dive': return <FiLayers className="w-4 h-4" />;
      case 'rising': return <FiTarget className="w-4 h-4" />;
      case 'expert-picks': return <FiAward className="w-4 h-4" />;
      default: return null;
    }
  };

  const ThreadCard = ({ thread, index }: { thread: Thread; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-gray-900/60 backdrop-blur-lg rounded-xl border border-gray-700/50 hover:border-indigo-500/30 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 group cursor-pointer"
      onClick={() => router.push(`/posts/${thread.id}`)}
    >
      {/* Thread Status Indicators */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {thread.isPinned && (
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
              📌 Pinned
            </span>
          )}
          {/* Dynamic tab-based badge */}
          {activeTab === 'trending' && (
            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">
              🔥 Trending
            </span>
          )}
          {activeTab === 'exciting' && (
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
              ⚡ Exciting
            </span>
          )}
          {activeTab === 'new' && (
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
              ✨ Fresh
            </span>
          )}
          {activeTab === 'top' && (
            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
              👑 Elite
            </span>
          )}
          {activeTab === 'ai-recommended' && (
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
              🤖 AI Curated
            </span>
          )}
          {activeTab === 'deep-dive' && (
            <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs rounded-full border border-indigo-500/30">
              🔬 Deep Dive
            </span>
          )}
          {activeTab === 'rising' && (
            <span className="px-2 py-1 bg-pink-500/20 text-pink-400 text-xs rounded-full border border-pink-500/30">
              🚀 Rising
            </span>
          )}
          {activeTab === 'expert-picks' && (
            <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/30">
              🎓 Expert Zone
            </span>
          )}
          <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs rounded-full border border-indigo-500/30">
            {thread.category?.name || 'General'}
          </span>
        </div>
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <FiEye className="w-3 h-3" />
          <span>{thread.viewCount || 0}</span>
        </div>
      </div>

      {/* User Info */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-500/30">
          <img
            src={thread.user?.image || 'https://randomuser.me/api/portraits/lego/1.jpg'}
            alt={thread.user?.name || 'Anonymous'}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="font-semibold text-white text-sm">{thread.user?.name || 'Anonymous'}</h4>
            {thread.user?.role && (
              <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                {thread.user.role}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            @{thread.user?.username || 'anonymous'} • {formatDistance(new Date(thread.createdAt || Date.now()), new Date(), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors line-clamp-2">
        {thread.title || 'Untitled Discussion'}
      </h3>
      <p className="text-gray-400 text-sm line-clamp-3 mb-4">
        {thread.content || 'No content available'}
      </p>

      {/* Engagement Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 text-gray-400 hover:text-indigo-400 transition-colors">
            <FiMessageCircle className="w-4 h-4" />
            <span className="text-sm">{thread._count?.comments || 0}</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-400 hover:text-red-400 transition-colors">
            <FiHeart className="w-4 h-4" />
            <span className="text-sm">{thread._count?.votes || 0}</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-400 hover:text-green-400 transition-colors">
            <FiShare className="w-4 h-4" />
          </div>
          <div className="flex items-center space-x-1 text-gray-400 hover:text-yellow-400 transition-colors">
            <FiBookmark className="w-4 h-4" />
          </div>
        </div>
        {thread.trendingScore && (
          <div className="flex items-center space-x-1">
            <FiStar className="w-3 h-3 text-yellow-400" />
            <span className="text-xs text-yellow-400">{(thread.trendingScore * 100).toFixed(0)}%</span>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Hero Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                SparkSquare
              </span>
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              Where brilliant minds connect and ideas ignite
            </p>
            
            {/* Enhanced Live Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
              <Link href="/users">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-lg rounded-xl p-4 border border-indigo-500/20 hover:border-indigo-400/40 transition-all duration-300 cursor-pointer hover:scale-105"
                >
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <FiUsers className="w-5 h-5 text-indigo-400" />
                    <span className="text-xl font-bold text-white">{stats.activeUsers.toLocaleString()}</span>
                  </div>
                  <p className="text-gray-400 text-sm text-center">Active Members</p>
                </motion.div>
              </Link>
              <Link href="/posts">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-lg rounded-xl p-4 border border-green-500/20 hover:border-green-400/40 transition-all duration-300 cursor-pointer hover:scale-105"
                >
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <FiMessageCircle className="w-5 h-5 text-green-400" />
                    <span className="text-xl font-bold text-white">{stats.dailyDiscussions.toLocaleString()}</span>
                  </div>
                  <p className="text-gray-400 text-sm text-center">Daily Discussions</p>
                </motion.div>
              </Link>
              <Link href="/categories">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-lg rounded-xl p-4 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 cursor-pointer hover:scale-105"
                >
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <FiTrendingUp className="w-5 h-5 text-purple-400" />
                    <span className="text-xl font-bold text-white">{stats.topicsCovered}</span>
                  </div>
                  <p className="text-gray-400 text-sm text-center">Topics Covered</p>
                </motion.div>
              </Link>
              <Link href="/users?filter=experts">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-lg rounded-xl p-4 border border-yellow-500/20 hover:border-yellow-400/40 transition-all duration-300 cursor-pointer hover:scale-105"
                >
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <FiAward className="w-5 h-5 text-yellow-400" />
                    <span className="text-xl font-bold text-white">{stats.expertContributors}</span>
                  </div>
                  <p className="text-gray-400 text-sm text-center">Expert Contributors</p>
                </motion.div>
              </Link>
              <Link href="/posts?filter=ai-recommended">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-lg rounded-xl p-4 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 cursor-pointer hover:scale-105"
                >
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <FiCpu className="w-5 h-5 text-blue-400" />
                    <span className="text-xl font-bold text-white">{stats.aiRecommendations.toLocaleString()}</span>
                  </div>
                  <p className="text-gray-400 text-sm text-center">AI Recommendations</p>
                </motion.div>
              </Link>
              <Link href="/posts?filter=trending">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gradient-to-br from-red-500/10 to-pink-500/10 backdrop-blur-lg rounded-xl p-4 border border-red-500/20 hover:border-red-400/40 transition-all duration-300 cursor-pointer hover:scale-105"
                >
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <FiTarget className="w-5 h-5 text-red-400" />
                    <span className="text-xl font-bold text-white">{stats.trendingTopics}</span>
                  </div>
                  <p className="text-gray-400 text-sm text-center">Trending Now</p>
                </motion.div>
              </Link>
            </div>

            {/* Statistics Transparency Button */}
            <div className="flex justify-center mb-8">
              <button
                onClick={handleShowTransparency}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 hover:text-white text-sm rounded-lg border border-gray-600/50 hover:border-gray-500/50 transition-all duration-200 backdrop-blur-lg"
              >
                <FiDatabase className="w-4 h-4" />
                <span>How These Numbers Work</span>
                <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded">
                  AI-Powered
                </span>
              </button>
            </div>

            {/* Enhanced Semantic Search */}
            <div className="max-w-2xl mx-auto mb-8">
              <SemanticSearchBar 
                placeholder="Search with AI-powered semantic search..."
                size="lg"
                variant="semantic"
                defaultCategory="trending"
                onSearch={(query, category) => {
                  const params = new URLSearchParams({
                    q: query,
                    type: 'semantic',
                    category: category || 'trending'
                  });
                  router.push(`/search?${params.toString()}`);
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Feed */}
            <div className="lg:col-span-3">
              {/* Enhanced Tab Navigation */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-2 bg-gray-900/60 backdrop-blur-lg rounded-xl p-4 border border-gray-700/50">
                  {([
                    { 
                      key: 'trending', 
                      label: '🔥 Trending', 
                      emoji: '🔥',
                      description: 'Most viral discussions right now',
                      tagline: 'What everyone\'s talking about',
                      count: feedCounts.trending || 0,
                      gradient: 'from-red-500 to-orange-500'
                    },
                    { 
                      key: 'exciting', 
                      label: '⚡ Exciting', 
                      emoji: '⚡',
                      description: 'High-energy discussions with amazing engagement',
                      tagline: 'Electrifying conversations',
                      count: feedCounts.exciting || 0,
                      gradient: 'from-yellow-500 to-orange-500'
                    },
                    { 
                      key: 'new', 
                      label: '✨ Fresh', 
                      emoji: '✨',
                      description: 'Latest discussions and fresh perspectives',
                      tagline: 'Just dropped',
                      count: feedCounts.new || 0,
                      gradient: 'from-green-500 to-emerald-500'
                    },
                    { 
                      key: 'top', 
                      label: '👑 Elite', 
                      emoji: '👑',
                      description: 'Highest-rated discussions of all time',
                      tagline: 'The absolute best',
                      count: feedCounts.top || 0,
                      gradient: 'from-purple-500 to-pink-500'
                    },
                    { 
                      key: 'ai-recommended', 
                      label: '🤖 AI Curated', 
                      emoji: '🤖',
                      description: 'Personalized content curated by AI',
                      tagline: 'Just for you',
                      count: feedCounts['ai-recommended'] || 0,
                      gradient: 'from-blue-500 to-cyan-500'
                    },
                    { 
                      key: 'deep-dive', 
                      label: '🔬 Deep Dive', 
                      emoji: '🔬',
                      description: 'In-depth analysis and comprehensive discussions',
                      tagline: 'Detailed insights',
                      count: feedCounts['deep-dive'] || 0,
                      gradient: 'from-indigo-500 to-purple-500'
                    },
                    { 
                      key: 'rising', 
                      label: '🚀 Rising', 
                      emoji: '🚀',
                      description: 'Fast-growing discussions gaining momentum',
                      tagline: 'On the rise',
                      count: feedCounts.rising || 0,
                      gradient: 'from-pink-500 to-rose-500'
                    },
                    { 
                      key: 'expert-picks', 
                      label: '🎓 Expert Zone', 
                      emoji: '🎓',
                      description: 'Curated content from verified industry experts',
                      tagline: 'Professional insights',
                      count: feedCounts['expert-picks'] || 0,
                      gradient: 'from-amber-500 to-yellow-500'
                    }
                  ] as const).map((tab) => (
                    <motion.button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`group flex flex-col items-center space-y-1 px-4 py-3 rounded-xl transition-all duration-300 relative min-w-[100px] ${
                        activeTab === tab.key
                          ? 'text-white shadow-xl shadow-indigo-500/20'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                      }`}
                      title={`${tab.description} • ${tab.tagline}`}
                    >
                      {/* Tab Icon & Label */}
                      <div className="flex items-center space-x-1">
                        <span className="text-lg">{tab.emoji}</span>
                        <span className="text-sm font-semibold whitespace-nowrap">
                          {tab.label.replace(/^[^\s]+ /, '')} {/* Remove emoji from label */}
                        </span>
                      </div>
                      
                      {/* Count Badge */}
                      <span className="text-xs text-gray-400 group-hover:text-gray-300 font-medium">
                        {tab.count.toLocaleString()}
                      </span>
                      
                      {/* Active Tab Background with Custom Gradient */}
                      {activeTab === tab.key && (
                        <motion.div
                          layoutId="activeTab"
                          className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} rounded-xl -z-10 opacity-90`}
                        />
                      )}
                      
                      {/* Hover Effect */}
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} rounded-xl -z-20 opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
                      />
                    </motion.button>
                  ))}
                </div>
                
                {/* Enhanced Tab Description with Stats */}
                <div className="mt-4 text-center bg-gray-900/40 rounded-lg p-4 border border-gray-700/30">
                  <div className="flex items-center justify-center space-x-4 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">
                        {activeTab === 'trending' && '🔥'}
                        {activeTab === 'exciting' && '⚡'}
                        {activeTab === 'new' && '✨'}
                        {activeTab === 'top' && '👑'}
                        {activeTab === 'ai-recommended' && '🤖'}
                        {activeTab === 'deep-dive' && '🔬'}
                        {activeTab === 'rising' && '🚀'}
                        {activeTab === 'expert-picks' && '🎓'}
                      </span>
                      <h3 className="text-lg font-semibold text-white">
                        {activeTab === 'trending' && 'Trending Now'}
                        {activeTab === 'exciting' && 'Exciting Discussions'}
                        {activeTab === 'new' && 'Fresh Content'}
                        {activeTab === 'top' && 'Elite Discussions'}
                        {activeTab === 'ai-recommended' && 'AI Curated'}
                        {activeTab === 'deep-dive' && 'Deep Analysis'}
                        {activeTab === 'rising' && 'Rising Stars'}
                        {activeTab === 'expert-picks' && 'Expert Zone'}
                      </h3>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-300 mb-3">
                    {activeTab === 'trending' && 'Discover viral discussions that are capturing everyone\'s attention right now. These are the conversations shaping our community.'}
                    {activeTab === 'exciting' && 'High-energy discussions with incredible engagement and passionate participants. Feel the excitement!'}
                    {activeTab === 'new' && 'Fresh perspectives and the latest conversations just added to our community. Be among the first to join!'}
                    {activeTab === 'top' && 'The absolute best discussions with the highest ratings and most valuable insights from our community.'}
                    {activeTab === 'ai-recommended' && 'Personalized content curated by our AI based on your interests, activity, and trending topics in your areas.'}
                    {activeTab === 'deep-dive' && 'Comprehensive, in-depth discussions with detailed analysis and thorough exploration of complex topics.'}
                    {activeTab === 'rising' && 'Fast-growing discussions gaining serious momentum. Catch these conversations before they explode!'}
                    {activeTab === 'expert-picks' && 'Carefully curated content from verified industry experts, thought leaders, and professional specialists.'}
                  </p>
                  
                  {/* Related Tags */}
                  <div className="flex flex-wrap justify-center gap-2">
                    {activeTab === 'trending' && ['#viral', '#popular', '#community', '#discussions'].map(tag => (
                      <span key={tag} className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded-full border border-red-500/30">
                        {tag}
                      </span>
                    ))}
                    {activeTab === 'exciting' && ['#energy', '#engagement', '#passionate', '#active'].map(tag => (
                      <span key={tag} className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full border border-yellow-500/30">
                        {tag}
                      </span>
                    ))}
                    {activeTab === 'new' && ['#fresh', '#latest', '#recent', '#new'].map(tag => (
                      <span key={tag} className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
                        {tag}
                      </span>
                    ))}
                    {activeTab === 'top' && ['#elite', '#best', '#top-rated', '#quality'].map(tag => (
                      <span key={tag} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
                        {tag}
                      </span>
                    ))}
                    {activeTab === 'ai-recommended' && ['#personalized', '#ai-curated', '#smart', '#for-you'].map(tag => (
                      <span key={tag} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">
                        {tag}
                      </span>
                    ))}
                    {activeTab === 'deep-dive' && ['#analysis', '#detailed', '#comprehensive', '#insights'].map(tag => (
                      <span key={tag} className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded-full border border-indigo-500/30">
                        {tag}
                      </span>
                    ))}
                    {activeTab === 'rising' && ['#momentum', '#growing', '#trending-up', '#rising'].map(tag => (
                      <span key={tag} className="px-2 py-1 bg-pink-500/20 text-pink-300 text-xs rounded-full border border-pink-500/30">
                        {tag}
                      </span>
                    ))}
                    {activeTab === 'expert-picks' && ['#experts', '#professional', '#verified', '#authority'].map(tag => (
                      <span key={tag} className="px-2 py-1 bg-amber-500/20 text-amber-300 text-xs rounded-full border border-amber-500/30">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* Transparency Button */}
                  <div className="mt-3 flex justify-center">
                    <button
                      onClick={handleShowTransparency}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 hover:text-indigo-200 text-sm rounded-lg border border-indigo-500/30 hover:border-indigo-500/50 transition-all duration-200"
                    >
                      <FiInfo className="w-4 h-4" />
                      <span>How This Works</span>
                      <FiDatabase className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Category Filter Section */}
                <div className="mt-4 bg-gray-900/40 rounded-lg p-4 border border-gray-700/30">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-white flex items-center">
                      <FiFolder className="mr-2 h-4 w-4" />
                      Filter by Category
                    </h4>
                    <Link 
                      href="/categories" 
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center"
                    >
                      View All <FiArrowUp className="ml-1 h-3 w-3 rotate-45" />
                    </Link>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'all', label: '🌟 All Topics', gradient: 'from-gray-500 to-gray-600' },
                      { key: 'technology', label: '💻 Technology', gradient: 'from-blue-500 to-cyan-500' },
                      { key: 'science', label: '🔬 Science', gradient: 'from-green-500 to-emerald-500' },
                      { key: 'health', label: '🏥 Health & Wellness', gradient: 'from-pink-500 to-rose-500' },
                      { key: 'philosophy', label: '🤔 Philosophy', gradient: 'from-purple-500 to-violet-500' },
                      { key: 'art', label: '🎨 Art & Culture', gradient: 'from-orange-500 to-red-500' },
                      { key: 'education', label: '📚 Education', gradient: 'from-yellow-500 to-amber-500' }
                    ].map((category) => (
                      <motion.button
                        key={category.key}
                        onClick={() => setActiveCategory(category.key)}
                        className={`relative px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-300 group ${
                          activeCategory === category.key
                            ? 'text-white shadow-lg transform scale-105'
                            : 'text-gray-300 hover:text-white hover:scale-105'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {category.label}
                        
                        {/* Active Background */}
                        {activeCategory === category.key && (
                          <motion.div
                            layoutId="categoryBackground"
                            className={`absolute inset-0 bg-gradient-to-r ${category.gradient} rounded-full -z-10`}
                            initial={false}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        
                        {/* Hover Effect */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-r ${category.gradient} rounded-full -z-20 opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
                        />
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Threads Feed */}
              <div className="space-y-6">
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <LoadingIndicator />
                  ) : (
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      {threads.map((thread, index) => (
                        <ThreadCard key={thread.id} thread={thread} index={index} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Enhanced Sidebar */}
            <div className="space-y-6">
              {/* Trending Topics */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-900/60 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <FiTrendingUp className="w-5 h-5 mr-2 text-indigo-400" />
                  Trending Topics
                  <span className="ml-auto text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-full">
                    Live
                  </span>
                </h3>
                <TrendingTags tags={trendingTags} onTagClick={handleTagClick} />
              </motion.div>

              {/* AI Insights */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-lg rounded-xl p-6 border border-blue-500/20"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <FiCpu className="w-5 h-5 mr-2 text-blue-400" />
                  AI Insights
                  <span className="ml-auto text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                    Smart
                  </span>
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-400">Content Quality</span>
                      <span className="text-xs text-blue-300">94%</span>
                    </div>
                    <div className="w-full bg-blue-900/30 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                    </div>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-400">Engagement Score</span>
                      <span className="text-xs text-purple-300">87%</span>
                    </div>
                    <div className="w-full bg-purple-900/30 rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                    </div>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-400">Discovery Rate</span>
                      <span className="text-xs text-green-300">91%</span>
                    </div>
                    <div className="w-full bg-green-900/30 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{ width: '91%' }}></div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Expert Highlights */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-lg rounded-xl p-6 border border-yellow-500/20"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <FiAward className="w-5 h-5 mr-2 text-yellow-400" />
                  Expert Highlights
                  <span className="ml-auto text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                    Verified
                  </span>
                </h3>
                <div className="space-y-3">
                  {highlights.slice(0, 4).map((highlight, index) => (
                    <motion.div
                      key={highlight.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      onClick={() => router.push(`/posts/${highlight.id}`)}
                      className="p-3 bg-yellow-500/10 rounded-lg cursor-pointer hover:bg-yellow-500/20 transition-all duration-200 border border-yellow-500/20 hover:border-yellow-400/40"
                    >
                      <h4 className="text-sm font-medium text-white line-clamp-2 mb-2">
                        {highlight.title}
                      </h4>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1">
                          <div className="w-4 h-4 rounded-full bg-yellow-400/20 flex items-center justify-center">
                            <FiStar className="w-2 h-2 text-yellow-400" />
                          </div>
                          <span className="text-yellow-400">{highlight.user?.name || 'Anonymous'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-400">
                          <span>{highlight._count?.comments || 0}</span>
                          <FiMessageCircle className="w-3 h-3" />
                          <span>{highlight._count?.votes || 0}</span>
                          <FiHeart className="w-3 h-3" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gray-900/60 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <FiCompass className="w-5 h-5 mr-2 text-green-400" />
                  Quick Discover
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setActiveTab('ai-recommended')}
                    className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-all duration-200 text-center"
                  >
                    <FiCpu className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                    <span className="text-xs text-blue-400 font-medium">AI Picks</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('expert-picks')}
                    className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20 hover:bg-yellow-500/20 transition-all duration-200 text-center"
                  >
                    <FiAward className="w-4 h-4 mx-auto mb-1 text-yellow-400" />
                    <span className="text-xs text-yellow-400 font-medium">Experts</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('rising')}
                    className="p-3 bg-red-500/10 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-all duration-200 text-center"
                  >
                    <FiTarget className="w-4 h-4 mx-auto mb-1 text-red-400" />
                    <span className="text-xs text-red-400 font-medium">Rising</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('deep-dive')}
                    className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20 hover:bg-purple-500/20 transition-all duration-200 text-center"
                  >
                    <FiLayers className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                    <span className="text-xs text-purple-400 font-medium">Deep Dive</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Activity Feed */}
      <ActivityFeed />
      
      {/* Transparency Modal */}
      <TransparencyModal 
        isOpen={showTransparency}
        onClose={() => setShowTransparency(false)}
        feedType={activeTab}
      />
    </div>
  );
}
