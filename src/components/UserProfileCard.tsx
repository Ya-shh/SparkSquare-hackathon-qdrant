"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useState, useRef, useEffect } from "react";
import { 
  FiMapPin, 
  FiMessageSquare, 
  FiUsers, 
  FiCalendar,
  FiExternalLink,
  FiArrowUpRight,
  FiAward,
  FiBookmark
} from "react-icons/fi";
import { handleAvatarError } from "@/lib/imageUtils";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export interface UserProfileCardProps {
  user: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
    createdAt: string | Date;
    bio?: string;
    location?: string;
    website?: string;
    _count?: {
      posts?: number;
      comments?: number;
      followers?: number;
      following?: number;
    };
    role?: string;
    badges?: string[];
  };
  children: React.ReactNode;
  position?: 'right' | 'left' | 'top' | 'bottom';
  delay?: number;
  className?: string;
}

export default function UserProfileCard({
  user,
  children,
  position = 'right',
  delay = 400,
  className = ''
}: UserProfileCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const getRandomGradient = () => {
    const gradients = [
      'from-indigo-500 to-purple-600',
      'from-blue-500 to-teal-400',
      'from-green-400 to-cyan-500',
      'from-pink-500 to-rose-400',
      'from-amber-500 to-orange-600',
      'from-violet-600 to-indigo-600'
    ];
    
    const index = user.username.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  const patternId = `grid-${(user.id || user.username || 'user').replace(/[^a-zA-Z0-9]/g, '')}`;

  const getCardPosition = () => {
    switch (position) {
      case 'right': return { left: 'calc(100% + 12px)', top: '0' };
      case 'left': return { right: 'calc(100% + 12px)', top: '0' };
      case 'top': return { bottom: 'calc(100% + 12px)', left: '50%', transform: 'translateX(-50%)' };
      case 'bottom': return { top: 'calc(100% + 12px)', left: '50%', transform: 'translateX(-50%)' };
      default: return { left: 'calc(100% + 12px)', top: '0' };
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setIsVisible(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (timer) clearTimeout(timer);
    
    const newTimer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    
    setTimer(newTimer);
  };
  
  const handleMouseLeave = () => {
    setIsHovering(false);
    if (timer) clearTimeout(timer);
    
    const newTimer = setTimeout(() => {
      if (!isHovering) setIsVisible(false);
    }, 300);
    
    setTimer(newTimer);
  };
  
  const handleCardMouseEnter = () => {
    setIsHovering(true);
    if (timer) clearTimeout(timer);
  };
  
  const handleCardMouseLeave = () => {
    setIsHovering(false);
    if (timer) clearTimeout(timer);
    
    const newTimer = setTimeout(() => {
      if (!isHovering) setIsVisible(false);
    }, 300);
    
    setTimer(newTimer);
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={getCardPosition()}
            className="absolute z-50 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            onMouseEnter={handleCardMouseEnter}
            onMouseLeave={handleCardMouseLeave}
          >
            {}
            <div className={`h-24 bg-gradient-to-r ${getRandomGradient()} relative overflow-hidden`}>
              <div className="absolute inset-0 opacity-20">
                <svg
                  viewBox="0 0 100 100"
                  className="absolute inset-0 h-full w-full"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <pattern 
                      id={patternId} 
                      width="10" 
                      height="10" 
                      patternUnits="userSpaceOnUse"
                    >
                      <path 
                        d="M 10 0 L 0 0 0 10" 
                        fill="none" 
                        stroke="white" 
                        strokeWidth="0.5" 
                      />
                    </pattern>
                  </defs>
                  <rect width="100" height="100" fill={`url(#${patternId})`} />
                </svg>
              </div>
              
              {user.role && (
                <div className="absolute top-2 right-2 bg-black/30 text-white text-xs px-2 py-1 rounded-full">
                  {user.role}
                </div>
              )}
            </div>
            
            {}
            <div className="px-5 pb-5 -mt-12">
              {}
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-md">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || user.username}
                      className="w-full h-full object-cover"
                      onError={(e) => handleAvatarError(e, user.name || user.username)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                      <span className="text-white text-lg font-medium">
                        {(user.name || user.username).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                
                {}
                {user.badges && user.badges.length > 0 && (
                  <div className="absolute -bottom-1 -right-1 flex space-x-1">
                    {user.badges.slice(0, 3).map((badge, index) => (
                      <div key={index} className="bg-indigo-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                        <FiAward size={12} />
                      </div>
                    ))}
                    {user.badges.length > 3 && (
                      <div className="bg-gray-700 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                        +{user.badges.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {user.name || user.username}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    @{user.username}
                  </p>
                </div>
                
                {}
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs py-1 px-3 transition-colors">
                  Follow
                </button>
              </div>
              
              {}
              {user.bio && (
                <div className="mt-3 py-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                    {user.bio}
                  </p>
                </div>
              )}
              
              {}
              {(user.location || user.website || user.createdAt) && (
                <div className="py-3 space-y-2 border-b border-gray-100 dark:border-gray-700">
                  {user.location && (
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <FiMapPin className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
                      <span className="truncate">{user.location}</span>
                    </div>
                  )}
                  
                  {user.website && (
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-indigo-500 hover:underline"
                    >
                      <FiExternalLink className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        {user.website.replace(/(^\w+:|^)\/\//, '').replace(/\/$/, '')}
                      </span>
                    </a>
                  )}
                  
                  {user.createdAt && (
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <FiCalendar className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
                      <span>Joined {
                        typeof user.createdAt === 'string'
                          ? format(new Date(user.createdAt), 'MMMM yyyy')
                          : format(user.createdAt, 'MMMM yyyy')
                      }</span>
                    </div>
                  )}
                </div>
              )}
              
              {}
              {user._count && (
                <div className="grid grid-cols-4 gap-2 py-3">
                  {user._count.posts !== undefined && (
                    <div className="text-center p-2">
                      <p className="text-md font-semibold text-gray-900 dark:text-white">
                        {user._count.posts}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Posts</p>
                    </div>
                  )}
                  
                  {user._count.comments !== undefined && (
                    <div className="text-center p-2">
                      <p className="text-md font-semibold text-gray-900 dark:text-white">
                        {user._count.comments}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Comments</p>
                    </div>
                  )}
                  
                  {user._count.followers !== undefined && (
                    <div className="text-center p-2">
                      <p className="text-md font-semibold text-gray-900 dark:text-white">
                        {user._count.followers}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Followers</p>
                    </div>
                  )}
                  
                  {user._count.following !== undefined && (
                    <div className="text-center p-2">
                      <p className="text-md font-semibold text-gray-900 dark:text-white">
                        {user._count.following}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Following</p>
                    </div>
                  )}
                </div>
              )}
              
              {}
              <div className="flex items-center space-x-2 mt-3">
                <Link 
                  href={`/users/${user.username}`}
                  className="flex-1 flex items-center justify-center py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  View Profile
                  <FiArrowUpRight className="ml-1.5" />
                </Link>
                
                <button className="flex items-center justify-center p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                  <FiBookmark className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 