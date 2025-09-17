"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { 
  FiMapPin, 
  FiMessageSquare, 
  FiUsers, 
  FiAward, 
  FiCalendar,
  FiExternalLink
} from "react-icons/fi";
import { handleAvatarError } from "@/lib/imageUtils";
import UserProfileCard from "./UserProfileCard";

export interface UserProfileMiniProps {
  user: {
    id?: string;
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
  };
  size?: 'sm' | 'md' | 'lg';
  withBio?: boolean;
  withStats?: boolean;
  withLocation?: boolean;
  withShadow?: boolean;
  className?: string;
  showJoinDate?: boolean;
  isAuthor?: boolean;
  disableCard?: boolean;
  cardPosition?: 'right' | 'left' | 'top' | 'bottom';
}

export default function UserProfileMini({
  user,
  size = 'md',
  withBio = false,
  withStats = false,
  withLocation = false,
  withShadow = false,
  className = '',
  showJoinDate = false,
  isAuthor = false,
  disableCard = false,
  cardPosition = 'right'
}: UserProfileMiniProps) {
  const avatarSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };
  
  const borderSizes = {
    sm: 'border',
    md: 'border-2',
    lg: 'border-2'
  };
  
  const nameSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };
  
  const usernameSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-sm'
  };

  const handleWebsiteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (user.website) {
      window.open(user.website, '_blank', 'noopener,noreferrer');
    }
  };

  const renderWebsiteLink = () => {
    if (!user.website) return null;

    const websiteDisplay = user.website.replace(/(^\w+:|^)\/\//, '').replace(/\/$/, '');

    if (disableCard) {
      return (
        <a 
          href={user.website} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="mt-1 inline-flex items-center text-xs text-indigo-500 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <FiExternalLink className="w-3 h-3 mr-1" />
          {websiteDisplay}
        </a>
      );
    }

    return (
      <button 
        className="mt-1 inline-flex items-center text-xs text-indigo-500 hover:underline"
        onClick={handleWebsiteClick}
      >
        <FiExternalLink className="w-3 h-3 mr-1" />
        {websiteDisplay}
      </button>
    );
  };

  const profileContent = (
    <div className={`flex ${withShadow ? 'shadow-sm hover:shadow-md transition-shadow' : ''} ${className}`}>
      <div className="group flex items-start">
        <div className={`relative ${avatarSizes[size]} rounded-full overflow-hidden ${borderSizes[size]} border-indigo-500/30 mr-3 flex-shrink-0 group-hover:border-indigo-500 transition-colors`}>
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || user.username}
              className="object-cover h-full w-full"
              onError={(e) => handleAvatarError(e, user.name || user.username)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
              <span className="text-white font-medium">
                {(user.name || user.username).charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          {isAuthor && (
            <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[10px] rounded-full px-1.5 py-0.5">
              Author
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex flex-col">
            <p className={`${nameSizes[size]} font-semibold text-gray-900 dark:text-white group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors`}>
              {user.name || user.username}
            </p>
            
            <p className={`${usernameSizes[size]} text-gray-500 dark:text-gray-400`}>
              @{user.username}
            </p>
            
            {withLocation && user.location && (
              <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                <FiMapPin className="w-3 h-3 mr-1" />
                <span>{user.location}</span>
              </div>
            )}
            
            {showJoinDate && user.createdAt && (
              <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                <FiCalendar className="w-3 h-3 mr-1" />
                <span>Joined {
                  (() => {
                    const date = typeof user.createdAt === 'string' 
                      ? new Date(user.createdAt) 
                      : user.createdAt;
                    return date && !isNaN(date.getTime())
                      ? formatDistanceToNow(date, { addSuffix: true })
                      : 'Recently';
                  })()
                }</span>
              </div>
            )}
            
            {withBio && user.bio && (
              <p className="mt-1.5 text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                {user.bio}
              </p>
            )}
            
            {withStats && user._count && (
              <div className="mt-2 flex space-x-3 text-xs text-gray-500 dark:text-gray-400">
                {user._count.posts !== undefined && (
                  <div className="flex items-center">
                    <FiMessageSquare className="w-3 h-3 mr-1" />
                    <span>{user._count.posts} posts</span>
                  </div>
                )}
                
                {user._count.followers !== undefined && (
                  <div className="flex items-center">
                    <FiUsers className="w-3 h-3 mr-1" />
                    <span>{user._count.followers} followers</span>
                  </div>
                )}
              </div>
            )}
            
            {renderWebsiteLink()}
          </div>
        </div>
      </div>
    </div>
  );

  if (!disableCard) {
    return (
      <UserProfileCard 
        user={{
          ...user,
          id: user.id || user.username // Ensure user has a required id property
        }}
        position={cardPosition}
      >
        <Link href={`/users/${user.username}`}>
          {profileContent}
        </Link>
      </UserProfileCard>
    );
  }

  return (
    <Link href={`/users/${user.username}`}>
      {profileContent}
    </Link>
  );
} 