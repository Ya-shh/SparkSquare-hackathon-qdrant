"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  FiMessageCircle, 
  FiUser, 
  FiThumbsUp,
  FiShare2, 
  FiCornerDownRight, 
  FiBookmark, 
  FiMoreHorizontal,
  FiEdit,
  FiFlag,
  FiTrash2,
  FiClock,
  FiAlertCircle,
  FiLink,
  FiHeart,
  FiSend,
  FiImage,
  FiPaperclip,
  FiTrendingUp,
  FiThumbsDown,
  FiMessageSquare,
  FiExternalLink
} from "react-icons/fi";
import toast from '@/lib/toast';
import VoteButtons from "./VoteButtons";
import BookmarkButton from "./BookmarkButton";
import ShareButton from "./ShareButton";
import UserProfileMini from "./UserProfileMini";
import ReactionsDisplay from "@/components/ReactionsDisplay";

interface ThreadReply {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
  };
  _count: {
    votes: number;
    replies: number;
  };
  votes: Array<{
    id: string;
    userId: string;
    value: number;
  }>;
  isLiked: boolean;
  likeCount: number;
  level: number;
  highlighted?: boolean;
}

interface Thread {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  _count: {
    comments: number;
    votes: number;
  };
  votes: Array<{
    id: string;
    userId: string;
    value: number;
  }>;
  replies?: ThreadReply[];
}

type EnhancedThreadViewProps = {
  threadId: string;
  initialThread?: Thread;
  highlightReplyId?: string;
};

export default function EnhancedThreadView({ 
  threadId, 
  initialThread,
  highlightReplyId 
}: EnhancedThreadViewProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [thread, setThread] = useState<Thread | null>(initialThread || null);
  const [replies, setReplies] = useState<ThreadReply[]>([]);
  const [isLoading, setIsLoading] = useState(!initialThread);
  const [loadingReplies, setLoadingReplies] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showRichEditor, setShowRichEditor] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'chronological'>('popular');
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const highlightedReplyRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!initialThread) {
      fetchThread();
    }
    fetchReplies();
  }, [threadId, initialThread]);

  useEffect(() => {
    if (highlightReplyId && highlightedReplyRef.current) {
      highlightedReplyRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightReplyId, replies]);

  const fetchThread = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/threads/${threadId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch thread');
      }
      const data = await response.json();
      setThread(data.thread);
    } catch (error) {
      console.error('Error fetching thread:', error);
      toast.error('Failed to load the thread');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReplies = async () => {
    setLoadingReplies(true);
    try {
      const response = await fetch(`/api/threads/${threadId}/replies?sort=${sortBy}`);
      if (!response.ok) {
        throw new Error('Failed to fetch replies');
      }
      const data = await response.json();
      
      const transformedReplies = buildReplyTree(data.replies);
      setReplies(transformedReplies);
    } catch (error) {
      console.error('Error fetching replies:', error);
      toast.error('Failed to load replies');
    } finally {
      setLoadingReplies(false);
    }
  };

  const buildReplyTree = (rawReplies: any[]): ThreadReply[] => {
    const replyMap = new Map<string, ThreadReply & { parentId: string | null }>();
    
    rawReplies.forEach(reply => {
      replyMap.set(reply.id, {
        ...reply,
        level: 0, // Initialize level, will be calculated in second pass
        highlighted: reply.id === highlightReplyId,
        isLiked: reply.isLiked || false,
        likeCount: reply._count?.likes || 0
      });
    });
    
    const processedReplies: ThreadReply[] = [];
    
    const processReply = (replyId: string, level: number) => {
      const reply = replyMap.get(replyId);
      if (!reply) return;
      
      reply.level = level;
      processedReplies.push(reply);
      
      const childReplies = Array.from(replyMap.values())
        .filter(r => r.parentId === replyId);
      
      childReplies.forEach(child => {
        processReply(child.id, level + 1);
      });
    };
    
    const topLevelReplies = Array.from(replyMap.values())
      .filter(reply => reply.parentId === null);
    
    topLevelReplies.forEach(reply => {
      processReply(reply.id, 0);
    });
    
    return processedReplies;
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      router.push('/sign-in');
      return;
    }
    
    if (!replyContent.trim()) return;
    
    setSubmitting(true);
    
    try {
      const response = await fetch(`/api/threads/${threadId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent,
          parentId: replyingTo
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to post reply');
      }
      
      toast.success('Reply posted successfully');
      
      setReplyContent('');
      
      setReplyingTo(null);
      
      fetchReplies();
      
      router.refresh();
      
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSortChange = (newSort: 'popular' | 'recent' | 'chronological') => {
    setSortBy(newSort);
    fetchReplies();
  };

  const toggleReplyExpansion = (replyId: string) => {
    setExpandedReplies(prev => ({
      ...prev,
      [replyId]: !prev[replyId]
    }));
  };

  const startReply = (replyId: string | null) => {
    setReplyingTo(replyId);
    setShowRichEditor(true);
    
    setTimeout(() => {
      if (replyInputRef.current) {
        replyInputRef.current.focus();
      }
    }, 100);
  };

  const handleLikeReply = async (replyId: string) => {
    if (!session) {
      router.push('/sign-in');
      return;
    }
    
    setReplies(prev => 
      prev.map(reply => 
        reply.id === replyId 
          ? { 
              ...reply, 
              isLiked: !reply.isLiked,
              likeCount: reply.isLiked ? reply.likeCount - 1 : reply.likeCount + 1
            }
          : reply
      )
    );
    
    try {
      const response = await fetch(`/api/replies/${replyId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to like reply');
      }
      
      fetchReplies();
      
    } catch (error) {
      console.error('Error liking reply:', error);
      toast.error('Failed to like the reply');
      
      fetchReplies();
    }
  };

  if (isLoading || !thread) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const threadScore = thread.votes ? 
    thread.votes.reduce((acc, vote) => acc + vote.value, 0) : 0;

  return (
    <div className="max-w-4xl mx-auto">
      {}
      <motion.div 
        className="card-modern overflow-hidden bg-gradient-to-br from-white/5 to-indigo-500/5 backdrop-blur-sm mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="p-6">
          <div className="flex gap-4">
            {}
            <div className="hidden sm:flex flex-col items-center space-y-2">
              <VoteButtons
                postId={thread.id}
                initialScore={threadScore}
                initialVote={null}
                orientation="vertical"
              />
            </div>
            
            {}
            <div className="flex-1">
              {}
              <div className="flex flex-wrap items-center justify-between mb-4">
                <Link
                  href={`/categories/${thread.category.slug}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
                >
                  {thread.category.name}
                </Link>
                <span className="text-xs text-gray-500 flex items-center">
                  <FiClock className="mr-1 h-3 w-3" />
                  {thread.createdAt && !isNaN(new Date(thread.createdAt).getTime())
                    ? formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })
                    : 'Recently'
                  }
                </span>
              </div>
              
              {}
              <div className="flex items-center mb-4">
                <UserProfileMini
                  user={{
                    id: thread.user.id,
                    name: thread.user.name,
                    username: thread.user.username,
                    image: thread.user.image,
                    createdAt: thread.createdAt,
                    bio: thread.user.bio,
                    location: thread.user.location,
                    website: thread.user.website,
                    _count: thread.user._count
                  }}
                  size="md"
                  isAuthor={true}
                  showJoinDate={true}
                  withLocation={!!thread.user.location}
                />
              </div>
              
              {}
              <h1 className="text-2xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                {thread.title}
              </h1>
              
              {}
              <div className="prose prose-invert max-w-none mb-6">
                {thread.content.split('\n').map((paragraph, i) => (
                  paragraph.trim() ? <p key={i} className="text-gray-300 leading-relaxed">{paragraph}</p> : <br key={i} />
                ))}
              </div>
              
              {}
              <div className="mb-6">
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
              
              {}
              <div className="sm:hidden flex items-center justify-start mb-6">
                <VoteButtons
                  postId={thread.id}
                  initialScore={threadScore}
                  initialVote={null}
                  orientation="horizontal"
                />
              </div>
              
              {}
              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <div className="flex items-center space-x-4 text-sm">
                  <button
                    onClick={() => startReply(null)}
                    className="flex items-center text-gray-400 hover:text-indigo-400 transition-colors"
                  >
                    <FiCornerDownRight className="mr-1 h-4 w-4" />
                    <span className="font-medium">Reply</span>
                  </button>
                  
                  <BookmarkButton postId={thread.id} className="text-gray-400 hover:text-indigo-400" />
                  
                  <ShareButton url={`/threads/${thread.id}`} title={thread.title} />
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">
                    {thread._count.comments} {thread._count.comments === 1 ? 'Reply' : 'Replies'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {}
      <div className="mb-8">
        <form onSubmit={handleSubmitReply} className="space-y-4">
          <div className="card-modern p-4">
            <div className="flex">
              <div className="mr-3 flex-shrink-0">
                {session?.user?.image ? (
                  <img 
                    src={session.user.image} 
                    alt={session.user.name || 'User'} 
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                    <FiUser className="text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <textarea
                  ref={replyInputRef}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={replyingTo ? "Write a reply..." : "Join the discussion..."}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={submitting}
                />
                
                {showRichEditor && (
                  <div className="flex mt-2 space-x-2">
                    <button 
                      type="button"
                      className="p-2 text-gray-400 hover:text-indigo-400 transition-colors rounded-full hover:bg-gray-800/50"
                      title="Add image"
                    >
                      <FiImage size={18} />
                    </button>
                    <button 
                      type="button"
                      className="p-2 text-gray-400 hover:text-indigo-400 transition-colors rounded-full hover:bg-gray-800/50"
                      title="Add attachment"
                    >
                      <FiPaperclip size={18} />
                    </button>
                    <button 
                      type="button"
                      className="p-2 text-gray-400 hover:text-indigo-400 transition-colors rounded-full hover:bg-gray-800/50"
                      title="Add link"
                    >
                      <FiLink size={18} />
                    </button>
                  </div>
                )}
                
                <div className="flex justify-between mt-3">
                  {replyingTo && (
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="text-sm text-gray-400 hover:text-red-400 transition-colors"
                    >
                      Cancel Reply
                    </button>
                  )}
                  
                  <button
                    type="submit"
                    disabled={submitting || !replyContent.trim()}
                    className={`px-4 py-2 rounded-full bg-indigo-600 text-white flex items-center ${
                      submitting || !replyContent.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <FiLoader className="animate-spin mr-2" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <FiSend className="mr-2" />
                        Post Reply
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      {}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            Replies ({thread._count.comments})
          </h2>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Sort by:</span>
            <div className="flex border border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => handleSortChange('popular')}
                className={`px-3 py-1 text-sm ${
                  sortBy === 'popular' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <FiTrendingUp className="inline mr-1" />
                Popular
              </button>
              <button
                onClick={() => handleSortChange('recent')}
                className={`px-3 py-1 text-sm ${
                  sortBy === 'recent' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Latest
              </button>
              <button
                onClick={() => handleSortChange('chronological')}
                className={`px-3 py-1 text-sm ${
                  sortBy === 'chronological' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Oldest
              </button>
            </div>
          </div>
        </div>
        
        {loadingReplies ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
          </div>
        ) : replies.length === 0 ? (
          <div className="card-modern p-10 text-center">
            <p className="text-gray-400 mb-4">Be the first to reply to this thread!</p>
            <button
              onClick={() => startReply(null)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
            >
              Start the conversation
            </button>
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {replies.map((reply) => (
              <div key={reply.id} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="mb-3">
                      <UserProfileMini
                        user={{
                          id: reply.user.id,
                          name: reply.user.name,
                          username: reply.user.username,
                          image: reply.user.image,
                          createdAt: reply.createdAt,
                          _count: reply.user._count
                        }}
                        size="sm"
                        showJoinDate={false}
                      />
                    </div>
                    
                    <div className="prose prose-sm prose-invert max-w-none mb-3">
                      <p>{reply.content}</p>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-400 space-x-4">
                      <div className="flex items-center">
                        <span className="text-xs">
                          {reply.createdAt && !isNaN(new Date(reply.createdAt).getTime())
                            ? formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })
                            : 'Recently'
                          }
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-400 hover:text-indigo-400 transition-colors">
                          <FiThumbsUp className="w-4 h-4" />
                        </button>
                        <span>{reply.likeCount > 0 ? reply.likeCount : ''}</span>
                        <button className="text-gray-400 hover:text-indigo-400 transition-colors">
                          <FiThumbsDown className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <button
                        onClick={() => startReply(reply.id)}
                        className="flex items-center text-gray-400 hover:text-indigo-400 transition-colors"
                      >
                        <FiMessageSquare className="w-4 h-4 mr-1" />
                        Reply
                      </button>
                    </div>
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