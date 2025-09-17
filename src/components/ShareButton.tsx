"use client";

import { useState } from 'react';
import { FiShare2, FiCopy, FiTwitter, FiFacebook, FiLinkedin } from 'react-icons/fi';

interface ShareButtonProps {
  postId: string;
  title: string;
  className?: string;
}

export default function ShareButton({ postId, title, className = '' }: ShareButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const getShareUrl = () => {
    const baseUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/posts/${postId}`
      : `/posts/${postId}`;
    return baseUrl;
  };
  
  const getTwitterShareUrl = () => {
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(getShareUrl())}`;
  };
  
  const getFacebookShareUrl = () => {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`;
  };
  
  const getLinkedInShareUrl = () => {
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getShareUrl())}&title=${encodeURIComponent(title)}`;
  };
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL: ', err);
    }
  };
  
  const handleClickOutside = () => {
    setIsMenuOpen(false);
  };
  
  return (
    <div className="relative">
      <button
        className={`p-2 rounded-full hover:bg-muted transition-colors ${className}`}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Share post"
        title="Share post"
      >
        <FiShare2 className="h-4 w-4" />
      </button>
      
      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={handleClickOutside}
          />
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1" role="menu" aria-orientation="vertical">
              <button
                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                onClick={copyToClipboard}
                role="menuitem"
              >
                <FiCopy className="mr-2 h-4 w-4" />
                {isCopied ? 'Copied!' : 'Copy link'}
              </button>
              
              <a
                href={getTwitterShareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                role="menuitem"
                onClick={() => setIsMenuOpen(false)}
              >
                <FiTwitter className="mr-2 h-4 w-4" />
                Twitter
              </a>
              
              <a
                href={getFacebookShareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                role="menuitem"
                onClick={() => setIsMenuOpen(false)}
              >
                <FiFacebook className="mr-2 h-4 w-4" />
                Facebook
              </a>
              
              <a
                href={getLinkedInShareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                role="menuitem"
                onClick={() => setIsMenuOpen(false)}
              >
                <FiLinkedin className="mr-2 h-4 w-4" />
                LinkedIn
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 