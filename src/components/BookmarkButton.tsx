"use client";

import { useState, useEffect } from 'react';
import { FiBookmark } from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import toast from '@/lib/toast';

interface BookmarkButtonProps {
  postId: string;
  className?: string;
}

export default function BookmarkButton({ postId, className = '' }: BookmarkButtonProps) {
  const { data: session } = useSession();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session) {
      checkBookmarkStatus();
    }
  }, [session, postId]);

  const checkBookmarkStatus = async () => {
    try {
      const response = await fetch(`/api/posts/bookmarks?postId=${postId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setIsBookmarked(data.isBookmarked);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };

  const toggleBookmark = async () => {
    if (!session) {
      toast.error('You must be signed in to bookmark posts');
      return;
    }

    setIsLoading(true);

    try {
      const method = isBookmarked ? 'DELETE' : 'POST';
      const response = await fetch('/api/posts/bookmarks', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setIsBookmarked(!isBookmarked);
        toast.success(isBookmarked ? 'Bookmark removed' : 'Post bookmarked');
      } else {
        toast.error(data.error || 'Failed to update bookmark');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmark');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={`p-2 rounded-full hover:bg-muted transition-colors ${className} ${
        isBookmarked ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : ''
      }`}
      onClick={toggleBookmark}
      disabled={isLoading}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark post'}
      title={isBookmarked ? 'Remove bookmark' : 'Bookmark post'}
    >
      <FiBookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
    </button>
  );
} 