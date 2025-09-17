"use client";

import React from 'react';
import Link from 'next/link';
import { FiMessageCircle, FiUser, FiHeart } from 'react-icons/fi';
import { formatDistance } from 'date-fns';
import EmptyState from '@/components/ui/EmptyState';

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
    role: string;
  };
  _count: { comments: number; votes: number };
  viewCount: number;
  createdAt: string;
}

interface ThreadListProps {
  threads: Thread[];
}

export default function ThreadList({ threads }: ThreadListProps) {
  if (!threads || threads.length === 0) {
    return (
      <EmptyState
        title="No threads found"
        description="Get started by creating a new thread"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {threads.map((thread, index) => (
        <Link 
          href={`/threads/${thread.id}`} 
          key={thread.id} 
          className="block card-cosmic transition-all"
          style={{
            animationDelay: `${index * 0.1}s`,
            transitionDelay: `${index * 0.05}s`
          }}
        >
          <div className="p-4 sm:p-6 relative">
            {}
            <div className="particle particle-1"></div>
            <div className="particle particle-2"></div>
            <div className="particle particle-3"></div>
            
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0 bg-indigo-900/50 flex items-center justify-center">
                {thread.user?.image ? (
                  <img 
                    src={thread.user.image} 
                    alt={thread.user.name} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FiUser className="h-5 w-5 text-indigo-200" />
                )}
              </div>
              
              <div className="flex-1 space-y-1">
                <h3 className="text-lg font-semibold cosmic-text">{thread.title}</h3>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span className="font-medium">{thread.user?.name}</span>
                  <span className="mx-2">•</span>
                  <span>
                    {thread.createdAt && !isNaN(new Date(thread.createdAt).getTime()) 
                      ? formatDistance(new Date(thread.createdAt), new Date(), { addSuffix: true })
                      : 'Recently'
                    }
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {thread.content}
            </div>
            
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-1">
                <FiMessageCircle className="h-4 w-4" />
                <span className="text-xs">{thread._count?.comments || 0}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <FiHeart className="h-4 w-4" />
                <span className="text-xs">{thread._count?.votes || 0}</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 