"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FiUser, 
  FiCalendar, 
  FiMessageCircle, 
  FiThumbsUp, 
  FiStar,
  FiAward, 
  FiEdit3, 
  FiPlus, 
  FiUsers,
  FiActivity,
  FiGlobe,
  FiFileText,
  FiTrendingUp,
  FiSettings,
  FiLink,
  FiMapPin,
  FiHeart,
  FiBookmark,
  FiTag
} from 'react-icons/fi';
import toast from '@/lib/toast';
import AchievementBadge from '../AchievementBadge';
import AchievementShowcase from '../AchievementShowcase';
import { handleAvatarError } from "@/lib/imageUtils";

interface UserStats {
  postCount: number;
  commentCount: number;
  totalVotes: number;
  followersCount: number;
  followingCount: number;
  achievementsCount: number;
  joinedDate: string;
  lastActive: string;
}

interface UserActivity {
  id: string;
  type: 'post' | 'comment' | 'achievement' | 'like' | 'follow';
  title?: string;
  description?: string;
  createdAt: string;
  relatedUser?: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
  };
  relatedPost?: {
    id: string;
    title: string;
  };
}

interface UserProfile {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  isFollowing: boolean;
  isCurrentUser: boolean;
  stats: UserStats;
  tags: string[];
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: string;
  }>;
}

interface EnhancedUserProfileProps {
  username: string;
  initialData?: UserProfile;
}

export default function EnhancedUserProfile({ 
  username, 
  initialData 
}: EnhancedUserProfileProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isFollowing, setIsFollowing] = useState(initialData?.isFollowing || false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'posts' | 'comments' | 'activity' | 'achievements'>('posts');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userComments, setUserComments] = useState<any[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);
  
  useEffect(() => {
    if (!initialData) {
      fetchUserProfile();
    } else {
      setIsFollowing(initialData.isFollowing);
    }
  }, [username, initialData]);

  useEffect(() => {
    if (selectedTab === 'posts') {
      fetchUserPosts();
    } else if (selectedTab === 'comments') {
      fetchUserComments();
    } else if (selectedTab === 'activity') {
      fetchUserActivity();
    }
  }, [selectedTab]);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${username}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      
      const data = await response.json();
      setProfile(data);
      setIsFollowing(data.isFollowing);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    setLoadingTab(true);
    try {
      const response = await fetch(`/api/users/${username}/posts`);
      if (response.ok) {
        const data = await response.json();
        setUserPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setLoadingTab(false);
    }
  };

  const fetchUserComments = async () => {
    setLoadingTab(true);
    try {
      const response = await fetch(`/api/users/${username}/comments`);
      if (response.ok) {
        const data = await response.json();
        setUserComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching user comments:', error);
    } finally {
      setLoadingTab(false);
    }
  };

  const fetchUserActivity = async () => {
    setLoadingTab(true);
    try {
      const response = await fetch(`/api/users/${username}/activity`);
      if (response.ok) {
        const data = await response.json();
        setUserActivity(data.activity || []);
      }
    } catch (error) {
      console.error('Error fetching user activity:', error);
    } finally {
      setLoadingTab(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!session) {
      router.push('/sign-in');
      return;
    }
    
    setIsFollowLoading(true);
    
    setIsFollowing(!isFollowing);
    
    try {
      const response = await fetch(`/api/users/${username}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to update follow status');
      }
      
      const data = await response.json();
      
      toast.success(data.message || (isFollowing ? 'Unfollowed user' : 'Now following user'));
      
    } catch (error) {
      console.error('Error updating follow status:', error);
      
      setIsFollowing(!isFollowing);
      toast.error('Failed to update follow status');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading || !profile) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const {
    name,
    image,
    bio,
    website,
    location,
    isCurrentUser,
    stats,
    tags,
    achievements
  } = profile;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="relative">
        {}
        <div className="h-48 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-t-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-mesh opacity-10"></div>
          
          {}
          {isCurrentUser && (
            <div className="absolute top-4 right-4">
              <Link
                href="/settings/profile"
                className="flex items-center bg-black/30 backdrop-blur-md text-white px-4 py-2 rounded-lg border border-white/10 hover:bg-black/40 transition-colors"
              >
                <FiEdit3 className="mr-2" />
                Edit Profile
              </Link>
            </div>
          )}
        </div>
        
        {}
        <div className="relative px-6 pb-4">
          <div className="flex flex-col md:flex-row">
            {}
            <div className="relative -mt-16 mb-4 md:mb-0 z-10">
              <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-gray-900 bg-gradient-to-br from-indigo-600 to-purple-600">
                {image ? (
                  <img
                    src={image}
                    alt={name || username}
                    className="h-full w-full object-cover"
                    onError={(e) => handleAvatarError(e, name || username)}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <FiUser className="h-16 w-16 text-white" />
                  </div>
                )}
              </div>
              
              {}
              <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-gray-900"></div>
            </div>
            
            {}
            <div className="md:ml-6 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {name || username}
                  </h1>
                  <p className="text-indigo-400">@{username}</p>
                </div>
                
                {}
                {!isCurrentUser ? (
                  <button
                    onClick={handleFollowToggle}
                    disabled={isFollowLoading}
                    className={`mt-4 sm:mt-0 px-6 py-2 rounded-full flex items-center justify-center transition-colors ${
                      isFollowing
                        ? 'bg-gray-800 text-white hover:bg-gray-700'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <FiUsers className="mr-2" />
                        Following
                      </>
                    ) : (
                      <>
                        <FiPlus className="mr-2" />
                        Follow
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    href="/settings"
                    className="mt-4 sm:mt-0 px-6 py-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center transition-colors"
                  >
                    <FiSettings className="mr-2" />
                    Settings
                  </Link>
                )}
              </div>
              
              {}
              {bio && (
                <div className="mt-4">
                  <p className="text-white">{bio}</p>
                </div>
              )}
              
              {}
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-400">
                {location && (
                  <div className="flex items-center">
                    <FiMapPin className="mr-1" />
                    <span>{location}</span>
                  </div>
                )}
                
                {website && (
                  <a
                    href={website.startsWith('http') ? website : `https://${website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <FiLink className="mr-1" />
                    <span>{website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
                
                <div className="flex items-center">
                  <FiCalendar className="mr-1" />
                  <span>Joined {formatDate(stats.joinedDate)}</span>
                </div>
                
                <div className="flex items-center">
                  <FiActivity className="mr-1" />
                  <span>Last active {formatDate(stats.lastActive)}</span>
                </div>
              </div>
              
              {}
              {tags && tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100/10 text-indigo-400 border border-indigo-500/20"
                    >
                      <FiTag className="mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-4">
          {}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="card-modern p-4 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-indigo-400 mb-1">{stats.postCount}</div>
              <div className="text-sm text-gray-400 flex items-center">
                <FiFileText className="mr-1" />
                Posts
              </div>
            </div>
            
            <div className="card-modern p-4 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-indigo-400 mb-1">{stats.commentCount}</div>
              <div className="text-sm text-gray-400 flex items-center">
                <FiMessageCircle className="mr-1" />
                Comments
              </div>
            </div>
            
            <div className="card-modern p-4 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-indigo-400 mb-1">{stats.followersCount}</div>
              <div className="text-sm text-gray-400 flex items-center">
                <FiUsers className="mr-1" />
                Followers
              </div>
            </div>
            
            <div className="card-modern p-4 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-indigo-400 mb-1">{stats.totalVotes}</div>
              <div className="text-sm text-gray-400 flex items-center">
                <FiThumbsUp className="mr-1" />
                Total Votes
              </div>
            </div>
          </div>
          
          {}
          <div className="md:col-span-4">
            <div className="card-modern p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold flex items-center">
                  <FiAward className="mr-2 text-yellow-500" />
                  Achievements
                </h3>
                <span className="text-sm text-indigo-400">{stats.achievementsCount} total</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {achievements.slice(0, 5).map((achievement) => (
                  <div key={achievement.id} className="relative group">
                    <AchievementBadge 
                      name={achievement.name}
                      icon={achievement.icon}
                      size="sm"
                    />
                    
                    {}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity w-32 text-center z-10">
                      <div className="font-medium">{achievement.name}</div>
                      <div className="text-gray-300 text-xs mt-1">{achievement.description}</div>
                    </div>
                  </div>
                ))}
                
                {stats.achievementsCount > 5 && (
                  <Link 
                    href={`/users/${username}/achievements`}
                    className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors text-gray-400"
                  >
                    +{stats.achievementsCount - 5}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {}
        <div className="mt-8 border-b border-gray-800">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setSelectedTab('posts')}
              className={`px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                selectedTab === 'posts'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
              }`}
            >
              <FiFileText className="inline mr-1" />
              Posts
            </button>
            
            <button
              onClick={() => setSelectedTab('comments')}
              className={`px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                selectedTab === 'comments'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
              }`}
            >
              <FiMessageCircle className="inline mr-1" />
              Comments
            </button>
            
            <button
              onClick={() => setSelectedTab('activity')}
              className={`px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                selectedTab === 'activity'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
              }`}
            >
              <FiActivity className="inline mr-1" />
              Activity
            </button>
            
            <button
              onClick={() => setSelectedTab('achievements')}
              className={`px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                selectedTab === 'achievements'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
              }`}
            >
              <FiAward className="inline mr-1" />
              Achievements
            </button>
          </div>
        </div>
        
        {}
        <div className="mt-6">
          {loadingTab ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <>
              {selectedTab === 'posts' && (
                <div className="space-y-4">
                  {userPosts.length === 0 ? (
                    <div className="card-modern p-8 text-center">
                      <FiFileText className="mx-auto h-8 w-8 text-gray-500 mb-3" />
                      <p className="text-gray-400 mb-4">No posts yet</p>
                      {isCurrentUser && (
                        <Link
                          href="/new-post"
                          className="inline-flex items-center px-4 py-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 transition-colors"
                        >
                          <FiPlus className="mr-2" />
                          Create a post
                        </Link>
                      )}
                    </div>
                  ) : (
                    userPosts.map((post) => (
                      <div key={post.id} className="card-modern p-4">
                        <Link 
                          href={`/posts/${post.id}`}
                          className="block hover:opacity-80 transition-opacity"
                        >
                          <h3 className="text-lg font-semibold text-white mb-2">{post.title}</h3>
                          <p className="text-gray-400 text-sm line-clamp-2">{post.content}</p>
                          
                          <div className="mt-3 flex items-center text-xs text-gray-500">
                            <span className="flex items-center mr-4">
                              <FiCalendar className="mr-1" />
                              {formatDate(post.createdAt)}
                            </span>
                            <span className="flex items-center mr-4">
                              <FiMessageCircle className="mr-1" />
                              {post._count.comments} comments
                            </span>
                            <span className="flex items-center">
                              <FiThumbsUp className="mr-1" />
                              {post._count.votes} votes
                            </span>
                          </div>
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              )}
              
              {selectedTab === 'comments' && (
                <div className="space-y-4">
                  {userComments.length === 0 ? (
                    <div className="card-modern p-8 text-center">
                      <FiMessageCircle className="mx-auto h-8 w-8 text-gray-500 mb-3" />
                      <p className="text-gray-400">No comments yet</p>
                    </div>
                  ) : (
                    userComments.map((comment) => (
                      <div key={comment.id} className="card-modern p-4">
                        <div className="flex items-center text-xs text-gray-400 mb-2">
                          <span>On post:</span>
                          <Link 
                            href={`/posts/${comment.postId}`}
                            className="ml-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            {comment.post.title}
                          </Link>
                        </div>
                        
                        <p className="text-gray-300 text-sm">{comment.content}</p>
                        
                        <div className="mt-3 flex items-center text-xs text-gray-500">
                          <span className="flex items-center mr-4">
                            <FiCalendar className="mr-1" />
                            {formatDate(comment.createdAt)}
                          </span>
                          <span className="flex items-center">
                            <FiThumbsUp className="mr-1" />
                            {comment._count.votes} votes
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
              
              {selectedTab === 'activity' && (
                <div className="space-y-4">
                  {userActivity.length === 0 ? (
                    <div className="card-modern p-8 text-center">
                      <FiActivity className="mx-auto h-8 w-8 text-gray-500 mb-3" />
                      <p className="text-gray-400">No recent activity</p>
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-indigo-500/30 ml-3 pl-6 pb-2">
                      {userActivity.map((activity, index) => (
                        <div key={activity.id} className="mb-6 relative">
                          {}
                          <div className="absolute -left-[29px] mt-1.5 h-4 w-4 rounded-full bg-indigo-500 border-2 border-gray-900"></div>
                          
                          <div className="card-modern p-4">
                            <div className="flex items-start">
                              <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3">
                                {activity.type === 'post' && <FiFileText className="text-indigo-400" />}
                                {activity.type === 'comment' && <FiMessageCircle className="text-green-400" />}
                                {activity.type === 'achievement' && <FiAward className="text-yellow-400" />}
                                {activity.type === 'like' && <FiHeart className="text-red-400" />}
                                {activity.type === 'follow' && <FiUsers className="text-blue-400" />}
                              </div>
                              
                              <div className="flex-1">
                                <div className="text-sm text-gray-300">
                                  {activity.type === 'post' && (
                                    <>Created a new post: <Link href={`/posts/${activity.relatedPost?.id}`} className="text-indigo-400 hover:underline">{activity.relatedPost?.title}</Link></>
                                  )}
                                  
                                  {activity.type === 'comment' && (
                                    <>Commented on <Link href={`/posts/${activity.relatedPost?.id}`} className="text-indigo-400 hover:underline">{activity.relatedPost?.title}</Link></>
                                  )}
                                  
                                  {activity.type === 'achievement' && (
                                    <>Earned achievement: <span className="text-yellow-400">{activity.title}</span></>
                                  )}
                                  
                                  {activity.type === 'like' && (
                                    <>Liked a post: <Link href={`/posts/${activity.relatedPost?.id}`} className="text-indigo-400 hover:underline">{activity.relatedPost?.title}</Link></>
                                  )}
                                  
                                  {activity.type === 'follow' && (
                                    <>Started following <Link href={`/users/${activity.relatedUser?.username}`} className="text-indigo-400 hover:underline">{activity.relatedUser?.name || activity.relatedUser?.username}</Link></>
                                  )}
                                </div>
                                
                                {activity.description && (
                                  <p className="text-gray-400 text-xs mt-1">{activity.description}</p>
                                )}
                                
                                <div className="text-xs text-gray-500 mt-2">
                                  {formatDate(activity.createdAt)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {selectedTab === 'achievements' && (
                <div>
                  <AchievementShowcase achievements={achievements} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 