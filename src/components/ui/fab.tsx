'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiPlus, FiX } from 'react-icons/fi';
import toast from '@/lib/toast';

type FabAction = {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
};

interface FloatingActionButtonProps {
  actions: FabAction[];
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const positionClasses = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'top-right': 'top-6 right-6',
  'top-left': 'top-6 left-6',
};

export function FloatingActionButton({
  actions,
  position = 'bottom-right',
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleActionClick = (action: FabAction) => {
    action.onClick();
    toast.success(`${action.label} action triggered!`);
    setIsOpen(false);
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <AnimatePresence>
        {isOpen && (
          <div className="absolute bottom-20 right-0 flex flex-col-reverse items-end gap-3">
            {actions.map((action) => (
              <motion.button
                key={action.id}
                className={`flex items-center rounded-full shadow-lg bg-white dark:bg-gray-800 px-4 py-3 text-sm gap-3 
                  ${action.color ? action.color : 'text-gray-800 dark:text-white'}`}
                onClick={() => handleActionClick(action)}
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0, y: 20 }}
                transition={{ duration: 0.2, delay: actions.indexOf(action) * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>{action.label}</span>
                <span className="w-5 h-5 flex items-center justify-center">
                  {action.icon}
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.button
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center 
          ${isOpen 
            ? 'bg-red-500 text-white' 
            : 'bg-gradient-to-r from-sparksquare-fuchsia to-sparksquare-violet text-white'}`}
        onClick={toggleOpen}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ 
          scale: 1, 
          rotate: isOpen ? 45 : 0 
        }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {isOpen ? <FiX size={24} /> : <FiPlus size={24} />}
      </motion.button>
    </div>
  );
}