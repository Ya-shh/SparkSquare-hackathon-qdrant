"use client";

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function AnimatedGradientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    
    const colors = [
      { r: 99, g: 102, b: 241, a: 0.6 },  // Indigo
      { r: 16, g: 185, b: 129, a: 0.5 },  // Emerald
      { r: 244, g: 63, b: 94, a: 0.4 }    // Rose
    ];
    
    const circles = colors.map(() => ({
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.max(dimensions.width, dimensions.height) * 0.5
    }));
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      circles.forEach(circle => {
        circle.x += circle.vx;
        circle.y += circle.vy;
        
        if (circle.x < 0 || circle.x > dimensions.width) circle.vx *= -1;
        if (circle.y < 0 || circle.y > dimensions.height) circle.vy *= -1;
      });
      
      circles.forEach((circle, i) => {
        const color = colors[i];
        const gradient = ctx.createRadialGradient(
          circle.x, circle.y, 0,
          circle.x, circle.y, circle.radius
        );
        
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`);
        gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    };
    
    let animationId: number;
    const animate = () => {
      draw();
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [dimensions]);
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10 opacity-40 pointer-events-none"
    />
  );
}

export function AnimatedGrid() {
  return (
    <div className="fixed inset-0 -z-10 opacity-5 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] grid-rows-[repeat(auto-fill,minmax(40px,1fr))]">
        {Array.from({ length: 400 }).map((_, i) => (
          <div key={i} className="border-r border-b border-gray-600/10 dark:border-gray-300/10" />
        ))}
      </div>
    </div>
  );
}

export function FloatingParticles({
  particleCount = 40,
  color = "indigo"
}: {
  particleCount?: number;
  color?: "indigo" | "emerald" | "rose" | "mixed";
}) {
  const colorVariants = {
    indigo: "bg-indigo-600",
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
    mixed: ""
  };
  
  const baseClass = color === "mixed" ? "" : colorVariants[color];
  
  const particles = Array.from({ length: particleCount }).map((_, i) => {
    const size = Math.random() * 8 + 2;
    const initialX = Math.random() * 100;
    const initialY = Math.random() * 100;
    const duration = Math.random() * 50 + 20;
    const delay = Math.random() * -duration;
    
    let specificColor = "";
    if (color === "mixed") {
      const colors = [
        "bg-indigo-600", 
        "bg-emerald-500", 
        "bg-rose-500",
        "bg-violet-500",
        "bg-blue-500"
      ];
      specificColor = colors[Math.floor(Math.random() * colors.length)];
    }
    
    return {
      id: i,
      size,
      initialX,
      initialY,
      duration,
      delay,
      specificColor
    };
  });
  
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full opacity-[0.15] ${baseClass} ${particle.specificColor}`}
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            top: `${particle.initialY}%`,
            left: `${particle.initialX}%`,
          }}
          animate={{
            y: ["0%", "100%", "0%"],
            x: [
              `${Math.sin(particle.initialY) * 10}%`,
              `${Math.sin(particle.initialY + 0.5) * 10}%`,
              `${Math.sin(particle.initialY) * 10}%`
            ]
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
}

export function NoiseTexture({ opacity = 0.03 }: { opacity?: number }) {
  return (
    <div 
      className="fixed inset-0 -z-10 pointer-events-none" 
      style={{ 
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        opacity 
      }}
    />
  );
} 