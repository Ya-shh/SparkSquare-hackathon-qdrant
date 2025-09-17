"use client";

import { useEffect, useState, use } from 'react';
import { FiMessageCircle, FiUser, FiThumbsUp, FiCalendar, FiChevronUp, FiChevronDown, FiShare2, FiImage } from 'react-icons/fi';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import StickerPicker from '@/components/StickerPicker';
import ReactionsDisplay from '@/components/ReactionsDisplay';
import React from 'react';

const getThreadById = (id: string) => {
  const threads = [
    {
      id: '1',
      title: 'How to improve brain memory and cognition',
      content: "I've been researching techniques to improve memory and cognitive function. Has anyone tried specific supplements or techniques that have worked well? I've heard about nootropics, meditation, and certain exercises that might help. Also interested in understanding the science behind memory formation and recall. Thanks for any insights!",
      category: { name: 'Health', slug: 'health' },
      user: { 
        name: 'Sarah Chen', 
        username: 'sarahc', 
        avatar: 'https://randomuser.me/api/portraits/women/23.jpg'
      },
      createdAt: '2023-10-15T13:45:00Z',
      _count: { comments: 24, votes: 78 }
    },
    {
      id: '2',
      title: 'The future of AI in healthcare',
      content: "As AI becomes more sophisticated, what applications in healthcare do you think will have the biggest impact in the next 5 years? I'm particularly interested in diagnostic tools, personalized medicine, and administrative automation. Are there ethical concerns we should be addressing now before these technologies become more widespread?",
      category: { name: 'Technology', slug: 'technology' },
      user: { 
        name: 'Marcus Johnson', 
        username: 'mjohnson', 
        avatar: 'https://randomuser.me/api/portraits/men/42.jpg'
      },
      createdAt: '2023-10-14T10:22:00Z',
      _count: { comments: 36, votes: 92 }
    },
    {
      id: '3',
      title: 'Understanding quantum computing basics',
      content: "I'm trying to wrap my head around quantum computing principles. Can someone explain qubits and superposition in simple terms? How is quantum computing different from classical computing in terms of problem-solving approaches? Any recommended resources for beginners in this field?",
      category: { name: 'Science', slug: 'science' },
      user: { 
        name: 'Eliza Wong', 
        username: 'ewong', 
        avatar: 'https://randomuser.me/api/portraits/women/56.jpg'
      },
      createdAt: '2023-10-12T08:17:00Z',
      _count: { comments: 18, votes: 45 }
    },
    {
      id: '4',
      title: 'The philosophy of consciousness',
      content: "How do different philosophical traditions approach the concept of consciousness? Looking for reading recommendations. I'm especially interested in Eastern vs Western perspectives, and how these views have evolved over time. Also interested in how modern neuroscience is changing our philosophical understanding of consciousness.",
      category: { name: 'Philosophy', slug: 'philosophy' },
      user: { 
        name: 'Richard Barnes', 
        username: 'rbarnes', 
        avatar: 'https://randomuser.me/api/portraits/men/78.jpg'
      },
      createdAt: '2023-10-11T14:35:00Z',
      _count: { comments: 42, votes: 67 }
    },
    {
      id: '5',
      title: 'Digital art techniques for beginners',
      content: "I'm just starting with digital art. What software and techniques would you recommend for someone completely new? I have some traditional art background but I'm finding the transition challenging. Are there specific tutorials or courses that were helpful for those of you who made this transition?",
      category: { name: 'Art & Culture', slug: 'art' },
      user: { 
        name: 'Maya Patel', 
        username: 'mpatel', 
        avatar: 'https://randomuser.me/api/portraits/women/33.jpg'
      },
      createdAt: '2023-10-10T16:42:00Z',
      _count: { comments: 29, votes: 53 }
    }
  ];

  // Handle various ID patterns - if someone passes s1, h1, t1, etc., convert to numeric
  let searchId = id;
  if (id.match(/^[sht]\d+$/)) {
    searchId = id.replace(/^[sht]/, '');
  }

  return threads.find(thread => thread.id === searchId) || null;
};

const getCommentsByThreadId = (threadId: string) => {
  const allComments = {
    '1': [
      {
        id: 'c1',
        content: "I've had great results with a combination of daily meditation (20 minutes) and omega-3 supplements. There's solid research behind both for cognitive benefits.",
        user: { 
          name: 'Dr. Alan Parker', 
          username: 'dralan', 
          avatar: 'https://randomuser.me/api/portraits/men/64.jpg'
        },
        createdAt: '2023-10-15T14:30:00Z',
        votes: 15,
        isExpert: true
      },
      {
        id: 'c2',
        content: "Exercise has been the most effective for me. Particularly aerobic exercise 3-4 times a week has improved my focus and recall significantly.",
        user: { 
          name: 'Jennifer Smith', 
          username: 'jsmith', 
          avatar: 'https://randomuser.me/api/portraits/women/12.jpg'
        },
        createdAt: '2023-10-15T15:12:00Z',
        votes: 8,
        isExpert: false
      },
      {
        id: 'c3',
        content: "Don't overlook sleep quality. Since improving my sleep hygiene, my memory and cognitive function have improved dramatically. I'd recommend the book 'Why We Sleep' by Matthew Walker.",
        user: { 
          name: 'Michael Wong', 
          username: 'mwong', 
          avatar: 'https://randomuser.me/api/portraits/men/86.jpg'
        },
        createdAt: '2023-10-15T16:47:00Z',
        votes: 22,
        isExpert: false
      }
    ],
    '2': [
      {
        id: 'c1',
        content: "I think AI-powered diagnostic tools will have the biggest impact. We're already seeing AI outperform radiologists in detecting certain conditions from medical imaging.",
        user: { 
          name: 'Dr. Sarah Johnson', 
          username: 'drsarah', 
          avatar: 'https://randomuser.me/api/portraits/women/45.jpg'
        },
        createdAt: '2023-10-14T11:05:00Z',
        votes: 19,
        isExpert: true
      },
      {
        id: 'c2',
        content: "The ethical implications are huge and we're not addressing them fast enough. Issues of bias in training data could lead to disparities in care quality across different demographics.",
        user: { 
          name: 'Professor Tom Richards', 
          username: 'tomr', 
          avatar: 'https://randomuser.me/api/portraits/men/28.jpg'
        },
        createdAt: '2023-10-14T12:38:00Z',
        votes: 24,
        isExpert: true
      }
    ],
    '3': [
      {
        id: 'c1',
        content: "Think of qubits as coins spinning in the air - they're neither heads nor tails until observed, but rather in a probability state of both. This is superposition. Quantum computers leverage this to process multiple possibilities simultaneously.",
        user: { 
          name: 'Dr. Quantum', 
          username: 'drq', 
          avatar: 'https://randomuser.me/api/portraits/men/35.jpg'
        },
        createdAt: '2023-10-12T09:30:00Z',
        votes: 35,
        isExpert: true
      }
    ],
    '4': [
      {
        id: 'c1',
        content: "I'd recommend 'Consciousness Explained' by Daniel Dennett for a Western perspective, and 'The Embodied Mind' for an approach that bridges Eastern philosophy with cognitive science.",
        user: { 
          name: 'Philosophy Fan', 
          username: 'philofan', 
          avatar: 'https://randomuser.me/api/portraits/women/68.jpg'
        },
        createdAt: '2023-10-11T15:20:00Z',
        votes: 12,
        isExpert: false
      }
    ],
    '5': [
      {
        id: 'c1',
        content: "Procreate on iPad is fantastic for beginners. The interface is intuitive and there are tons of great tutorials on YouTube. I'd suggest starting with basic sketching techniques before moving to more complex digital tools.",
        user: { 
          name: 'Digital Artist', 
          username: 'digiart', 
          avatar: 'https://randomuser.me/api/portraits/men/15.jpg'
        },
        createdAt: '2023-10-10T17:15:00Z',
        votes: 18,
        isExpert: true
      }
    ]
  };

  return allComments[threadId as keyof typeof allComments] || [];
};

export default function ThreadDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const [thread, setThread] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOption, setSortOption] = useState('popular'); // 'popular', 'recent'
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const threadData = getThreadById(resolvedParams.id);
    const commentsData = getCommentsByThreadId(resolvedParams.id);
    
    setThread(threadData);
    setComments(commentsData);
    setIsLoading(false);
  }, [resolvedParams.id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleSortChange = (option: string) => {
    setSortOption(option);
    
    const sortedComments = [...comments];
    if (option === 'popular') {
      sortedComments.sort((a, b) => b.votes - a.votes);
    } else if (option === 'recent') {
      sortedComments.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    
    setComments(sortedComments);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    alert('In a real app, this would submit your comment: ' + newComment);
    setNewComment('');
  };

  const handleStickerSelect = (sticker: string) => {
    const stickerToEmoji: Record<string, string> = {
      'heart': '❤️',
      'thumbs-up': '👍',
      'laugh': '😂',
      'wow': '😮',
      'rocket': '🚀',
      'lightbulb': '💡'
    };
    
    setNewComment(prev => prev + ` ${stickerToEmoji[sticker] || sticker} `);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, name: string) => {
    const target = e.target as HTMLImageElement;
    const gender = Math.random() > 0.5 ? 'men' : 'women';
    const imageNumber = Math.floor(Math.random() * 99) + 1;
    target.src = `https://randomuser.me/api/portraits/${gender}/${imageNumber}.jpg`;
    target.onerror = null; // Prevent infinite error loops
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="card-modern p-10 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Thread Not Found</h1>
          <p className="text-gray-400 mb-6">The thread you're looking for doesn't exist or has been removed.</p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {}
        <div className="lg:col-span-9">
          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="card-cosmic p-6 mb-8 relative overflow-hidden"
            data-aos="fade-up"
            data-aos-duration="800"
          >
            {}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 filter blur-xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full -ml-12 -mb-12 filter blur-xl"></div>
            </div>
            
            {}
            <div className="flex justify-between items-center mb-4">
              <Link 
                href="/"
                className="text-sm text-gray-400 hover:text-indigo-400 transition-colors"
              >
                ← Back to Discussions
              </Link>
              <span className="bg-indigo-500/20 text-indigo-400 text-xs px-3 py-1 rounded-full">
                {thread.category.name}
              </span>
            </div>
            
            {}
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">{thread.title}</h1>
            
            {}
            <div className="flex items-center mb-6">
              <div className="relative h-10 w-10 rounded-full overflow-hidden mr-3">
                <Image
                  src={thread.user.avatar}
                  alt={thread.user.name}
                  fill
                  sizes="40px"
                  priority
                  className="object-cover"
                  onError={(e) => handleImageError(e, thread.user.name)}
                />
              </div>
              <div>
                <p className="text-white font-medium">{thread.user.name}</p>
                <div className="flex items-center text-sm text-gray-400">
                  <FiCalendar className="mr-1" />
                  <span>{formatDate(thread.createdAt)}</span>
                </div>
              </div>
            </div>
            
            {}
            <div className="prose prose-invert max-w-none mb-6 relative z-10">
              <p className="text-gray-200 leading-relaxed text-lg">{thread.content}</p>
            </div>
            
            {}
            <div className="flex items-center justify-between pt-6 border-t border-gray-800">
              <div className="flex items-center space-x-4">
                <button className="flex items-center text-gray-400 hover:text-indigo-400 transition-colors">
                  <FiThumbsUp className="mr-1" />
                  <span>Upvote ({thread._count.votes})</span>
                </button>
                <button className="flex items-center text-gray-400 hover:text-indigo-400 transition-colors">
                  <FiShare2 className="mr-1" />
                  <span>Share</span>
                </button>
              </div>
              
              <div className="text-gray-400">
                <FiMessageCircle className="inline-block mr-1" />
                {thread._count.comments} comments
              </div>
            </div>
            
            {}
            <div className="mt-4">
              <ReactionsDisplay 
                reactions={[
                  { type: 'heart', count: 8, users: ['User 1', 'User 2', 'User 3', 'User 4', 'User 5', 'User 6', 'User 7', 'User 8'] },
                  { type: 'thumbs-up', count: 5, users: ['User 9', 'User 10', 'User 11', 'User 12', 'User 13'] },
                  { type: 'rocket', count: 3, users: ['User 14', 'User 15', 'User 16'] },
                  { type: 'lightbulb', count: 2, users: ['User 17', 'User 18'] }
                ]}
                onReact={(reactionType) => {
                  console.log(`Added ${reactionType} reaction to thread ${thread.id}`);
                }}
              />
            </div>
          </motion.div>
          
          {}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white relative">
                Comments ({comments.length})
                <span className="absolute bottom-0 left-0 w-1/2 h-0.5 bg-gradient-to-r from-indigo-500 to-transparent"></span>
              </h3>
              <div className="flex items-center space-x-3">
                <label htmlFor="sort" className="text-gray-300 text-sm">
                  Sort by:
                </label>
                <select
                  id="sort"
                  value={sortOption}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="bg-gray-800/80 backdrop-blur-sm border border-indigo-500/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                >
                  <option value="popular">Popular</option>
                  <option value="recent">Recent</option>
                </select>
              </div>
            </div>
            
            {}
            <div className="card-cosmic p-6 mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-6 -mt-6 filter blur-xl"></div>
              <h3 className="text-lg font-semibold text-white mb-4 relative z-10">Join the Discussion</h3>
              <form onSubmit={handleSubmitComment}>
                <div className="relative">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add your thoughts to the discussion..."
                    className="w-full bg-gray-800/70 backdrop-blur-sm border border-indigo-500/20 rounded-lg p-4 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all min-h-[120px] shadow-inner"
                  ></textarea>
                  
                  <StickerPicker
                    onSelect={handleStickerSelect}
                    className="absolute right-2 bottom-2"
                  />
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all shadow-md hover:shadow-indigo-500/20 hover:shadow-lg"
                  >
                    Post Comment
                  </button>
                </div>
              </form>
            </div>
            
            {}
            {comments.length === 0 ? (
              <div className="card-modern p-8 text-center">
                <p className="text-gray-400 mb-4">No comments yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="card-modern p-6"
                  >
                    <div className="flex items-start">
                      {}
                      <div className="flex flex-col items-center mr-4">
                        <button className="text-gray-400 hover:text-indigo-400 transition-colors">
                          <FiChevronUp size={20} />
                        </button>
                        <span className="my-1 font-medium text-white">{comment.votes}</span>
                        <button className="text-gray-400 hover:text-indigo-400 transition-colors">
                          <FiChevronDown size={20} />
                        </button>
                      </div>
                      
                      {}
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden">
                            <Image
                              src={comment.user.avatar}
                              alt={comment.user.name}
                              fill
                              sizes="32px"
                              className="object-cover"
                              onError={(e) => handleImageError(e, comment.user.name)}
                            />
                          </div>
                          <div>
                            <Link href={`/users/${comment.user.username}`} className="font-medium hover:underline">
                              {comment.user.name}
                            </Link>
                            {comment.isExpert && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                Expert
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="prose prose-invert max-w-none">
                          <p className="text-gray-300">{comment.content}</p>
                        </div>
                        
                        <div className="mt-4 flex items-center space-x-4">
                          <button className="text-sm text-gray-400 hover:text-indigo-400 transition-colors">
                            Reply
                          </button>
                          <button className="text-sm text-gray-400 hover:text-indigo-400 transition-colors">
                            Share
                          </button>
                        </div>
                        
                        {}
                        <ReactionsDisplay 
                          reactions={[
                            ...(comment.id.charCodeAt(0) % 2 === 0 ? [{ type: 'heart', count: 3, users: ['User 1', 'User 2', 'User 3'] }] : []),
                            ...(comment.id.charCodeAt(0) % 3 === 0 ? [{ type: 'laugh', count: 2, users: ['User 4', 'User 5'] }] : []),
                            ...(comment.id.charCodeAt(0) % 5 === 0 ? [{ type: 'rocket', count: 1, users: ['User 6'] }] : []),
                            ...(comment.id.charCodeAt(0) % 7 === 0 ? [{ type: 'lightbulb', count: 1, users: ['User 7'] }] : [])
                          ].filter(r => r.count > 0)}
                          onReact={(reactionType) => {
                            console.log(`Added ${reactionType} reaction to comment ${comment.id}`);
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {}
        <div className="lg:col-span-3">
          <div className="card-modern p-6 mb-6">
            <h3 className="font-bold text-white mb-4">About the Author</h3>
            <div className="flex items-center mb-4">
              <div className="relative h-12 w-12 rounded-full overflow-hidden mr-3">
                <Image
                  src={thread.user.avatar}
                  alt={thread.user.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                  onError={(e) => handleImageError(e, thread.user.name)}
                />
              </div>
              <div>
                <p className="text-white font-medium">{thread.user.name}</p>
                <p className="text-sm text-gray-400">@{thread.user.username}</p>
              </div>
            </div>
            <button className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Follow
            </button>
          </div>
          
          <div className="card-modern p-6">
            <h3 className="font-bold text-white mb-4">Related Discussions</h3>
            <div className="space-y-4">
              <Link href="#" className="block p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors">
                <h4 className="text-white font-medium mb-1 line-clamp-2">
                  The link between exercise and cognitive function
                </h4>
                <p className="text-xs text-gray-400">12 comments</p>
              </Link>
              <Link href="#" className="block p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors">
                <h4 className="text-white font-medium mb-1 line-clamp-2">
                  Nootropics: Do they actually work?
                </h4>
                <p className="text-xs text-gray-400">8 comments</p>
              </Link>
              <Link href="#" className="block p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors">
                <h4 className="text-white font-medium mb-1 line-clamp-2">
                  Latest research on brain plasticity
                </h4>
                <p className="text-xs text-gray-400">19 comments</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 