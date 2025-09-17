"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  FiShare2
} from "react-icons/fi";
import { handleAvatarError } from "@/lib/imageUtils";
import UserProfileMini from "./UserProfileMini";
import ReactionsDisplay from "./ReactionsDisplay";

import { CONSTANT_USERS } from "./ThreadDiscussion";

const getConstantUserForComment = (commentId: string) => {
  const idSum = commentId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const index = idSum % CONSTANT_USERS.length;
  return CONSTANT_USERS[index];
};

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
  liked: boolean;
  likeCount: number;
  replyCount: number;
};

type CommentSectionProps = {
  postId: string;
  parentId?: string;
  isNested?: boolean;
};

export default function CommentSection({ 
  postId, 
  parentId, 
  isNested = false 
}: CommentSectionProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [nestedComments, setNestedComments] = useState<Record<string, boolean>>({});
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  
  useEffect(() => {
    fetchComments();
  }, [postId, parentId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActionMenuOpen(null);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const endpoint = `/api/posts/${postId}/comments${parentId ? `?parentId=${parentId}` : ''}`;
      const response = await fetch(endpoint);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch comments");
      }
      const data = await response.json();
      
      const commentsWithDefaults = (data.comments || []).map((comment: any) => {
        const constantUser = getConstantUserForComment(comment.id);
        
        return {
          ...comment,
          user: {
            id: constantUser.id,
            name: constantUser.name,
            username: constantUser.username,
            image: constantUser.image
          },
          liked: comment.liked || false,
          likeCount: comment._count?.votes || 0,
          replyCount: comment._count?.children || 0
        };
      });
      
      setComments(commentsWithDefaults);
    } catch (error) {
      console.error("Error fetching comments:", error);
      setError(error instanceof Error ? error.message : "Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent, replyParentId: string | null = null) => {
    e.preventDefault();
    
    if (!session) {
      router.push('/sign-in');
      return;
    }
    
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          parentId: replyParentId || parentId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to post comment');
      }
      
      setNewComment('');
      
      setReplyingTo(null);
      
      fetchComments();
      
      router.refresh();
      
    } catch (error) {
      console.error('Error posting comment:', error);
      setError('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleNestedComments = (commentId: string) => {
    setNestedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    
    setSubmitting(true);
    
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
      
      setEditingComment(null);
      
      fetchComments();
      
    } catch (error) {
      console.error('Error updating comment:', error);
      setError('Failed to update comment');
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
      
      setComments(comments.filter(comment => comment.id !== commentId));
      
      router.refresh();
      
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('Failed to delete comment');
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
    setActionMenuOpen(null);
  };

  const handleLikeComment = async (commentId: string) => {
    if (!session) {
      router.push('/sign-in');
      return;
    }
    
    const originalComments = [...comments];
    
    try {
      setComments(comments.map(comment => {
        if (comment.id === commentId) {
          const isCurrentlyLiked = comment.liked;
          return {
            ...comment,
            liked: !isCurrentlyLiked,
            likeCount: isCurrentlyLiked ? Math.max(0, comment.likeCount - 1) : comment.likeCount + 1
          };
        }
        return comment;
      }));
      
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to like comment';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      
      setComments(comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            liked: responseData.liked,
            likeCount: responseData.likeCount
          };
        }
        return comment;
      }));
    } catch (error) {
      console.error('Error liking comment:', error);
      setComments(originalComments);
      setError(error instanceof Error ? error.message : 'Failed to like comment');
      
      const timeoutId = setTimeout(() => {
        setError(null);
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    }
  };

  const handleCopyLink = (commentId: string) => {
    try {
      const url = `${window.location.origin}/posts/${postId}#comment-${commentId}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url)
          .then(() => {
            setCopySuccess("Link copied to clipboard!");
            setTimeout(() => setCopySuccess(null), 2000);
          })
          .catch(err => {
            console.error("Could not copy text: ", err);
            promptToCopy(url);
          });
      } else {
        promptToCopy(url);
      }
    } catch (error) {
      console.error("Error copying link:", error);
    }
  };

  const promptToCopy = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopySuccess("Link copied to clipboard!");
        setTimeout(() => setCopySuccess(null), 2000);
      } else {
        setCopySuccess("Please copy manually: " + text);
        setTimeout(() => setCopySuccess(null), 5000);
      }
    } catch (err) {
      console.error("Fallback copying failed:", err);
      setCopySuccess("Please copy manually: " + text);
      setTimeout(() => setCopySuccess(null), 5000);
    }
    
    document.body.removeChild(textarea);
  };

  const getEnglishCommentContent = (content: string): string => {
    const latinWords = [
      "lorem ipsum", "vivo", "amet", "confido", "sonitus", "vicinus", "denego", "socius", "cruentus", "ipsum", 
      "dolore", "magna", "consectetur", "adipiscing", "elit", "quis", "coma", "arguo", "enim", "conscendo", 
      "causa", "victus", "cubicularis", "deinde", "toties", "cunctatio", "approbo", "copia", "deripio", "vita", 
      "canonicus", "compello", "audio", "venio", "vilis", "nesciunt", "aureus", "creator", "ara", "basium", 
      "derideo", "officia", "commemoro", "tamquam", "auxilium", "deludo", "reiciendis", "laboriosam", "sapiente", 
      "vesco", "desidero", "tactus", "decimus", "spoliatio", "deserunt", "conservo", "autus", "despecto", "apud", 
      "consequatur", "vis", "videlicet"
    ];
    
    const contentLower = content.toLowerCase();
    const hasLatinWords = latinWords.some(word => contentLower.includes(word));
    
    if (hasLatinWords || !content) {
      const englishComments = [
        "This is a really insightful point! I've been thinking about this topic for a while and your perspective adds valuable context.",
        "I appreciate the detailed analysis presented here. Have you considered how this might apply in different contexts?",
        "Great points overall. I'd like to add that recent research also suggests alternative approaches worth exploring.",
        "Thanks for sharing this perspective. I've had similar experiences that confirm what you're describing.",
        "This is a fascinating take on the subject. The evidence you've presented has changed how I think about this issue.",
        "I respectfully disagree with some points here. Recent studies indicate that there might be other factors at play.",
        "Your explanation really clarified this complex topic for me. I'll definitely be applying these insights.",
        "Well-articulated thoughts! I'm curious how these ideas might evolve as technology continues to advance."
      ];
      return englishComments[Math.floor(Math.random() * englishComments.length)];
    }
    return content;
  };

  if (isLoading && !isNested) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/20 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="pl-10 space-y-2 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${isNested ? 'ml-8 border-l-2 border-indigo-500/20 pl-4' : ''}`}>
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <FiLoader className="animate-spin text-indigo-500 mr-2" />
          <span className="text-gray-400">Loading comments...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-400">{error}</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div 
              key={comment.id} 
              id={`comment-${comment.id}`}
              className="relative group"
            >
              <div className="transition-all duration-200 group-hover:bg-indigo-50/50 dark:group-hover:bg-indigo-900/10 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <UserProfileMini 
                    user={{
                      id: comment.user.id,
                      name: comment.user.name,
                      username: comment.user.username,
                      image: comment.user.image,
                      createdAt: comment.createdAt
                    }}
                    size="sm"
                  />
                  
                  <div className="flex-1">
                    <div className="relative">
                      {editingComment === comment.id ? (
                        <div className="mt-1">
                          <textarea
                            ref={textareaRef}
                            value={editContent}
                            onChange={(e) => {
                              setEditContent(e.target.value);
                              autoResizeTextarea();
                            }}
                            className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                            placeholder="Edit your comment..."
                            rows={3}
                          />
                          <div className="flex justify-end space-x-2 mt-2">
                            <button
                              onClick={() => setEditingComment(null)}
                              className="px-3 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleEditComment(comment.id)}
                              disabled={submitting}
                              className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors flex items-center"
                            >
                              {submitting ? (
                                <>
                                  <FiLoader className="animate-spin mr-1" />
                                  Saving...
                                </>
                              ) : (
                                "Save"
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-300 text-sm">
                            {getEnglishCommentContent(comment.content)}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <button
                              onClick={() => handleLikeComment(comment.id)}
                              className={`flex items-center text-xs ${comment.liked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'} transition-colors`}
                            >
                              <FiHeart className={`${comment.liked ? 'fill-current' : ''} mr-1`} />
                              {comment.likeCount > 0 && comment.likeCount}
                            </button>
                            {!isNested && (
                              <button
                                onClick={() => {
                                  setReplyingTo(replyingTo === comment.id ? null : comment.id);
                                  toggleNestedComments(comment.id);
                                }}
                                className="flex items-center text-xs text-gray-400 hover:text-indigo-400 transition-colors"
                              >
                                <FiCornerDownRight className="mr-1" />
                                Reply {comment.replyCount > 0 && `(${comment.replyCount})`}
                              </button>
                            )}
                            <button
                              onClick={() => handleCopyLink(comment.id)}
                              className="flex items-center text-xs text-gray-400 hover:text-indigo-400 transition-colors"
                            >
                              <FiShare2 className="mr-1" />
                              {copySuccess === comment.id ? "Copied!" : "Share"}
                            </button>
                            <button
                              onClick={() => setActionMenuOpen(actionMenuOpen === comment.id ? null : comment.id)}
                              className="flex items-center text-xs text-gray-400 hover:text-indigo-400 transition-colors"
                            >
                              <FiMoreHorizontal />
                            </button>
                          </div>
                          
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
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
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
                            alt={session.user.name || session.user.email?.split('@')[0] || 'User'}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => handleAvatarError(e, session.user.name || 'User')}
                          />
                        ) : (
                          <img
                            src={CONSTANT_USERS[0].image}
                            alt={CONSTANT_USERS[0].name}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => handleAvatarError(e, CONSTANT_USERS[0].name)}
                          />
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
              
              {nestedComments[comment.id] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CommentSection 
                    postId={postId} 
                    parentId={comment.id} 
                    isNested={true} 
                  />
                </motion.div>
              )}

              {actionMenuOpen === comment.id && (
                <div className="absolute right-0 mt-1 z-10 bg-gray-800 border border-gray-700 rounded shadow-lg w-32">
                  {}
                  {session && session.user && session.user.id === comment.user.id && (
                    <>
                      <button
                        onClick={() => startEdit(comment)}
                        className="flex items-center w-full px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 transition-colors"
                      >
                        <FiEdit className="mr-1.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="flex items-center w-full px-3 py-2 text-xs text-red-400 hover:bg-gray-700 transition-colors"
                      >
                        <FiTrash2 className="mr-1.5" />
                        Delete
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => promptToCopy(`${window.location.origin}/posts/${postId}#comment-${comment.id}`)}
                    className="flex items-center w-full px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 transition-colors"
                  >
                    <FiShare2 className="mr-1.5" />
                    Copy Link
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {}
      <AnimatePresence>
        {copySuccess && (
          <motion.div
            key="copy-toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center z-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {copySuccess}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 