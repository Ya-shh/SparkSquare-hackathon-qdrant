"use client";

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface GlowingCardProps {
  className?: string;
  glowColor?: 'blue' | 'slate' | 'teal' | 'subtle' | 'fuchsia' | 'violet' | 'cyan';
  children: React.ReactNode;
  hoverEffect?: boolean;
  noiseTexture?: boolean;
}

export default function GlowingCard({
  className = '',
  glowColor = 'subtle',
  children,
  hoverEffect = true,
  noiseTexture = true
}: GlowingCardProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const glowColorMap = {
    blue: 'after:from-blue-500/20 after:via-blue-500/10 after:to-transparent',
    slate: 'after:from-slate-500/20 after:via-slate-500/10 after:to-transparent',
    teal: 'after:from-teal-500/20 after:via-teal-500/10 after:to-transparent',
    subtle: 'after:from-blue-500/15 after:via-slate-500/10 after:to-teal-500/10',
    fuchsia: 'after:from-fuchsia-500/20 after:via-fuchsia-500/10 after:to-transparent',
    violet: 'after:from-violet-500/20 after:via-violet-500/10 after:to-transparent',
    cyan: 'after:from-cyan-500/20 after:via-cyan-500/10 after:to-transparent',
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !hoverEffect) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  useEffect(() => {
    if (!hoverEffect) return;
    
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (!e.beta || !e.gamma) return;
      
      const beta = Math.min(Math.max(e.beta / 180 + 0.5, 0), 1);
      const gamma = Math.min(Math.max(e.gamma / 90 + 0.5, 0), 1);
      
      setPosition({
        x: gamma,
        y: beta
      });
    };
    
    window.addEventListener('deviceorientation', handleOrientation);
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [hoverEffect]);

  return (
    <motion.div
      ref={cardRef}
      className={`relative rounded-xl bg-gray-950/90 dark:bg-slate-900/90 border border-slate-800/80 dark:border-slate-700/40 backdrop-blur-sm overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {}
      <div className="relative z-10">{children}</div>
      
      {}
      <div 
        className={`absolute inset-0 rounded-xl p-px ${glowColorMap[glowColor]}`}
        style={{ 
          background: isHovering && glowColor === 'fuchsia'
            ? `linear-gradient(to right, rgba(217, 70, 239, 0.2), rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.1))`
            : isHovering && glowColor === 'violet'
            ? `linear-gradient(to right, rgba(139, 92, 246, 0.2), rgba(217, 70, 239, 0.15), rgba(6, 182, 212, 0.1))`
            : isHovering && glowColor === 'cyan'
            ? `linear-gradient(to right, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.15), rgba(217, 70, 239, 0.1))`
            : isHovering 
            ? `linear-gradient(to right, rgba(59, 130, 246, 0.15), rgba(100, 116, 139, 0.12), rgba(20, 184, 166, 0.15))` 
            : 'rgba(15, 23, 42, 0.4)' 
        }}
      />
      
      {}
      {hoverEffect && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-60 transition-opacity duration-300"
          style={{
            background: glowColor === 'fuchsia'
              ? `radial-gradient(circle at ${position.x * 100}% ${position.y * 100}%, rgba(217, 70, 239, 0.15) 0%, rgba(139, 92, 246, 0.1) 25%, transparent 70%)`
              : glowColor === 'violet'
              ? `radial-gradient(circle at ${position.x * 100}% ${position.y * 100}%, rgba(139, 92, 246, 0.15) 0%, rgba(217, 70, 239, 0.1) 25%, transparent 70%)`
              : glowColor === 'cyan'
              ? `radial-gradient(circle at ${position.x * 100}% ${position.y * 100}%, rgba(6, 182, 212, 0.15) 0%, rgba(139, 92, 246, 0.1) 25%, transparent 70%)`
              : `radial-gradient(circle at ${position.x * 100}% ${position.y * 100}%, rgba(59, 130, 246, 0.12) 0%, rgba(100, 116, 139, 0.08) 25%, transparent 70%)`,
            opacity: isHovering ? 0.8 : 0.3
          }}
        />
      )}
      
      {}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <svg width="100%" height="100%" className="absolute inset-0">
          {glowColor === 'fuchsia' ? (
            <>
              <circle cx="20%" cy="30%" r="2.5" fill="rgba(217, 70, 239, 0.4)" />
              <circle cx="80%" cy="20%" r="2.5" fill="rgba(139, 92, 246, 0.4)" />
              <circle cx="65%" cy="60%" r="3.5" fill="rgba(6, 182, 212, 0.4)" />
              <circle cx="30%" cy="70%" r="2.5" fill="rgba(217, 70, 239, 0.4)" />
              <circle cx="80%" cy="85%" r="2.5" fill="rgba(139, 92, 246, 0.4)" />
              
              <path 
                d="M20% 30% L65% 60% M80% 20% L65% 60% M30% 70% L65% 60% M80% 85% L65% 60%" 
                stroke="url(#fuchsiaLineGradient)" 
                strokeWidth="0.8" 
                strokeOpacity="0.4"
                strokeDasharray="3,3"
              />
              
              <defs>
                <linearGradient id="fuchsiaLineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(217, 70, 239, 0.4)" />
                  <stop offset="50%" stopColor="rgba(139, 92, 246, 0.4)" />
                  <stop offset="100%" stopColor="rgba(6, 182, 212, 0.4)" />
                </linearGradient>
              </defs>
            </>
          ) : glowColor === 'violet' ? (
            <>
              <circle cx="20%" cy="30%" r="2.5" fill="rgba(139, 92, 246, 0.4)" />
              <circle cx="80%" cy="20%" r="2.5" fill="rgba(217, 70, 239, 0.4)" />
              <circle cx="65%" cy="60%" r="3.5" fill="rgba(6, 182, 212, 0.4)" />
              <circle cx="30%" cy="70%" r="2.5" fill="rgba(139, 92, 246, 0.4)" />
              <circle cx="80%" cy="85%" r="2.5" fill="rgba(217, 70, 239, 0.4)" />
              
              <path 
                d="M20% 30% L65% 60% M80% 20% L65% 60% M30% 70% L65% 60% M80% 85% L65% 60%" 
                stroke="url(#violetLineGradient)" 
                strokeWidth="0.8" 
                strokeOpacity="0.4"
                strokeDasharray="3,3"
              />
              
              <defs>
                <linearGradient id="violetLineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(139, 92, 246, 0.4)" />
                  <stop offset="50%" stopColor="rgba(217, 70, 239, 0.4)" />
                  <stop offset="100%" stopColor="rgba(6, 182, 212, 0.4)" />
                </linearGradient>
              </defs>
            </>
          ) : glowColor === 'cyan' ? (
            <>
              <circle cx="20%" cy="30%" r="2.5" fill="rgba(6, 182, 212, 0.4)" />
              <circle cx="80%" cy="20%" r="2.5" fill="rgba(139, 92, 246, 0.4)" />
              <circle cx="65%" cy="60%" r="3.5" fill="rgba(217, 70, 239, 0.4)" />
              <circle cx="30%" cy="70%" r="2.5" fill="rgba(6, 182, 212, 0.4)" />
              <circle cx="80%" cy="85%" r="2.5" fill="rgba(139, 92, 246, 0.4)" />
              
              <path 
                d="M20% 30% L65% 60% M80% 20% L65% 60% M30% 70% L65% 60% M80% 85% L65% 60%" 
                stroke="url(#cyanLineGradient)" 
                strokeWidth="0.8" 
                strokeOpacity="0.4"
                strokeDasharray="3,3"
              />
              
              <defs>
                <linearGradient id="cyanLineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(6, 182, 212, 0.4)" />
                  <stop offset="50%" stopColor="rgba(139, 92, 246, 0.4)" />
                  <stop offset="100%" stopColor="rgba(217, 70, 239, 0.4)" />
                </linearGradient>
              </defs>
            </>
          ) : (
            <>
              <circle cx="20%" cy="30%" r="2.5" fill="rgba(59, 130, 246, 0.4)" />
              <circle cx="80%" cy="20%" r="2.5" fill="rgba(100, 116, 139, 0.4)" />
              <circle cx="65%" cy="60%" r="3.5" fill="rgba(20, 184, 166, 0.4)" />
              <circle cx="30%" cy="70%" r="2.5" fill="rgba(59, 130, 246, 0.4)" />
              <circle cx="80%" cy="85%" r="2.5" fill="rgba(100, 116, 139, 0.4)" />
              
              <path 
                d="M20% 30% L65% 60% M80% 20% L65% 60% M30% 70% L65% 60% M80% 85% L65% 60%" 
                stroke="url(#lineGradient)" 
                strokeWidth="0.8" 
                strokeOpacity="0.4"
                strokeDasharray="3,3"
              />
              
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(59, 130, 246, 0.4)" />
                  <stop offset="50%" stopColor="rgba(100, 116, 139, 0.4)" />
                  <stop offset="100%" stopColor="rgba(20, 184, 166, 0.4)" />
                </linearGradient>
              </defs>
            </>
          )}
        </svg>
      </div>
      
      {}
      {noiseTexture && (
        <div 
          className="absolute inset-0 opacity-5 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      )}
    </motion.div>
  );
} 