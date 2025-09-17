"use client";

import { useState } from 'react';
import { FiBookmark, FiMessageSquare, FiEdit, FiThumbsUp } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import useSWR from 'swr';

type Tab = 'posts' | 'comments' | 'bookmarks';

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  _count: {
    comments: number;
  };
  votes: { value: number }[];
}

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  post: {
    id: string;
    title: string;
  };
  votes: { value: number }[];
}

interface Bookmark {
  id: string;
  createdAt: Date;
  post: Post;
}

interface UserProfileTabsProps {
  username: string;
}

const fetcher = (url: string) => 
  fetch(url)
    .then(res => {
      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }
      return res.json();
    });

export default function UserProfileTabs({ username }: UserProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('posts');
  
  const { data, error, isLoading } = useSWR(
    `/api/users/${username}/${activeTab}`,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 10000, // Refresh every 10 seconds
    }
  );
  
  const calculateScore = (votes: { value: number }[] | undefined) => {
    if (!votes || !Array.isArray(votes)) return 0;
    return votes.reduce((acc, vote) => acc + vote.value, 0);
  };
  
  const posts = activeTab === 'posts' && data?.posts ? data.posts : [];
  const comments = activeTab === 'comments' && data?.comments ? data.comments : [];
  const bookmarks = activeTab === 'bookmarks' && data?.bookmarks ? data.bookmarks : [];
  
  return (
    <div>
      {}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center px-4 py-3 text-sm font-medium ${
            activeTab === 'posts'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <FiEdit className="mr-2" />
          Posts
        </button>
        
        <button
          onClick={() => setActiveTab('comments')}
          className={`flex items-center px-4 py-3 text-sm font-medium ${
            activeTab === 'comments'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <FiMessageSquare className="mr-2" />
          Comments
        </button>
        
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex items-center px-4 py-3 text-sm font-medium ${
            activeTab === 'bookmarks'
              ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <FiBookmark className="mr-2" />
          Bookmarks
        </button>
      </div>
      
      {}
      <div className="p-4">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          </div>
        ) : error ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-amber-500 dark:text-amber-400">
              {error.message || "Failed to load data"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {}
            {activeTab === 'posts' && (
              <div className="space-y-4">
                {posts.length > 0 ? (
                  posts.map((post: Post) => (
                    <div
                      key={post.id}
                      className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                    >
                      <Link href={`/posts/${post.id}`}>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">
                          {post.title}
                        </h3>
                      </Link>
                      
                      <p className="mt-2 text-gray-600 dark:text-gray-300 line-clamp-2">
                        {post.content}
                      </p>
                      
                      <div className="flex flex-wrap items-center mt-3 text-sm">
                        {post.category && (
                          <Link
                            href={`/categories/${post.category.slug}`}
                            className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full px-2.5 py-0.5 mr-3 text-xs font-medium hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                          >
                            {post.category.name}
                          </Link>
                        )}
                        
                        <span className="text-gray-500 dark:text-gray-400 mr-3">
                          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </span>
                        
                        <div className="flex items-center text-gray-500 dark:text-gray-400 mr-3">
                          <FiMessageSquare className="mr-1" />
                          <span>{post._count?.comments || 0}</span>
                        </div>
                        
                        <div className="flex items-center text-gray-500 dark:text-gray-400">
                          <FiThumbsUp className={`mr-1 ${calculateScore(post.votes) > 0 ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                          <span>{calculateScore(post.votes)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No posts found</p>
                  </div>
                )}
              </div>
            )}
            
            {}
            {activeTab === 'comments' && (
              <div className="space-y-4">
                {comments.length > 0 ? (
                  comments.map((comment: Comment) => (
                    <div
                      key={comment.id}
                      className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                    >
                      <Link href={`/posts/${comment.post.id}#comment-${comment.id}`}>
                        <p className="text-gray-600 dark:text-gray-300">
                          {comment.content}
                        </p>
                      </Link>
                      
                      <div className="flex flex-wrap items-center mt-3 text-sm">
                        <Link 
                          href={`/posts/${comment.post.id}`}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline mr-3"
                        >
                          on: {comment.post.title}
                        </Link>
                        
                        <span className="text-gray-500 dark:text-gray-400 mr-3">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                        
                        <div className="flex items-center text-gray-500 dark:text-gray-400">
                          <FiThumbsUp className={`mr-1 ${calculateScore(comment.votes) > 0 ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                          <span>{calculateScore(comment.votes)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No comments found</p>
                  </div>
                )}
              </div>
            )}
            
            {}
            {activeTab === 'bookmarks' && (
              <div className="space-y-4">
                {bookmarks.length > 0 ? (
                  bookmarks.map((bookmark: Bookmark) => (
                    <div
                      key={bookmark.id}
                      className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                    >
                      <Link href={`/posts/${bookmark.post.id}`}>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200">
                          {bookmark.post.title}
                        </h3>
                      </Link>
                      
                      <p className="mt-2 text-gray-600 dark:text-gray-300 line-clamp-2">
                        {bookmark.post.content}
                      </p>
                      
                      <div className="flex flex-wrap items-center mt-3 text-sm">
                        {bookmark.post.category && (
                          <Link
                            href={`/categories/${bookmark.post.category.slug}`}
                            className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full px-2.5 py-0.5 mr-3 text-xs font-medium hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                          >
                            {bookmark.post.category.name}
                          </Link>
                        )}
                        
                        <span className="text-gray-500 dark:text-gray-400 mr-3">
                          <FiBookmark className="inline mr-1" />
                          Bookmarked {formatDistanceToNow(new Date(bookmark.createdAt), { addSuffix: true })}
                        </span>
                        
                        <div className="flex items-center text-gray-500 dark:text-gray-400 mr-3">
                          <FiMessageSquare className="mr-1" />
                          <span>{bookmark.post._count?.comments || 0}</span>
                        </div>
                        
                        <div className="flex items-center text-gray-500 dark:text-gray-400">
                          <FiThumbsUp className={`mr-1 ${calculateScore(bookmark.post.votes) > 0 ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                          <span>{calculateScore(bookmark.post.votes)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No bookmarks found</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 