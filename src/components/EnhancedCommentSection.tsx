"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { 
  FiSend, 
  FiMessageCircle, 
  FiCornerDownRight, 
  FiLoader,
  FiHeart,
  FiFlag,
  FiMoreHorizontal,
  FiEdit,
  FiTrash2,
  FiShare2,
  FiAlertCircle,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiExternalLink,
  FiLink,
  FiThumbsDown,
  FiThumbsUp
} from "react-icons/fi";
import Image from 'next/image';
import ReactionsDisplay from '@/components/ReactionsDisplay';

type Comment = {
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
    children: number;
  };
  votes: Array<{
    id: string;
    userId: string;
    value: number;
  }>;
};

type EnhancedCommentSectionProps = {
  postId: string;
  parentId?: string;
  isNested?: boolean;
};

export default function EnhancedCommentSection({ 
  postId, 
  parentId, 
  isNested = false 
}: EnhancedCommentSectionProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nestedComments, setNestedComments] = useState<Record<string, boolean>>({});
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const commentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    },
    exit: { 
      opacity: 0,
      height: 0,
      transition: { duration: 0.3 }
    }
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  useEffect(() => {
    fetchComments();
    
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActionMenuOpen(null);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [postId, parentId]);
  
  useEffect(() => {
    if (editingComment && textareaRef.current) {
      textareaRef.current.focus();
      autoResizeTextarea();
    }
  }, [editingComment]);

  const getMockComments = (postId: string) => {
    const mockComments: Record<string, Comment[]> = {
      '1': [
        {
          id: 'c1-1',
          content: "I've had great results with a combination of daily meditation (20 minutes) and omega-3 supplements. There's solid research behind both for cognitive benefits.",
          createdAt: new Date('2023-10-15T14:30:00Z').toISOString(),
          user: {
            id: 'dralan',
            name: 'Dr. Alan Parker',
            username: 'dralan',
            image: 'https://randomuser.me/api/portraits/men/64.jpg'
          },
          _count: { votes: 15, children: 0 },
          votes: [
            { id: 'v1', userId: 'user1', value: 1 },
            { id: 'v2', userId: 'user2', value: 1 }
          ]
        },
        {
          id: 'c1-2',
          content: "Exercise has been the most effective for me. Particularly aerobic exercise 3-4 times a week has improved my focus and recall significantly.",
          createdAt: new Date('2023-10-15T15:12:00Z').toISOString(),
          user: {
            id: 'jsmith',
            name: 'Jennifer Smith',
            username: 'jsmith',
            image: 'https://randomuser.me/api/portraits/women/12.jpg'
          },
          _count: { votes: 8, children: 0 },
          votes: [
            { id: 'v3', userId: 'user3', value: 1 }
          ]
        },
        {
          id: 'c1-3',
          content: "Don't overlook sleep quality. Since improving my sleep hygiene, my memory and cognitive function have improved dramatically. I'd recommend the book 'Why We Sleep' by Matthew Walker.",
          createdAt: new Date('2023-10-15T16:47:00Z').toISOString(),
          user: {
            id: 'mwong',
            name: 'Michael Wong',
            username: 'mwong',
            image: 'https://randomuser.me/api/portraits/men/86.jpg'
          },
          _count: { votes: 22, children: 0 },
          votes: [
            { id: 'v4', userId: 'user4', value: 1 },
            { id: 'v5', userId: 'user5', value: 1 },
            { id: 'v6', userId: 'user6', value: 1 }
          ]
        }
      ],
      '2': [
        {
          id: 'c2-1',
          content: "I think AI-powered diagnostic tools will have the biggest impact. We're already seeing AI outperform radiologists in detecting certain conditions from medical imaging.",
          createdAt: new Date('2023-10-14T11:05:00Z').toISOString(),
          user: {
            id: 'drsarah',
            name: 'Dr. Sarah Johnson',
            username: 'drsarah',
            image: 'https://randomuser.me/api/portraits/women/45.jpg'
          },
          _count: { votes: 19, children: 0 },
          votes: [
            { id: 'v7', userId: 'user7', value: 1 },
            { id: 'v8', userId: 'user8', value: 1 }
          ]
        },
        {
          id: 'c2-2',
          content: "The ethical implications are huge and we're not addressing them fast enough. Issues of bias in training data could lead to disparities in care quality across different demographics.",
          createdAt: new Date('2023-10-14T12:38:00Z').toISOString(),
          user: {
            id: 'tomr',
            name: 'Professor Tom Richards',
            username: 'tomr',
            image: 'https://randomuser.me/api/portraits/men/28.jpg'
          },
          _count: { votes: 24, children: 0 },
          votes: [
            { id: 'v9', userId: 'user9', value: 1 },
            { id: 'v10', userId: 'user10', value: 1 },
            { id: 'v11', userId: 'user11', value: 1 }
          ]
        }
      ],
      '3': [
        {
          id: 'c3-1',
          content: "Think of qubits as coins spinning in the air - they're neither heads nor tails until observed, but rather in a probability state of both. This is superposition. Quantum computers leverage this to process multiple possibilities simultaneously.",
          createdAt: new Date('2023-10-12T09:30:00Z').toISOString(),
          user: {
            id: 'drq',
            name: 'Dr. Quantum',
            username: 'drq',
            image: 'https://randomuser.me/api/portraits/men/35.jpg'
          },
          _count: { votes: 35, children: 0 },
          votes: [
            { id: 'v12', userId: 'user12', value: 1 },
            { id: 'v13', userId: 'user13', value: 1 },
            { id: 'v14', userId: 'user14', value: 1 },
            { id: 'v15', userId: 'user15', value: 1 }
          ]
        }
      ],
      's1': [
        {
          id: 'cs1-1',
          content: "The recent advances in neuroplasticity research are fascinating! The brain's ability to rewire itself throughout life opens up incredible possibilities for treating neurological conditions.",
          createdAt: new Date('2023-10-12T12:15:00Z').toISOString(),
          user: {
            id: 'neuroresearcher',
            name: 'Dr. Lisa Neuron',
            username: 'neuroresearcher',
            image: 'https://randomuser.me/api/portraits/women/31.jpg'
          },
          _count: { votes: 18, children: 0 },
          votes: [
            { id: 'v16', userId: 'user16', value: 1 },
            { id: 'v17', userId: 'user17', value: 1 }
          ]
        }
      ],
      'h1': [
        {
          id: 'ch1-1',
          content: "I've had great results with a combination of daily meditation (20 minutes) and omega-3 supplements. There's solid research behind both for cognitive benefits.",
          createdAt: new Date('2023-10-15T14:30:00Z').toISOString(),
          user: {
            id: 'dralan',
            name: 'Dr. Alan Parker',
            username: 'dralan',
            image: 'https://randomuser.me/api/portraits/men/64.jpg'
          },
          _count: { votes: 15, children: 0 },
          votes: [
            { id: 'v18', userId: 'user18', value: 1 },
            { id: 'v19', userId: 'user19', value: 1 }
          ]
        }
      ],
      't1': [
        {
          id: 'ct1-1',
          content: "I think AI-powered diagnostic tools will have the biggest impact. We're already seeing AI outperform radiologists in detecting certain conditions from medical imaging.",
          createdAt: new Date('2023-10-14T11:05:00Z').toISOString(),
          user: {
            id: 'drsarah',
            name: 'Dr. Sarah Johnson',
            username: 'drsarah',
            image: 'https://randomuser.me/api/portraits/women/45.jpg'
          },
          _count: { votes: 19, children: 0 },
          votes: [
            { id: 'v20', userId: 'user20', value: 1 },
            { id: 'v21', userId: 'user21', value: 1 }
          ]
        }
      ],
      'h2': [
        {
          id: 'ch2-1',
          content: "Neuroplasticity is truly one of the most exciting areas of neuroscience research. The fact that our brains can literally rewire themselves throughout our entire lives gives me hope for treating so many conditions we previously thought were untreatable.",
          createdAt: new Date('2023-09-29T10:20:00Z').toISOString(),
          user: {
            id: 'drneuro',
            name: 'Dr. Neural Networks',
            username: 'drneuro',
            image: 'https://randomuser.me/api/portraits/men/55.jpg'
          },
          _count: { votes: 12, children: 0 },
          votes: [
            { id: 'v22', userId: 'user22', value: 1 },
            { id: 'v23', userId: 'user23', value: 1 }
          ]
        }
      ],
      'h3': [
        {
          id: 'ch3-1',
          content: "The method of loci (memory palace technique) has been game-changing for me. I can now memorize entire presentations without notes. The key is to make the mental images as vivid and unusual as possible.",
          createdAt: new Date('2023-09-11T14:45:00Z').toISOString(),
          user: {
            id: 'memorymaster',
            name: 'Memory Master',
            username: 'memorymaster',
            image: 'https://randomuser.me/api/portraits/men/67.jpg'
          },
          _count: { votes: 18, children: 0 },
          votes: [
            { id: 'v24', userId: 'user24', value: 1 },
            { id: 'v25', userId: 'user25', value: 1 },
            { id: 'v26', userId: 'user26', value: 1 }
          ]
        }
      ],
      'mj2': [
        {
          id: 'cmj2-1',
          content: "The accuracy improvements in medical imaging AI are remarkable. We're seeing diagnostic performance that matches or exceeds specialist radiologists in many areas. The key is ensuring these systems are trained on diverse datasets to avoid bias.",
          createdAt: new Date('2023-09-19T10:15:00Z').toISOString(),
          user: {
            id: 'drimaging',
            name: 'Dr. Medical Imaging',
            username: 'drimaging',
            image: 'https://randomuser.me/api/portraits/women/52.jpg'
          },
          _count: { votes: 14, children: 0 },
          votes: [
            { id: 'v27', userId: 'user27', value: 1 },
            { id: 'v28', userId: 'user28', value: 1 }
          ]
        }
      ],
      'mj3': [
        {
          id: 'cmj3-1',
          content: "Medical AI ethics is one of the most critical areas we need to address. We need transparency in how these systems make decisions, especially when they're used for diagnosis or treatment recommendations. Patients have a right to understand the reasoning behind AI-assisted medical decisions.",
          createdAt: new Date('2023-08-30T11:20:00Z').toISOString(),
          user: {
            id: 'ethicsexpert',
            name: 'Dr. Ethics Expert',
            username: 'ethicsexpert',
            image: 'https://randomuser.me/api/portraits/men/48.jpg'
          },
          _count: { votes: 21, children: 0 },
          votes: [
            { id: 'v29', userId: 'user29', value: 1 },
            { id: 'v30', userId: 'user30', value: 1 },
            { id: 'v31', userId: 'user31', value: 1 }
          ]
        }
      ],
      'ew2': [
        {
          id: 'cew2-1',
          content: "The best analogy I've found for quantum entanglement is a pair of magical coins. When you flip one and it lands heads, the other instantly becomes tails, no matter how far apart they are. This correlation is what makes quantum computing so powerful for certain types of problems.",
          createdAt: new Date('2023-09-21T09:30:00Z').toISOString(),
          user: {
            id: 'quantumteacher',
            name: 'Quantum Teacher',
            username: 'quantumteacher',
            image: 'https://randomuser.me/api/portraits/men/39.jpg'
          },
          _count: { votes: 16, children: 0 },
          votes: [
            { id: 'v32', userId: 'user32', value: 1 },
            { id: 'v33', userId: 'user33', value: 1 }
          ]
        }
      ],
      'ew3': [
        {
          id: 'cew3-1',
          content: "IBM's quantum advantage demonstrations in optimization problems are particularly exciting. While we're not at universal quantum computing yet, these specialized applications are already providing real value in logistics, finance, and materials research.",
          createdAt: new Date('2023-09-06T14:20:00Z').toISOString(),
          user: {
            id: 'quantumdev',
            name: 'Quantum Developer',
            username: 'quantumdev',
            image: 'https://randomuser.me/api/portraits/women/29.jpg'
          },
          _count: { votes: 13, children: 0 },
          votes: [
            { id: 'v34', userId: 'user34', value: 1 },
            { id: 'v35', userId: 'user35', value: 1 }
          ]
        }
      ]
    };
    
    return mockComments[postId] || [];
  };

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      // Check if this is a mock post ID first
      const mockPostIds = ['1', '2', '3', '4', '5', 's1', 's2', 'h1', 'h2', 'h3', 't1', 't2', 'mj2', 'mj3', 'ew2', 'ew3'];
      if (mockPostIds.includes(postId)) {
        // Use mock comments for mock posts
        const mockComments = getMockComments(postId);
        setComments(mockComments);
        setIsLoading(false);
        return;
      }
      
      // For real posts, fetch from API
      const endpoint = `/api/posts/${postId}/comments${parentId ? `?parentId=${parentId}` : ''}`;
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data = await response.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent, commentId?: string) => {
    e.preventDefault();
    
    if (!session) {
      router.push('/sign-in');
      return;
    }
    
    const content = newComment.trim();
    if (!content) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          parentId: commentId || parentId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to post comment');
      }
      
      setNewComment('');
      setReplyingTo(null);
      
      fetchComments();
      
      router.refresh();
    } catch (err) {
      console.error('Error posting comment:', err);
      setError('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update comment');
      }
      
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, content: editContent } 
            : comment
        )
      );
      
      setEditingComment(null);
      setEditContent("");
    } catch (err) {
      console.error('Error updating comment:', err);
      setError('Failed to update comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }
      
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      
      router.refresh();
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment. Please try again.');
    }
  };

  const toggleNestedComments = (commentId: string) => {
    setNestedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };
  
  const handleLikeComment = async (commentId: string) => {
    if (!session) {
      router.push('/sign-in');
      return;
    }
    
    try {
      const response = await fetch(`/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: 1,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to like comment');
      }
      
      setComments(prev => 
        prev.map(comment => {
          if (comment.id === commentId) {
            const existingVote = comment.votes.find(
              vote => session?.user?.id && vote.userId === session.user.id
            );
            
            if (existingVote) {
              if (existingVote.value > 0) {
                return {
                  ...comment,
                  votes: comment.votes.filter(vote => vote.id !== existingVote.id),
                  _count: {
                    ...comment._count,
                    votes: comment._count.votes - 1
                  }
                };
              }
              return {
                ...comment,
                votes: comment.votes.map(vote => 
                  vote.id === existingVote.id ? { ...vote, value: 1 } : vote
                )
              };
            }
            
            const newVote = {
              id: `temp-${Date.now()}`,
              userId: session?.user?.id || '',
              value: 1
            };
            
            return {
              ...comment,
              votes: [...comment.votes, newVote],
              _count: {
                ...comment._count,
                votes: comment._count.votes + 1
              }
            };
          }
          return comment;
        })
      );
    } catch (err) {
      console.error('Error liking comment:', err);
      setError('Failed to like comment. Please try again.');
    }
  };
  
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };
  
  const startReply = (commentId: string) => {
    setReplyingTo(commentId);
    setNewComment('');
    
    setActionMenuOpen(null);
  };
  
  const startEdit = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
    setActionMenuOpen(null);
  };

  const toggleReplies = (commentId: string) => {
    setOpenReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const handleCopyLink = (commentId: string) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/posts/${postId}#comment-${commentId}`;
      navigator.clipboard.writeText(url).then(() => {
        setCopySuccess(commentId);
        setTimeout(() => setCopySuccess(null), 2000);
      }).catch(err => {
        console.error('Error copying link:', err);
        setError('Failed to copy link');
      });
    }
  };

  if (isLoading && !isNested) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-8 h-8 rounded-full bg-primary/10 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="pl-10 space-y-2 animate-pulse">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${isNested ? 'mt-4 pl-6 ml-4 border-l-2 border-indigo-200/50 dark:border-indigo-800/50' : 'p-6'}`}>
      {!isNested && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold flex items-center text-gray-900 dark:text-white">
            <FiMessageCircle className="mr-2 text-indigo-600 dark:text-indigo-400" />
            Comments {comments.length > 0 && `(${comments.length})`}
          </h2>
          {comments.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Join the conversation and share your thoughts
            </p>
          )}
        </div>
      )}

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md flex items-center"
        >
          <FiFlag className="mr-2" />
          {error}
        </motion.div>
      )}

      {}
      {(!isNested || replyingTo === null) && (
        <form onSubmit={(e) => handleSubmitComment(e)} className="mb-8">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex-shrink-0 flex items-center justify-center overflow-hidden">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-10 h-10 object-cover"
                />
              ) : (
                <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                  {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "?"}
                </span>
              )}
            </div>
            
            <div className="flex-1">
              <div className="bg-white dark:bg-gray-800 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden transition-all hover:border-indigo-300 dark:hover:border-indigo-600/50 focus-within:border-indigo-500 dark:focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/20">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onInput={autoResizeTextarea}
                  ref={textareaRef}
                  placeholder={session ? "Write a comment..." : "Sign in to comment"}
                  className="w-full p-4 border-none resize-none focus:ring-0 bg-transparent text-gray-700 dark:text-gray-200"
                  rows={3}
                  disabled={!session || submitting}
                ></textarea>
                
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/80 px-4 py-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {!session ? (
                      <Link href="/sign-in" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                        Sign in
                      </Link>
                    ) : (
                      "Use @ to mention users"
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={!session || submitting || !newComment.trim()}
                    className="py-2 px-4 rounded-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {submitting ? (
                      <>
                        <FiLoader className="animate-spin mr-2" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <FiSend className="mr-2" />
                        Post
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {comments.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-full p-3 inline-block mb-4">
            <FiMessageCircle className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
          </div>
          <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
            {isNested ? 'No replies yet' : 'Start the conversation'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {isNested 
              ? 'Be the first to reply to this comment' 
              : 'No comments on this post yet. Share your thoughts and start a discussion!'}
          </p>
        </div>
      ) : (
        <motion.div 
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {comments.map((comment) => {
            const voteScore = comment.votes && Array.isArray(comment.votes)
              ? comment.votes.reduce((acc, vote) => acc + vote.value, 0)
              : 0;
            
            const userVote = session && comment.votes && Array.isArray(comment.votes)
              ? comment.votes.find(vote => vote.userId === session.user.id) 
              : null;
              
            const isAuthor = session?.user?.id === comment.user.id;
            
            return (
              <motion.div 
                key={comment.id} 
                id={`comment-${comment.id}`}
                className="relative group rounded-xl"
                variants={commentVariants}
                layout
              >
                {}
                <div className="transition-all duration-200 group-hover:bg-indigo-50/50 dark:group-hover:bg-indigo-900/10 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    {}
                    <Link 
                      href={`/users/${comment.user.username}`}
                      className="flex-shrink-0"
                    >
                      {comment.user.image ? (
                        <img 
                          src={comment.user.image} 
                          alt={comment.user.name || comment.user.username}
                          className="w-9 h-9 rounded-full object-cover border-2 border-transparent hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center border-2 border-transparent hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors">
                          <span className="text-white text-sm font-medium">
                            {(comment.user.name || comment.user.username).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </Link>
                    
                    {}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Link 
                          href={`/users/${comment.user.username}`}
                          className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          {comment.user.name || comment.user.username}
                        </Link>
                        
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                        
                        {isAuthor && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                            Author
                          </span>
                        )}
                      </div>
                      
                      {}
                      {editingComment === comment.id ? (
                        <div className="mt-2 mb-3">
                          <textarea
                            ref={textareaRef}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onInput={autoResizeTextarea}
                            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                            rows={3}
                            disabled={submitting}
                          ></textarea>
                          
                          <div className="flex items-center justify-end space-x-2 mt-2">
                            <button
                              type="button"
                              onClick={() => setEditingComment(null)}
                              className="py-1.5 px-3 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditComment(comment.id)}
                              disabled={submitting || !editContent.trim()}
                              className="py-1.5 px-3 rounded-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-sm disabled:opacity-50"
                            >
                              {submitting ? 'Saving...' : 'Save changes'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                          {comment.content}
                        </div>
                      )}
                      
                      {}
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        {}
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          className={`flex items-center gap-1.5 transition-colors ${
                            userVote && userVote.value > 0
                              ? 'text-red-500 dark:text-red-400'
                              : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                          }`}
                        >
                          <FiHeart className={`${userVote && userVote.value > 0 ? 'fill-red-500 dark:fill-red-400' : ''} h-4 w-4`} />
                          <span>{voteScore > 0 ? voteScore : ''}</span>
                        </button>
                        
                        {}
                        <button
                          onClick={() => startReply(comment.id)}
                          className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          <FiCornerDownRight className="h-4 w-4" />
                          <span>Reply</span>
                        </button>
                        
                        {}
                        {comment._count.children > 0 && (
                          <button
                            onClick={() => toggleReplies(comment.id)}
                            className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            {openReplies[comment.id] ? (
                              <>
                                <FiChevronUp className="h-4 w-4" />
                                <span>Hide replies</span>
                              </>
                            ) : (
                              <>
                                <FiChevronDown className="h-4 w-4" />
                                <span>View {comment._count.children} {comment._count.children === 1 ? 'reply' : 'replies'}</span>
                              </>
                            )}
                          </button>
                        )}
                        
                        {}
                        <button
                          onClick={() => handleCopyLink(comment.id)}
                          className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          <FiShare2 className="h-4 w-4" />
                          <span>{copySuccess === comment.id ? "Copied!" : "Share"}</span>
                        </button>
                        
                        {}
                        {isAuthor && (
                          <div className="relative ml-auto" ref={menuRef}>
                            <button
                              onClick={() => setActionMenuOpen(actionMenuOpen === comment.id ? null : comment.id)}
                              className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-1 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                              aria-label="More actions"
                            >
                              <FiMoreHorizontal className="h-4 w-4" />
                            </button>
                            
                            <AnimatePresence>
                              {actionMenuOpen === comment.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                  transition={{ duration: 0.2 }}
                                  className="absolute right-0 mt-1 z-10 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 overflow-hidden"
                                >
                                  <button
                                    onClick={() => startEdit(comment)}
                                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                  >
                                    <FiEdit className="mr-2 h-4 w-4" />
                                    Edit
                                  </button>
                                  
                                  <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  >
                                    <FiTrash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                      
                      {}
                      <div className="mt-2">
                        <ReactionsDisplay 
                          reactions={[
                            ...(comment.id.charCodeAt(0) % 2 === 0 
                              ? [{ type: 'heart', count: 3, users: ['User 1', 'User 2', 'User 3'] }] 
                              : []),
                            ...(comment.id.charCodeAt(0) % 3 === 0 
                              ? [{ type: 'laugh', count: 2, users: ['User 4', 'User 5'] }] 
                              : []),
                            ...(comment.id.charCodeAt(0) % 5 === 0 
                              ? [{ type: 'rocket', count: 1, users: ['User 6'] }] 
                              : []),
                            ...(comment.id.charCodeAt(0) % 7 === 0 
                              ? [{ type: 'lightbulb', count: 1, users: ['User 7'] }] 
                              : [])
                          ].filter(r => r.count > 0)}
                          onReact={(reactionType) => {
                            console.log(`Added ${reactionType} reaction to comment ${comment.id}`);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {}
                <AnimatePresence>
                  {replyingTo === comment.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 ml-12 overflow-hidden"
                    >
                      <form onSubmit={(e) => handleSubmitComment(e, comment.id)}>
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {session?.user?.image ? (
                              <img
                                src={session.user.image}
                                alt={session.user.name || "User"}
                                className="w-8 h-8 object-cover"
                              />
                            ) : (
                              <span className="text-indigo-600 dark:text-indigo-400 text-sm font-medium">
                                {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "?"}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder={`Reply to ${comment.user.name || comment.user.username}...`}
                              className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                              rows={2}
                              disabled={!session || submitting}
                            ></textarea>
                            
                            <div className="flex justify-end space-x-2 mt-2">
                              <button
                                type="button"
                                onClick={() => setReplyingTo(null)}
                                className="py-1.5 px-3 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={!session || submitting || !newComment.trim()}
                                className="py-1.5 px-3 rounded-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              >
                                {submitting ? (
                                  <>
                                    <FiLoader className="animate-spin mr-2" />
                                    Posting...
                                  </>
                                ) : (
                                  <>
                                    <FiSend className="mr-2" />
                                    Reply
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {}
                <AnimatePresence>
                  {nestedComments[comment.id] && comment._count.children > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <EnhancedCommentSection 
                        postId={postId} 
                        parentId={comment.id} 
                        isNested={true} 
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
} 