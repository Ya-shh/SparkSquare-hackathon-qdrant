"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { FiUser, FiExternalLink } from "react-icons/fi";
import { handleAvatarError } from "@/lib/imageUtils";
import { motion, AnimatePresence } from "framer-motion";

export interface UserProfilePopoverProps {
  username: string;
  name?: string | null;
  image?: string | null;
  role?: string;
  showArrow?: boolean;
  children: React.ReactNode;
  direction?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  id?: string;
}

export default function UserProfilePopover({
  username,
  name,
  image,
  role,
  showArrow = true,
  children,
  direction = 'top',
  delay = 300,
  id
}: UserProfilePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [isHoveringPopover, setIsHoveringPopover] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState<'left' | 'right' | 'top' | 'bottom' | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverContentRef = useRef<HTMLDivElement>(null);
  
  const uniqueId = `popover-${id || username}`;
  
  useEffect(() => {
    if (isOpen && popoverRef.current && popoverContentRef.current) {
      const triggerRect = popoverRef.current.getBoundingClientRect();
      const popoverRect = popoverContentRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      if (direction === 'right' && triggerRect.right + popoverRect.width + 16 > windowWidth) {
        setAdjustedPosition('left');
      } 
      else if (direction === 'left' && triggerRect.left - popoverRect.width - 16 < 0) {
        setAdjustedPosition('right');
      }
      else if (direction === 'top' && triggerRect.top - popoverRect.height - 16 < 0) {
        setAdjustedPosition('bottom');
      }
      else if (direction === 'bottom' && triggerRect.bottom + popoverRect.height + 16 > windowHeight) {
        setAdjustedPosition('top');
      }
      else {
        setAdjustedPosition(null);
      }
    }
  }, [isOpen, direction]);
  
  const effectiveDirection = adjustedPosition || direction;
  
  const getPositionStyles = () => {
    switch (effectiveDirection) {
      case 'top':
        return {
          bottom: '100%',
          marginBottom: '16px', // Increased spacing
          left: '50%',
          transform: 'translateX(-50%)'
        };
      case 'bottom':
        return {
          top: '100%',
          marginTop: '16px', // Increased spacing
          left: '50%',
          transform: 'translateX(-50%)'
        };
      case 'left':
        return {
          right: '100%',
          marginRight: '16px', // Increased spacing
          top: '0',
          transform: 'translateY(0)'
        };
      case 'right':
        return {
          left: '100%',
          marginLeft: '16px', // Increased spacing
          top: '0',
          transform: 'translateY(0)'
        };
      default:
        return {
          bottom: '100%',
          marginBottom: '16px', // Increased spacing
          left: '50%',
          transform: 'translateX(-50%)'
        };
    }
  };
  
  const getHoverPadding = () => {
    switch (effectiveDirection) {
      case 'top':
        return 'pb-4'; // Padding bottom to extend hover area downward
      case 'bottom':
        return 'pt-4'; // Padding top to extend hover area upward
      case 'left':
        return 'pr-4'; // Padding right to extend hover area to the right
      case 'right':
        return 'pl-4'; // Padding left to extend hover area to the left
      default:
        return 'pb-4';
    }
  };
  
  const handleMouseEnter = () => {
    if (timer) clearTimeout(timer);
    
    const newTimer = setTimeout(() => {
      setIsOpen(true);
    }, delay);
    
    setTimer(newTimer);
  };
  
  const handleMouseLeave = () => {
    if (timer) clearTimeout(timer);
    
    if (!isHoveringPopover) {
      const newTimer = setTimeout(() => {
        setIsOpen(false);
      }, 400); // Longer delay before closing
      
      setTimer(newTimer);
    }
  };
  
  const handlePopoverMouseEnter = () => {
    setIsHoveringPopover(true);
    if (timer) clearTimeout(timer);
  };
  
  const handlePopoverMouseLeave = () => {
    setIsHoveringPopover(false);
    if (timer) clearTimeout(timer);
    
    const newTimer = setTimeout(() => {
      setIsOpen(false);
    }, 400); // Longer delay before closing
    
    setTimer(newTimer);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && 
          popoverRef.current && 
          popoverContentRef.current && 
          !popoverRef.current.contains(e.target as Node) && 
          !popoverContentRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  const variants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      ...(() => {
        switch (effectiveDirection) {
          case 'top': return { y: 10 };
          case 'bottom': return { y: -10 };
          case 'left': return { x: 10 }; 
          case 'right': return { x: -10 };
          default: return { y: 10 };
        }
      })()
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 500
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  };
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={popoverRef}
    >
      <div className={`${getHoverPadding()}`}>
        {children}
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={popoverContentRef}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={variants}
            style={getPositionStyles()}
            className="absolute z-[9999] w-[220px] max-w-[80vw] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 overflow-visible"
            onMouseEnter={handlePopoverMouseEnter}
            onMouseLeave={handlePopoverMouseLeave}
          >
            {}
            {showArrow && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className={`absolute w-3 h-3 bg-white dark:bg-gray-800 transform rotate-45 border-gray-200 dark:border-gray-700
                  ${effectiveDirection === 'top' ? 'top-full -translate-x-1/2 left-1/2 -mt-1.5 border-r border-b' : ''}
                  ${effectiveDirection === 'bottom' ? 'bottom-full -translate-x-1/2 left-1/2 -mb-1.5 border-l border-t' : ''}
                  ${effectiveDirection === 'left' ? 'left-full top-4 -ml-1.5 border-t border-r' : ''}
                  ${effectiveDirection === 'right' ? 'right-full top-4 -mr-1.5 border-b border-l' : ''}
                `} 
              />
            )}
            
            {}
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className="flex items-center"
            >
              {}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="h-12 w-12 rounded-full overflow-hidden mr-3 flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-800"
              >
                {image ? (
                  <img
                    src={image}
                    alt={name || username}
                    className="h-full w-full object-cover"
                    onError={(e) => handleAvatarError(e, name || username)}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-500">
                    <FiUser className="text-white" />
                  </div>
                )}
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col">
                  <p className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                    {name || username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    @{username}
                  </p>
                  
                  {role && (
                    <motion.span 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="mt-1 text-xs self-start inline-block bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded-full"
                    >
                      {role}
                    </motion.span>
                  )}
                </div>
              </div>
            </motion.div>
            
            {}
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.2 }}
              className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700"
            >
              <Link
                href={`/users/${username}`}
                className="flex items-center justify-center w-full text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
              >
                <FiExternalLink className="mr-1.5" />
                View Profile
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 