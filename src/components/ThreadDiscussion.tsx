"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { 
  FiMessageCircle, 
  FiUser, 
  FiThumbsUp, 
  FiShare2, 
  FiCornerDownRight, 
  FiClock,
  FiUsers,
  FiTrendingUp
} from "react-icons/fi";
import CommentSection from "./CommentSection";
import { handleAvatarError } from "@/lib/imageUtils";
import UserProfileMini from "./UserProfileMini";
import ReactionsDisplay from "./ReactionsDisplay";

export const CONSTANT_USERS = [
  {
    id: 'user-1',
    name: 'Alex Morgan',
    username: 'alexmorgan',
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
    bio: 'AI researcher and technology enthusiast. Exploring the intersection of machine learning and practical applications.',
    location: 'San Francisco, CA',
    website: 'https://alexmorgan.tech',
    createdAt: new Date('2022-08-15').toISOString(),
    _count: {
      posts: 42,
      comments: 156,
      followers: 230,
      following: 87
    }
  },
  {
    id: 'user-2',
    name: 'Sophia Chen',
    username: 'sophiachen',
    image: 'https://randomuser.me/api/portraits/women/44.jpg',
    bio: 'Neuroscientist studying cognitive enhancement and brain-computer interfaces. Passionate about making science accessible.',
    location: 'Boston, MA',
    website: 'https://sophiachen.science',
    createdAt: new Date('2022-10-07').toISOString(),
    _count: {
      posts: 37,
      comments: 129,
      followers: 189,
      following: 73
    }
  },
  {
    id: 'user-3',
    name: 'Marcus Williams',
    username: 'marcuswilliams',
    image: 'https://randomuser.me/api/portraits/men/64.jpg',
    bio: 'Digital philosopher and educator. Examining how technology shapes our understanding of reality and human connection.',
    location: 'Austin, TX',
    website: 'https://marcuswilliams.edu',
    createdAt: new Date('2022-11-22').toISOString(),
    _count: {
      posts: 51,
      comments: 183,
      followers: 267,
      following: 102
    }
  },
  {
    id: 'sarahc',
    name: 'Sarah Chen',
    username: 'sarahc',
    image: 'https://randomuser.me/api/portraits/women/23.jpg',
    bio: 'Neuroscientist studying cognitive enhancement and brain-computer interfaces. Passionate about making science accessible.',
    location: 'Boston, MA',
    website: 'https://sarahchen.science',
    createdAt: new Date('2022-10-07').toISOString(),
    _count: {
      posts: 37,
      comments: 129,
      followers: 189,
      following: 73
    }
  },
  {
    id: 'wellness',
    name: 'Dr. Wellness',
    username: 'wellness',
    image: 'https://randomuser.me/api/portraits/women/41.jpg',
    bio: 'Licensed clinical psychologist specializing in evidence-based mental health practices. Helping people achieve optimal psychological well-being.',
    location: 'Portland, OR',
    website: 'https://drwellness.health',
    createdAt: new Date('2022-09-12').toISOString(),
    _count: {
      posts: 42,
      comments: 198,
      followers: 312,
      following: 89
    }
  },
  {
    id: 'mjohnson',
    name: 'Marcus Johnson',
    username: 'mjohnson',
    image: 'https://randomuser.me/api/portraits/men/42.jpg',
    bio: 'AI researcher and healthcare technology consultant. Exploring the intersection of artificial intelligence and medical practice.',
    location: 'Seattle, WA',
    website: 'https://marcusjohnson.ai',
    createdAt: new Date('2022-11-22').toISOString(),
    _count: {
      posts: 51,
      comments: 183,
      followers: 267,
      following: 102
    }
  },
  {
    id: 'ewong',
    name: 'Eliza Wong',
    username: 'ewong',
    image: 'https://randomuser.me/api/portraits/women/56.jpg',
    bio: 'Quantum physicist and science communicator. Making complex scientific concepts accessible to everyone through clear explanations.',
    location: 'Cambridge, MA',
    website: 'https://elizawong.physics',
    createdAt: new Date('2022-08-30').toISOString(),
    _count: {
      posts: 33,
      comments: 147,
      followers: 201,
      following: 95
    }
  }
];

type ThreadDiscussionProps = {
  post: any;
  showComments?: boolean;
  isPreview?: boolean;
};

const getEnglishContent = (content: string): string => {
  const latinWords = [
    "lorem ipsum", "vivo", "amet", "confido", "sonitus", "vicinus", "denego", "socius", "cruentus", "ipsum", 
    "dolore", "magna", "consectetur", "adipiscing", "elit", "quis", "coma", "arguo", "enim", "conscendo", 
    "causa", "victus", "cubicularis", "deinde", "toties", "cunctatio", "approbo", "copia", "deripio", "vita", 
    "canonicus", "compello", "audio", "venio", "vilis", "nesciunt", "aureus", "creator", "ara", "basium", 
    "derideo", "officia", "commemoro", "tamquam", "auxilium", "deludo", "reiciendis", "laboriosam", "sapiente", 
    "vesco", "desidero", "tactus", "decimus", "spoliatio", "deserunt", "conservo", "autus", "despecto", "apud", 
    "consequatur", "vis", "videlicet"
  ];
  
  const contentLower = content.toLowerCase();
  const hasLatinWords = latinWords.some(word => contentLower.includes(word));
  
  if (hasLatinWords || !content) {
    const englishDescriptions = [
      "This thread explores innovative approaches to modern technology and their impact on society. With a focus on practical applications and real-world examples, the discussion aims to provide valuable insights for both beginners and experts in the field.",
      "In this discussion, we're analyzing recent scientific breakthroughs and their potential implications. The evidence presented suggests significant advances that could reshape our understanding of fundamental principles.",
      "An in-depth analysis of current market trends and their impact on small businesses. This thread examines strategic approaches to navigating economic challenges while maintaining sustainable growth.",
      "This health-focused thread covers recent medical research and wellness practices. The discussion includes evidence-based approaches to improving physical and mental wellbeing in today's fast-paced world.",
      "A celebration of cultural expression across various art forms. This thread explores the intersection of traditional and contemporary artistic movements and their reflection of societal values.",
      "This educational resource thread compiles valuable learning materials and pedagogical approaches. The discussion emphasizes accessible, effective methods for diverse learning environments.",
      "An exploration of gaming culture, mechanics, and industry developments. This thread discusses both technical aspects and social implications of modern gaming experiences.",
      "This discussion analyzes current political events and policy implications. The thread maintains a balanced perspective while examining various viewpoints on complex issues."
    ];
    return englishDescriptions[Math.floor(Math.random() * englishDescriptions.length)];
  }
  return content;
};

const getEnglishTitle = (title: string): string => {
  const latinWords = [
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "vivo", "confido", 
    "sonitus", "denego", "socius", "enim", "conscendo", "causa", "victus", "cubicularis", "deinde", 
    "toties", "cunctatio", "approbo", "copia", "deripio", "vita", "canonicus", "compello", "audio", 
    "venio", "vilis", "nesciunt", "aureus", "creator", "ara", "basium", "derideo", "officia", "commemoro", 
    "tamquam", "auxilium", "deludo", "reiciendis", "laboriosam", "sapiente", "vesco", "desidero", "tactus", 
    "decimus", "spoliatio", "deserunt", "conservo", "autus", "despecto", "apud", "consequatur", "vis", "videlicet"
  ];
  
  const titleLower = title.toLowerCase();
  const hasLatinWords = latinWords.some(word => titleLower.includes(word));
  
  if (hasLatinWords || !title) {
    const englishTitles = [
      "The Future of AI in Everyday Applications",
      "Recent Breakthroughs in Quantum Computing",
      "Sustainable Business Practices for the Modern Economy",
      "Evidence-Based Approaches to Mental Wellness",
      "The Evolution of Digital Art in Contemporary Culture",
      "Innovative Teaching Methods for Online Learning",
      "How Game Design Influences Player Experience",
      "Understanding Global Economic Trends"
    ];
    return englishTitles[Math.floor(Math.random() * englishTitles.length)];
  }
  return title;
};

export default function ThreadDiscussion({ post, showComments = false, isPreview = false }: ThreadDiscussionProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  
  const score = post.votes && Array.isArray(post.votes) 
    ? post.votes.reduce((acc: number, vote: { value: number }) => acc + vote.value, 0) 
    : 0;
    
  // Use the actual post author data, only enhance with additional profile info if missing
  const enhanceAuthorProfile = (originalUser: any) => {
    // If the user already has complete profile info, use it as-is
    if (originalUser.bio && originalUser.location && originalUser.website && originalUser._count) {
      return originalUser;
    }
    
    // Otherwise, find a matching user profile from CONSTANT_USERS or create a basic one
    const matchingUser = CONSTANT_USERS.find(user => 
      user.username === originalUser.username || 
      user.name === originalUser.name
    );
    
    if (matchingUser) {
      return {
        ...originalUser, // Keep original ID, name, username, image
        bio: matchingUser.bio,
        location: matchingUser.location,
        website: matchingUser.website,
        _count: matchingUser._count,
        createdAt: matchingUser.createdAt
      };
    }
    
    // Fallback: create basic profile info
    return {
      ...originalUser,
      bio: originalUser.bio || 'Community member sharing knowledge and insights.',
      location: originalUser.location || 'Global',
      website: originalUser.website || null,
      _count: originalUser._count || { posts: 12, comments: 45, followers: 89, following: 34 },
      createdAt: originalUser.createdAt || new Date('2023-01-01').toISOString()
    };
  };
  
  const enhancedPost = {
    ...post,
    user: enhanceAuthorProfile(post.user)
  };

  if (isPreview) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link href={`/posts/${enhancedPost.id}`} className="block">
          <div className="card-modern p-6 hover:border-indigo-500/30 transition-colors">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-semibold text-white mb-2">{getEnglishTitle(enhancedPost.title)}</h3>
              <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-1 rounded-full">
                {enhancedPost.category.name}
              </span>
            </div>
            
            <p className="text-gray-400 mb-4 line-clamp-2">{getEnglishContent(enhancedPost.content)}</p>
            
            <div className="flex items-center justify-between">
              <UserProfileMini 
                user={{
                  id: enhancedPost.user.id,
                  name: enhancedPost.user.name,
                  username: enhancedPost.user.username,
                  image: enhancedPost.user.image,
                  createdAt: enhancedPost.user.createdAt || enhancedPost.createdAt
                }}
                size="sm"
              />
              
              <div className="flex items-center space-x-3 text-sm text-gray-500">
                <div className="flex items-center">
                  <FiMessageCircle className="mr-1" />
                  <span>{enhancedPost._count.comments}</span>
                </div>
                
                <div className="flex items-center">
                  <FiTrendingUp className="mr-1" />
                  <span>{score}</span>
                </div>
              </div>
            </div>
            
            {}
            <ReactionsDisplay 
              reactions={[
                { type: 'heart', count: 5, users: ['User 1', 'User 2', 'User 3', 'User 4', 'User 5'] },
                { type: 'thumbs-up', count: 3, users: ['User 6', 'User 7', 'User 8'] },
                ...(enhancedPost.id.charCodeAt(0) % 3 === 0 ? [{ type: 'rocket', count: 2, users: ['User 9', 'User 10'] }] : []),
                ...(enhancedPost.id.charCodeAt(0) % 2 === 0 ? [{ type: 'lightbulb', count: 1, users: ['User 11'] }] : [])
              ]}
              onReact={(reactionType) => {
                console.log(`Added ${reactionType} reaction to post ${enhancedPost.id}`);
              }}
              className="mt-3"
            />
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="card-modern">
      <div className="p-6">
        {}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <Link
              href="/"
              className="inline-flex items-center text-gray-400 hover:text-indigo-400 mr-3"
            >
              ← Back to Discussions
            </Link>
          </div>
          <span className="bg-indigo-500/20 text-indigo-400 text-xs px-3 py-1 rounded-full">
            {enhancedPost.category.name}
          </span>
        </div>
        
        {}
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">{getEnglishTitle(enhancedPost.title)}</h1>
        
        {}
        <div className="mb-6">
          <UserProfileMini 
            user={{
              id: enhancedPost.user.id,
              name: enhancedPost.user.name,
              username: enhancedPost.user.username,
              image: enhancedPost.user.image,
              createdAt: enhancedPost.createdAt,
              bio: enhancedPost.user.bio,
              location: enhancedPost.user.location,
              website: enhancedPost.user.website,
              _count: enhancedPost.user._count
            }}
            size="lg"
            withBio={!!enhancedPost.user.bio}
            withLocation={!!enhancedPost.user.location}
            withStats={!!enhancedPost.user._count}
            isAuthor={true}
            showJoinDate={true}
          />
        </div>
        
        {}
        <div className="prose prose-invert max-w-none mb-6">
          {getEnglishContent(enhancedPost.content).split("\n").map((paragraph: string, i: number) => (
            paragraph.trim() ? <p key={i} className="text-gray-300 leading-relaxed">{paragraph}</p> : <br key={i} />
          ))}
        </div>
        
        {}
        <div className="flex items-center justify-between pt-6 border-t border-gray-800">
          <div className="flex items-center space-x-4">
            <button className="flex items-center text-gray-400 hover:text-indigo-400 transition-colors">
              <FiThumbsUp className="mr-1" />
              <span>Upvote ({score})</span>
            </button>
            <button className="flex items-center text-gray-400 hover:text-indigo-400 transition-colors">
              <FiShare2 className="mr-1" />
              <span>Share</span>
            </button>
          </div>
          
          <div className="text-gray-400">
            <FiMessageCircle className="inline-block mr-1" />
            {enhancedPost._count.comments} comments
          </div>
        </div>
        
        {}
        <div className="mt-4">
          <ReactionsDisplay 
            reactions={[
              { type: 'heart', count: 8, users: ['User 1', 'User 2', 'User 3', 'User 4', 'User 5', 'User 6', 'User 7', 'User 8'] },
              { type: 'thumbs-up', count: 5, users: ['User 9', 'User 10', 'User 11', 'User 12', 'User 13'] },
              { type: 'rocket', count: 3, users: ['User 14', 'User 15', 'User 16'] },
              { type: 'lightbulb', count: 2, users: ['User 17', 'User 18'] }
            ]}
            onReact={(reactionType) => {
              console.log(`Added ${reactionType} reaction to post ${enhancedPost.id}`);
            }}
          />
        </div>
      </div>
      
      {}
      {showComments && (
        <div className="border-t border-gray-800 bg-gray-900/50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                Comments ({enhancedPost._count.comments})
              </h2>
              
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
              >
                <FiCornerDownRight className="mr-1" />
                Reply
              </button>
            </div>
            
            {isReplying && (
              <CommentSection postId={enhancedPost.id} isNested={false} />
            )}
            
            <CommentSection postId={enhancedPost.id} />
          </div>
        </div>
      )}
    </div>
  );
} 