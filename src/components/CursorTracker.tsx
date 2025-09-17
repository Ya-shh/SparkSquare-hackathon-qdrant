"use client";

import React, { useEffect } from 'react';

export function CursorTracker() {
  useEffect(() => {
    const updateCursorPosition = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      
      document.documentElement.style.setProperty('--cursor-x', `${x}%`);
      document.documentElement.style.setProperty('--cursor-y', `${y}%`);
    };
    
    window.addEventListener('mousemove', updateCursorPosition);
    
    return () => {
      window.removeEventListener('mousemove', updateCursorPosition);
    };
  }, []);
  
  return null;
} 