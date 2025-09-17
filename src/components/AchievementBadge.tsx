"use client";

import { Achievement, getRarityColor } from '@/lib/achievements';
import { 
  FiAward, FiBookOpen, FiCalendar, FiCompass, FiEdit, 
  FiGlobe, FiMessageCircle, FiMessageSquare, FiStar, 
  FiThumbsUp, FiUsers
} from 'react-icons/fi';

const iconMap = {
  FiAward,
  FiBookOpen,
  FiCalendar,
  FiCompass,
  FiEdit,
  FiGlobe,
  FiMessageCircle,
  FiMessageSquare,
  FiStar,
  FiThumbsUp,
  FiUsers,
};

type AchievementBadgeProps = {
  achievement: Achievement;
  unlocked?: boolean;
  progress?: number;
  showDetails?: boolean;
  className?: string;
};

export default function AchievementBadge({
  achievement,
  unlocked = false,
  progress = 0,
  showDetails = false,
  className = '',
}: AchievementBadgeProps) {
  const { id, name, description, icon, rarity } = achievement;
  
  const IconComponent = iconMap[icon as keyof typeof iconMap] || FiAward;
  
  const rarityClasses = getRarityColor(rarity);
  
  return (
    <div className={`group relative ${className}`}>
      <div 
        className={`
          rounded-lg p-3 flex items-center justify-center 
          transition-all duration-300
          ${unlocked ? rarityClasses : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'}
          ${unlocked ? 'ring-2' : 'opacity-80'}
          ${unlocked ? `ring-${rarity === 'legendary' ? 'amber' : rarity === 'epic' ? 'purple' : rarity === 'rare' ? 'blue' : rarity === 'uncommon' ? 'green' : 'gray'}-300` : ''}
        `}
      >
        <IconComponent className={`h-6 w-6 ${!unlocked && 'opacity-50'}`} />
      </div>
      
      {}
      {!unlocked && progress > 0 && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 mt-1 rounded-full overflow-hidden">
          <div 
            className="bg-primary h-full rounded-full" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
      
      {}
      {showDetails && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-white dark:bg-gray-800 shadow-lg rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
          <div className="flex items-center gap-2 mb-1">
            <IconComponent className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">{name}</h3>
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
          
          {!unlocked && progress > 0 && (
            <div className="mt-2">
              <div className="flex justify-between mb-1 text-xs">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
            <span className={`uppercase font-medium ${rarityClasses} py-0.5 px-2 rounded-full text-[10px]`}>
              {rarity}
            </span>
            <span>{achievement.points} points</span>
          </div>
        </div>
      )}
    </div>
  );
} 