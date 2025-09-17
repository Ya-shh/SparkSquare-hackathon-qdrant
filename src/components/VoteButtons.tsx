"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FiThumbsUp, FiThumbsDown } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

type VoteButtonsProps = {
  postId?: string;
  commentId?: string;
  initialScore: number;
  initialVote: { 
    id: string;
    userId: string;
    value: number;
  } | null;
  orientation?: "vertical" | "horizontal"; // Added orientation prop for layout flexibility
};

export default function VoteButtons({ 
  postId, 
  commentId, 
  initialScore, 
  initialVote,
  orientation = "vertical" 
}: VoteButtonsProps) {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState(initialVote);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [isDownvoting, setIsDownvoting] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  
  const handleVote = async (value: number) => {
    if (!session) {
      router.push('/sign-in');
      return;
    }
    
    const originalScore = score;
    const originalVote = userVote;
    
    const shouldDelete = userVote?.value === value;
    
    if (value > 0) {
      setIsUpvoting(true);
    } else {
      setIsDownvoting(true);
    }
    
    try {
      if (shouldDelete) {
        setScore(prev => prev - value);
        setUserVote(null);
      } else if (userVote) {
        const scoreDiff = value - userVote.value;
        setScore(prev => prev + scoreDiff);
        setUserVote(prev => prev ? { ...prev, value } : null);
      } else {
        setScore(prev => prev + value);
        setUserVote({
          id: `temp-${Date.now()}`,
          userId: session.user.id,
          value
        });
      }
      
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          postId: postId || undefined, 
          commentId: commentId || undefined, 
          value 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to vote');
      }
      
      const responseData = await response.json();
      console.log('Vote successful:', responseData);
      
      router.refresh();
      
    } catch (error) {
      console.error('Error voting:', error);
      setScore(originalScore);
      setUserVote(originalVote);
    } finally {
      setIsUpvoting(false);
      setIsDownvoting(false);
    }
  };
  
  const getScoreColor = () => {
    if (score > 0) return "text-indigo-600 dark:text-indigo-400";
    if (score < 0) return "text-red-600 dark:text-red-400";
    return "text-gray-500 dark:text-gray-400";
  };
  
  const getUpvoteClasses = () => {
    const baseClasses = "rounded-full flex items-center justify-center transition-all duration-200";
    
    if (userVote && userVote.value > 0) {
      return `${baseClasses} bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400`;
    }
    
    return `${baseClasses} bg-gray-100 dark:bg-gray-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400`;
  };
  
  const getDownvoteClasses = () => {
    const baseClasses = "rounded-full flex items-center justify-center transition-all duration-200";
    
    if (userVote && userVote.value < 0) {
      return `${baseClasses} bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400`;
    }
    
    return `${baseClasses} bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400`;
  };

  return (
    <div className={`flex ${orientation === 'vertical' ? 'flex-col' : 'flex-row'} items-center`}>
      <button
        onClick={() => handleVote(1)}
        disabled={isUpvoting || isDownvoting}
        className={`${getUpvoteClasses()} ${orientation === 'vertical' ? 'w-10 h-10' : 'w-8 h-8'}`}
        aria-label="Upvote"
      >
        {isUpvoting ? (
          <div className="w-5 h-5 border-t-2 border-indigo-600 dark:border-indigo-400 rounded-full animate-spin"></div>
        ) : (
          <FiThumbsUp className={`${orientation === 'vertical' ? 'h-5 w-5' : 'h-4 w-4'} ${userVote?.value === 1 ? 'fill-indigo-600/30 dark:fill-indigo-400/30' : ''}`} />
        )}
      </button>
      
      <motion.div 
        className={`font-semibold ${getScoreColor()} ${orientation === 'vertical' ? 'my-1' : 'mx-2'} ${orientation === 'vertical' ? 'text-sm' : 'text-xs'}`}
        key={score}
        initial={{ scale: 0.8, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {score}
      </motion.div>
      
      <button
        onClick={() => handleVote(-1)}
        disabled={isUpvoting || isDownvoting}
        className={`${getDownvoteClasses()} ${orientation === 'vertical' ? 'w-10 h-10' : 'w-8 h-8'}`}
        aria-label="Downvote"
      >
        {isDownvoting ? (
          <div className="w-5 h-5 border-t-2 border-red-600 dark:border-red-400 rounded-full animate-spin"></div>
        ) : (
          <FiThumbsDown className={`${orientation === 'vertical' ? 'h-5 w-5' : 'h-4 w-4'} ${userVote?.value === -1 ? 'fill-red-600/30 dark:fill-red-400/30' : ''}`} />
        )}
      </button>
    </div>
  );
} 