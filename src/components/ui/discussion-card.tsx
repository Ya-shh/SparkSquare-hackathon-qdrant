"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { 
  FiMessageCircle, 
  FiThumbsUp, 
  FiClock, 
  FiBookmark,
  FiStar,
  FiTrendingUp,
  FiEye,
  FiMoreHorizontal,
  FiArrowUp
} from "react-icons/fi";
import UserProfileMini from "@/components/UserProfileMini";
import ReactionsDisplay from "@/components/ReactionsDisplay";

type DiscussionCardProps = {
  post: any;
  index?: number;
  isFeatured?: boolean;
  isPinned?: boolean;
  isHot?: boolean;
  useAnimation?: boolean;
  layout?: 'horizontal' | 'vertical' | 'compact';
  showCategory?: boolean;
};

export default function DiscussionCard({
  post,
  index = 0,
  isFeatured = false,
  isPinned = false,
  isHot = false,
  useAnimation = true,
  layout = 'horizontal',
  showCategory = true
}: DiscussionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isVotedUp, setIsVotedUp] = useState(false);
  
  const formattedTimestamp = post.createdAt && !isNaN(new Date(post.createdAt).getTime())
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
    : 'Recently';
  
  const voteScore = post.votes && Array.isArray(post.votes) 
    ? post.votes.reduce((acc: number, vote: { value: number }) => acc + vote.value, 0) 
    : (post._count?.votes || 0);
  
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    },
    hover: { 
      y: -5,
      transition: { 
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    tap: { scale: 0.98 }
  };
  
  const getBackgroundGradient = () => {
    if (isFeatured) {
      return "bg-gradient-to-r from-primary/5 to-secondary/5 hover:from-primary/10 hover:to-secondary/10";
    }
    if (isPinned) {
      return "bg-gradient-to-r from-amber-500/5 to-yellow-500/5 hover:from-amber-500/10 hover:to-yellow-500/10";
    }
    if (isHot) {
      return "bg-gradient-to-r from-red-500/5 to-orange-500/5 hover:from-red-500/10 hover:to-orange-500/10";
    }
    return "bg-card hover:bg-card/90";
  };
  
  const StatusBadge = ({ type }: { type: 'featured' | 'pinned' | 'hot' }) => {
    const badges = {
      featured: {
        icon: <FiStar className="h-3 w-3" />,
        text: 'Featured',
        color: 'bg-primary/10 text-primary border-primary/20'
      },
      pinned: {
        icon: <FiBookmark className="h-3 w-3" />,
        text: 'Pinned',
        color: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      },
      hot: {
        icon: <FiTrendingUp className="h-3 w-3" />,
        text: 'Trending',
        color: 'bg-red-500/10 text-red-600 border-red-500/20'
      }
    };
    
    const badge = badges[type];
    
    return (
      <div className={`flex items-center text-xs px-2 py-1 rounded-full ${badge.color} border`}>
        {badge.icon}
        <span className="ml-1">{badge.text}</span>
      </div>
    );
  };
  
  const getPostReactions = (postId: string) => {
    const idSum = postId?.split('').reduce((sum: number, char: string) => sum + char.charCodeAt(0), 0) || 0;
    
    return [
      { type: 'heart', count: (idSum % 8) + 1, users: Array.from({length: (idSum % 8) + 1}, (_, i) => `User ${i+1}`) },
      { type: 'thumbs-up', count: (idSum % 5) + 1, users: Array.from({length: (idSum % 5) + 1}, (_, i) => `User ${i+9}`) },
      ...(idSum % 3 === 0 ? [{ type: 'rocket', count: (idSum % 3) + 1, users: Array.from({length: (idSum % 3) + 1}, (_, i) => `User ${i+14}`) }] : []),
      ...(idSum % 2 === 0 ? [{ type: 'lightbulb', count: (idSum % 2) + 1, users: Array.from({length: (idSum % 2) + 1}, (_, i) => `User ${i+17}`) }] : [])
    ];
  };
  
  const renderHorizontalLayout = () => (
    <div className="flex gap-4">
      {}
      <div className="hidden sm:flex flex-col items-center justify-start min-w-[40px] mr-2">
        <button 
          className={`p-1 rounded-full ${isVotedUp ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
          onClick={(e) => e.preventDefault()}
        >
          <FiArrowUp className="h-5 w-5" />
        </button>
        <span className={`text-sm font-semibold my-1 ${voteScore > 0 ? 'text-primary' : ''}`}>
          {voteScore}
        </span>
      </div>
      
      {}
      <div className="flex-1">
        {}
        <div className="flex items-center mb-2 gap-2 text-muted-foreground">
          {showCategory && (
            <Link
              href={`/categories/${post.category.slug}`}
              className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              {post.category.name}
            </Link>
          )}
          
          <span className="text-xs">
            {formattedTimestamp}
          </span>
          
          {isPinned && <StatusBadge type="pinned" />}
          {isFeatured && <StatusBadge type="featured" />}
          {isHot && <StatusBadge type="hot" />}
          
          {post.views !== undefined && (
            <div className="text-xs text-muted-foreground flex items-center">
              <FiEye className="mr-1 h-3 w-3" />
              {post.views || 0} views
            </div>
          )}
        </div>
        
        <Link href={`/posts/${post.id}`} className="block group">
          <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
        </Link>
        
        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
          {post.content}
        </p>
        
        {}
        <div className="mb-3">
          <ReactionsDisplay 
            reactions={getPostReactions(post.id)}
            onReact={(reactionType) => {
              console.log(`Added ${reactionType} reaction to post ${post.id}`);
            }}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <UserProfileMini
            user={{
              id: post.user.id,
              name: post.user.name,
              username: post.user.username,
              image: post.user.image,
              createdAt: post.createdAt || post.updatedAt
            }}
            size="sm"
          />
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center sm:hidden text-muted-foreground">
              <FiThumbsUp className="mr-1 h-4 w-4" />
              <span className="text-sm">{voteScore}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <FiMessageCircle className="mr-1 h-4 w-4" />
              <span className="text-sm">{post._count.comments}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderVerticalLayout = () => (
    <div className="space-y-3">
      {}
      <div className="flex flex-wrap items-center gap-2">
        {isPinned && <StatusBadge type="pinned" />}
        {isFeatured && <StatusBadge type="featured" />}
        {isHot && <StatusBadge type="hot" />}
        
        {showCategory && (
          <Link 
            href={`/categories/${post.category.slug}`}
            className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            {post.category.name}
          </Link>
        )}
      </div>
      
      {}
      <Link href={`/posts/${post.id}`} className="block group">
        <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
          {post.title}
        </h3>
      </Link>
      
      <p className="text-muted-foreground line-clamp-3 mb-2">
        {post.content}
      </p>
      
      {}
      <div className="mb-2">
        <ReactionsDisplay 
          reactions={getPostReactions(post.id)}
          onReact={(reactionType) => {
            console.log(`Added ${reactionType} reaction to post ${post.id}`);
          }}
        />
      </div>
      
      {}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center space-x-2">
          <UserProfileMini
            user={{
              id: post.user.id,
              name: post.user.name,
              username: post.user.username,
              image: post.user.image,
              createdAt: post.createdAt || post.updatedAt
            }}
            size="sm"
          />
          
          <div className="text-xs text-muted-foreground ml-2">
            {formattedTimestamp}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-muted-foreground">
            <FiThumbsUp className="mr-1 h-4 w-4" />
            <span className="text-sm">{voteScore}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <FiMessageCircle className="mr-1 h-4 w-4" />
            <span className="text-sm">{post._count.comments}</span>
          </div>
          {post.views !== undefined && (
            <div className="flex items-center text-muted-foreground">
              <FiEye className="mr-1 h-4 w-4" />
              <span className="text-sm">{post.views || 0}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  const renderCompactLayout = () => (
    <div className="flex items-center gap-3">
      {}
      <div className={`flex items-center justify-center h-8 w-8 rounded-full flex-shrink-0 ${
        voteScore > 0 
          ? 'bg-indigo-100/30 border border-indigo-200/30 text-indigo-600' 
          : 'bg-muted/30 border border-border text-muted-foreground'
      }`}>
        <span className="text-xs font-semibold">{voteScore}</span>
      </div>
      
      {}
      <div className="flex-1 min-w-0">
        <Link href={`/posts/${post.id}`} className="block group">
          <h4 className="font-medium truncate group-hover:text-primary transition-colors">
            {post.title}
          </h4>
        </Link>
        
        <div className="flex items-center text-xs text-muted-foreground mt-0.5">
          <span className="truncate">
            by {post.user.name || post.user.username}
          </span>
          <span className="mx-1">•</span>
          <FiClock className="mr-1 h-3 w-3" />
          <span>{formattedTimestamp}</span>
        </div>
        
        {}
        <div className="mt-1.5 flex flex-wrap gap-1">
          {getPostReactions(post.id).map((reaction, index) => (
            <div 
              key={`${reaction.type}-${index}`}
              className="flex items-center px-1 py-0.5 rounded-full bg-primary/5 border border-primary/10"
              title={`${reaction.users.join(', ')} reacted with ${reaction.type}`}
            >
              <span className="text-xs mr-0.5">{reaction.type === 'heart' ? '❤️' : reaction.type === 'thumbs-up' ? '👍' : reaction.type === 'rocket' ? '🚀' : '💡'}</span>
              <span className="text-xs text-muted-foreground">{reaction.count}</span>
            </div>
          ))}
        </div>
      </div>
      
      {}
      <div className="flex items-center text-muted-foreground">
        <FiMessageCircle className="mr-1 h-4 w-4" />
        <span className="text-sm">{post._count.comments}</span>
      </div>
    </div>
  );
  
  return (
    <motion.div
      className={`border border-border rounded-xl p-4 transition-all ${getBackgroundGradient()}`}
      variants={useAnimation ? cardVariants : undefined}
      initial={useAnimation ? "hidden" : "visible"}
      animate={useAnimation ? "visible" : "visible"}
      whileHover={useAnimation ? "hover" : undefined}
      whileTap={useAnimation ? "tap" : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {layout === 'horizontal' && renderHorizontalLayout()}
      {layout === 'vertical' && renderVerticalLayout()}
      {layout === 'compact' && renderCompactLayout()}
      
      {}
      {isHovered && (
        <div className="absolute inset-0 -z-10 overflow-hidden rounded-xl opacity-30 pointer-events-none">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-secondary/20 rounded-full filter blur-3xl"></div>
        </div>
      )}
    </motion.div>
  );
} 