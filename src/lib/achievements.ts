

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  condition: AchievementCondition;
}

export type AchievementCondition = 
  | { type: 'posts'; threshold: number }
  | { type: 'comments'; threshold: number }
  | { type: 'votes_received'; threshold: number }
  | { type: 'login_streak'; threshold: number };

export const achievements: Achievement[] = [
  {
    id: 'first_post',
    name: 'First Post',
    description: 'Created your first post',
    icon: '📝',
    points: 10,
    condition: { type: 'posts', threshold: 1 }
  },
  {
    id: 'regular_poster',
    name: 'Regular Poster',
    description: 'Created 10 posts',
    icon: '✍️',
    points: 50,
    condition: { type: 'posts', threshold: 10 }
  },
  {
    id: 'prolific_author',
    name: 'Prolific Author',
    description: 'Created 50 posts',
    icon: '📚',
    points: 200,
    condition: { type: 'posts', threshold: 50 }
  },
  
  {
    id: 'first_comment',
    name: 'First Comment',
    description: 'Left your first comment',
    icon: '💬',
    points: 5,
    condition: { type: 'comments', threshold: 1 }
  },
  {
    id: 'active_commenter',
    name: 'Active Commenter',
    description: 'Left 25 comments',
    icon: '🗣️',
    points: 25,
    condition: { type: 'comments', threshold: 25 }
  },
  {
    id: 'discussion_master',
    name: 'Discussion Master',
    description: 'Left 100 comments',
    icon: '👑',
    points: 100,
    condition: { type: 'comments', threshold: 100 }
  },
  
  {
    id: 'appreciated',
    name: 'Appreciated',
    description: 'Received 10 upvotes on your posts or comments',
    icon: '👍',
    points: 20,
    condition: { type: 'votes_received', threshold: 10 }
  },
  {
    id: 'popular',
    name: 'Popular',
    description: 'Received 50 upvotes on your posts or comments',
    icon: '⭐',
    points: 100,
    condition: { type: 'votes_received', threshold: 50 }
  },
  {
    id: 'influential',
    name: 'Influential',
    description: 'Received 250 upvotes on your posts or comments',
    icon: '🌟',
    points: 250,
    condition: { type: 'votes_received', threshold: 250 }
  },
  
  {
    id: 'curious',
    name: 'Curious',
    description: 'Logged in for 3 days in a row',
    icon: '🔍',
    points: 15,
    condition: { type: 'login_streak', threshold: 3 }
  },
  {
    id: 'committed',
    name: 'Committed',
    description: 'Logged in for 7 days in a row',
    icon: '📅',
    points: 30,
    condition: { type: 'login_streak', threshold: 7 }
  },
  {
    id: 'dedicated',
    name: 'Dedicated',
    description: 'Logged in for 30 days in a row',
    icon: '🏆',
    points: 150,
    condition: { type: 'login_streak', threshold: 30 }
  }
];


export function getRarityColor(rarity: Achievement['rarity']): string {
  switch (rarity) {
    case 'common':
      return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    case 'uncommon':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'rare':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'epic':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'legendary':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    default:
      return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
}


export function calculateAchievementProgress(
  achievement: Achievement,
  stats: { 
    postCount: number;
    commentCount: number;
    upvotesReceived: number;
    categoriesPostedIn: number;
    loginStreak: number;
  }
): number {
  const { type, threshold } = achievement.condition;
  let current = 0;

  switch (type) {
    case 'posts':
      current = stats.postCount;
      break;
    case 'comments':
      current = stats.commentCount;
      break;
    case 'upvotes':
      current = stats.upvotesReceived;
      break;
    case 'categories':
      current = stats.categoriesPostedIn;
      break;
    case 'login_streak':
      current = stats.loginStreak;
      break;
  }

  return Math.min(100, Math.round((current / threshold) * 100));
} 