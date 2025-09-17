"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { Achievement } from '@/lib/achievements';

type UserAchievement = {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: Date;
  achievement: Achievement;
};

interface AchievementShowcaseProps {
  userId: string;
  className?: string;
}

const fetcher = (url: string) => 
  fetch(url)
    .then(res => {
      if (!res.ok) {
        if (res.status === 404) {
          return { achievements: [] };
        }
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }
      return res.json();
    });

export default function AchievementShowcase({ userId, className = '' }: AchievementShowcaseProps) {
  const { data: session } = useSession();
  
  const { data, error, isLoading } = useSWR(
    userId ? `/api/users/${userId}/achievements` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Refresh every 30 seconds
      fallbackData: { achievements: [] }, // Default empty data
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        if (error.message.includes('404')) return;
        
        if (retryCount >= 3) return;
        
        setTimeout(() => revalidate({ retryCount }), 5000);
      },
    }
  );
  
  const achievements = data?.achievements || [];
  
  if (isLoading) {
    return (
      <div className={`achievement-showcase ${className}`}>
        <h3 className="text-lg font-semibold mb-3">Achievements</h3>
        <div className="flex justify-center my-8">
          <div className="animate-pulse w-full">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-md mb-3"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-md mb-3"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error && !error.message.includes('404')) {
    return (
      <div className={`achievement-showcase ${className}`}>
        <h3 className="text-lg font-semibold mb-3">Achievements</h3>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-amber-500 dark:text-amber-400">
            {error.message || "Failed to load achievements"}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }
  
  if (achievements.length === 0) {
    return (
      <div className={`achievement-showcase ${className}`}>
        <h3 className="text-lg font-semibold mb-3">Achievements</h3>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {session?.user?.email && userId === (session.user as any).id 
              ? "Complete actions like posting, commenting, and receiving upvotes to unlock achievements!"
              : "This user hasn't unlocked any achievements yet."}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`achievement-showcase ${className}`}>
      <h3 className="text-lg font-semibold mb-3">Achievements</h3>
      <div className="space-y-3">
        {achievements.map((userAchievement: UserAchievement) => (
          <div 
            key={userAchievement.id} 
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="achievement-icon text-2xl">
                {userAchievement.achievement.icon}
              </div>
              <div className="flex-grow">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {userAchievement.achievement.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {userAchievement.achievement.description}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                  +{userAchievement.achievement.points}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(userAchievement.unlockedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {}
      <div className="mt-4 text-right">
        <span className="text-sm font-medium">
          Total achievement points: 
          <span className="ml-1 text-indigo-600 dark:text-indigo-400">
            {achievements.reduce((sum, item: UserAchievement) => sum + item.achievement.points, 0)}
          </span>
        </span>
      </div>
    </div>
  );
} 