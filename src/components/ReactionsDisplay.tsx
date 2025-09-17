"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReactionsDisplayProps {
  reactions?: {
    type: string;
    count: number;
    users: string[];
  }[];
  onReact?: (reactionType: string) => void;
  className?: string;
}

const availableReactions = [
  { id: 'thumbs-up', emoji: '👍', label: 'Thumbs Up' },
  { id: 'heart', emoji: '❤️', label: 'Heart' },
  { id: 'laugh', emoji: '😂', label: 'Laugh' },
  { id: 'wow', emoji: '😮', label: 'Wow' },
  { id: 'rocket', emoji: '🚀', label: 'Rocket' },
  { id: 'lightbulb', emoji: '💡', label: 'Lightbulb' },
];

const getEmojiForType = (type: string): string => {
  const reaction = availableReactions.find(r => r.id === type);
  return reaction?.emoji || '👍'; // Default to thumbs up if not found
};

export default function ReactionsDisplay({ 
  reactions = [], 
  onReact, 
  className = '' 
}: ReactionsDisplayProps) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  
  const displayReactions = reactions.length > 0 ? reactions : [
    { type: 'heart', count: 3, users: ['User 1', 'User 2', 'User 3'] },
    { type: 'laugh', count: 1, users: ['User 4'] }
  ];

  const handleReactionClick = (reactionType: string) => {
    if (onReact) {
      onReact(reactionType);
    }
    setShowReactionPicker(false);
  };

  return (
    <div className={`mt-2 ${className}`}>
      <div className="flex items-center">
        {}
        <div className="flex flex-wrap gap-1 items-center">
          {displayReactions.map((reaction, index) => (
            <motion.button
              key={`${reaction.type}-${index}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center px-1.5 py-0.5 rounded-full bg-gray-800/70 border border-gray-700 hover:bg-gray-700/80 transition-colors"
              onClick={() => handleReactionClick(reaction.type)}
              title={`${reaction.users.join(', ')} reacted with ${reaction.type}`}
            >
              <span className="text-base mr-1">{getEmojiForType(reaction.type)}</span>
              <span className="text-xs text-gray-300">{reaction.count}</span>
            </motion.button>
          ))}
        </div>

        {}
        <div className="relative ml-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center px-1.5 py-0.5 rounded-full bg-gray-800/50 border border-gray-700 hover:bg-gray-700 transition-colors"
            onClick={() => setShowReactionPicker(!showReactionPicker)}
          >
            <span className="text-xs text-gray-400">
              {showReactionPicker ? "Close" : "Add Reaction"}
            </span>
          </motion.button>

          {}
          <AnimatePresence>
            {showReactionPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 5 }}
                className="absolute bottom-full left-0 mb-2 bg-gray-800 border border-gray-700 rounded-lg p-2 shadow-xl z-50"
              >
                <div className="flex gap-1">
                  {availableReactions.map((reaction) => (
                    <motion.button
                      key={reaction.id}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                      onClick={() => handleReactionClick(reaction.id)}
                      title={reaction.label}
                    >
                      <span className="text-xl">{reaction.emoji}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
} 