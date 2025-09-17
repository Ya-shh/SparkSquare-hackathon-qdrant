"use client";

import React, { useEffect, useRef } from 'react';

export const AnimatedBackground = () => {
  const starsRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!starsRef.current) return;
    
    const starCount = 150;
    const container = starsRef.current;
    
    container.innerHTML = '';
    
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      
      const size = Math.random() * 2.5 + 0.5;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const delay = Math.random() * 10;
      const duration = Math.random() * 3 + 2;
      
      const colors = [
        'rgba(147, 197, 253, 0.8)', // blue
        'rgba(165, 180, 252, 0.8)', // indigo
        'rgba(196, 181, 253, 0.8)', // violet
        'rgba(209, 213, 219, 0.8)', // gray
        'rgba(255, 255, 255, 0.8)', // white
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      star.style.position = 'absolute';
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.borderRadius = '50%';
      star.style.backgroundColor = color;
      star.style.boxShadow = `0 0 ${size * 2}px ${color}`;
      star.style.left = `${x}%`;
      star.style.top = `${y}%`;
      star.style.opacity = (Math.random() * 0.6 + 0.2).toString();
      
      star.style.animation = `pulse ${duration}s ease-in-out infinite ${delay}s`;
      
      container.appendChild(star);
    }
    
    const createShootingStar = () => {
      if (!container) return;
      
      const star = document.createElement('div');
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const length = Math.random() * 80 + 40;
      const angle = Math.random() * 360;
      
      star.style.position = 'absolute';
      star.style.width = '2px';
      star.style.height = '2px';
      star.style.left = `${x}%`;
      star.style.top = `${y}%`;
      star.style.boxShadow = `0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 ${length}px 1px rgba(147, 197, 253, 0.5)`;
      star.style.transform = `rotate(${angle}deg)`;
      star.style.opacity = '0';
      star.style.animation = 'shooting-star 6s ease-out infinite';
      star.style.animationDelay = `${Math.random() * 10}s`;
      
      container.appendChild(star);
    };
    
    for (let i = 0; i < 5; i++) {
      createShootingStar();
    }
    
    const createNebula = () => {
      if (!container) return;
      
      const nebula = document.createElement('div');
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const size = Math.random() * 300 + 200;
      
      nebula.style.position = 'absolute';
      nebula.style.width = `${size}px`;
      nebula.style.height = `${size}px`;
      nebula.style.borderRadius = '50%';
      nebula.style.background = 'radial-gradient(circle at center, rgba(79, 70, 229, 0.05) 0%, rgba(109, 40, 217, 0.03) 40%, transparent 70%)';
      nebula.style.left = `${x}%`;
      nebula.style.top = `${y}%`;
      nebula.style.opacity = '0.4';
      nebula.style.filter = 'blur(30px)';
      nebula.style.animation = 'nebula-drift 30s ease-in-out infinite alternate';
      nebula.style.animationDelay = `${Math.random() * 15}s`;
      
      container.appendChild(nebula);
    };
    
    for (let i = 0; i < 3; i++) {
      createNebula();
    }
    
    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950"></div>

      <div ref={starsRef} className="absolute inset-0 z-0"></div>

      <div 
        className="absolute inset-0 opacity-30" 
        style={{
          background: 'radial-gradient(circle at 25% 25%, rgba(79, 70, 229, 0.15), transparent 40%), radial-gradient(circle at 75% 75%, rgba(109, 40, 217, 0.15), transparent 40%)',
          animation: 'gradient-shift 15s ease-in-out infinite alternate'
        }}
      ></div>

      <div 
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')",
          backgroundSize: 'cover'
        }}
      ></div>

      <div 
        className="absolute inset-0 opacity-70" 
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.6) 100%)'
        }}
      ></div>

      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '80px 80px'
        }}
      ></div>

      <div 
        className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at var(--cursor-x, 50%) var(--cursor-y, 50%), rgba(79, 70, 229, 0.15), transparent 20%)',
        }}
      ></div>
    </div>
  );
}; 