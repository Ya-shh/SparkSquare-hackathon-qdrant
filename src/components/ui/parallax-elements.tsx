"use client";

import { useRef, useEffect, ReactNode } from 'react';
import { motion, useInView, useAnimation, Variants, useSpring } from 'framer-motion';
import { Parallax } from 'react-scroll-parallax';
import gsap from 'gsap';

export function FadeIn({ 
  children, 
  delay = 0,
  direction = null,
  className = '',
  distance = 30,
  damping = 25
}: { 
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | null;
  className?: string;
  distance?: number;
  damping?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const controls = useAnimation();
  
  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);
  
  const variants: Variants = {
    hidden: {
      opacity: 0,
      x: direction === 'left' ? -distance : direction === 'right' ? distance : 0,
      y: direction === 'up' ? -distance : direction === 'down' ? distance : 0
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.8,
        delay,
        type: "spring",
        damping
      }
    }
  };
  
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Card3D({
  children,
  className = '',
  depth = 20,
  sensitivity = 20,
  perspective = 1000,
  className2 = '',
}: {
  children: ReactNode;
  className?: string;
  depth?: number;
  sensitivity?: number;
  perspective?: number;
  className2?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const card = cardRef.current;
    const content = contentRef.current;
    if (!card || !content) return;
    
    let bounds: DOMRect;
    
    const handleMouseMove = (e: MouseEvent) => {
      bounds = card.getBoundingClientRect();
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      
      const rotateX = (mouseY - centerY) / (bounds.height / 2) * -sensitivity;
      const rotateY = (mouseX - centerX) / (bounds.width / 2) * sensitivity;
      
      gsap.to(card, {
        rotateX,
        rotateY,
        duration: 0.1,
        ease: 'power2.out',
        transformPerspective: perspective,
        transformStyle: 'preserve-3d'
      });
      
      gsap.to(content, {
        z: depth,
        duration: 0.1
      });
    };
    
    const handleMouseLeave = () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.5,
        ease: 'power3.out'
      });
      
      gsap.to(content, {
        z: 0,
        duration: 0.5
      });
    };
    
    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [depth, sensitivity, perspective]);
  
  return (
    <div 
      ref={cardRef} 
      className={`${className} overflow-hidden`}
      style={{ 
        transformStyle: 'preserve-3d', 
        perspective: perspective 
      }}
    >
      <div 
        ref={contentRef} 
        className={`${className2} relative w-full h-full`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {children}
      </div>
    </div>
  );
}

export function FloatingElement({
  children,
  className = '',
  speed = 3,
  xRange = 20,
  yRange = 20,
  rotationRange = 10
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
  xRange?: number;
  yRange?: number;
  rotationRange?: number;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!elementRef.current) return;
    
    const element = elementRef.current;
    
    const timeline = gsap.timeline({
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut"
    });
    
    const randomX = (Math.random() - 0.5) * 2 * xRange;
    const randomY = (Math.random() - 0.5) * 2 * yRange;
    const randomRotation = (Math.random() - 0.5) * 2 * rotationRange;
    
    timeline.to(element, {
      x: randomX,
      y: randomY,
      rotation: randomRotation,
      duration: speed,
      ease: "sine.inOut"
    });
    
    return () => {
      timeline.kill();
    };
  }, [speed, xRange, yRange, rotationRange]);
  
  return (
    <div ref={elementRef} className={`transition-transform will-change-transform ${className}`}>
      {children}
    </div>
  );
}

export function ParallaxSection({
  children,
  className = '',
  speed = -10,
  easing = 'easeInOut' as const,
  shouldAlwaysCompleteAnimation = true
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
  easing?: 'ease' | 'easeIn' | 'easeOut' | 'easeInOut';
  shouldAlwaysCompleteAnimation?: boolean;
}) {
  return (
    <Parallax 
      speed={speed} 
      className={className} 
      easing={easing}
      shouldAlwaysCompleteAnimation={shouldAlwaysCompleteAnimation}
    >
      {children}
    </Parallax>
  );
}

export function Parallax3DCard({
  children,
  className = '',
  depth = 30,
  rotateX = 10,
  rotateY = 10,
  perspective = 1000
}: {
  children: ReactNode;
  className?: string;
  depth?: number;
  rotateX?: number;
  rotateY?: number;
  perspective?: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    
    gsap.set(card, {
      transformStyle: 'preserve-3d',
      perspective: perspective
    });
    
    const handleScroll = () => {
      if (!card) return;
      
      const rect = card.getBoundingClientRect();
      const centerY = window.innerHeight / 2;
      const centerX = window.innerWidth / 2;
      
      const distanceY = (rect.top + rect.height / 2 - centerY) / (window.innerHeight / 2);
      const distanceX = (rect.left + rect.width / 2 - centerX) / (window.innerWidth / 2);
      
      gsap.to(card, {
        rotateX: -distanceY * rotateX,
        rotateY: distanceX * rotateY,
        z: Math.abs(distanceY) < 0.5 ? depth : 0,
        duration: 0.5,
        ease: 'power2.out'
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [depth, rotateX, rotateY, perspective]);
  
  return (
    <div
      ref={cardRef}
      className={`${className} transition-transform`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
    </div>
  );
}

export function RevealText({
  text,
  className = '',
  delay = 0,
  staggerChildren = 0.02
}: {
  text: string;
  className?: string;
  delay?: number;
  staggerChildren?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const controls = useAnimation();
  
  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);
  
  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren,
        delayChildren: delay
      }
    }
  };
  
  const child: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100
      }
    }
  };
  
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={container}
      className={className}
      aria-label={text}
    >
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          variants={child}
          className="inline-block"
          style={{ 
            display: char === ' ' ? 'inline' : 'inline-block',
            whiteSpace: 'pre'
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.div>
  );
}

export function MagneticElement({
  children,
  className = '',
  strength = 40,
  isolationRadius = 100,
  damping = 30,
  stiffness = 100,
  mass = 1
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
  isolationRadius?: number;
  damping?: number;
  stiffness?: number;
  mass?: number;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const animateX = useSpring(0, { damping, stiffness, mass });
  const animateY = useSpring(0, { damping, stiffness, mass });
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    let bounds: DOMRect;
    let isMoving = false;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!bounds) bounds = element.getBoundingClientRect();
      
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      
      const deltaX = mouseX - centerX;
      const deltaY = mouseY - centerY;
      
      const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
      const maxDistance = Math.max(bounds.width, bounds.height);
      
      const otherMagneticElements = document.querySelectorAll('[data-magnetic="true"]');
      let isClosest = true;
      
      otherMagneticElements.forEach(otherElement => {
        if (otherElement === element) return;
        
        const otherBounds = otherElement.getBoundingClientRect();
        const otherCenterX = otherBounds.left + otherBounds.width / 2;
        const otherCenterY = otherBounds.top + otherBounds.height / 2;
        
        const otherDeltaX = mouseX - otherCenterX;
        const otherDeltaY = mouseY - otherCenterY;
        
        const otherDistance = Math.sqrt(otherDeltaX ** 2 + otherDeltaY ** 2);
        
        if (Math.abs(distance - otherDistance) < isolationRadius && otherDistance < distance) {
          isClosest = false;
        }
      });
      
      if (distance < maxDistance * 1.5 && isClosest) {
        isMoving = true;
        const x = deltaX * strength / 100;
        const y = deltaY * strength / 100;
        
        animateX.set(x);
        animateY.set(y);
      } else if (isMoving) {
        isMoving = false;
        animateX.set(0);
        animateY.set(0);
      }
    };
    
    const handleMouseLeave = () => {
      isMoving = false;
      animateX.set(0);
      animateY.set(0);
    };
    
    const handleResize = () => {
      bounds = element.getBoundingClientRect();
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      element?.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, [strength, isolationRadius, animateX, animateY]);
  
  return (
    <motion.div 
      ref={elementRef} 
      className={`relative inline-block ${className}`} 
      data-magnetic="true"
      style={{ x: animateX, y: animateY }}
    >
      {children}
    </motion.div>
  );
}

export function GleamingEffect({
  children,
  className = '',
  duration = 3,
  delay = 0,
  angle = 45,
  width = 100
}: {
  children: ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  angle?: number;
  width?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const gleam = document.createElement('div');
    gleam.classList.add('gleam-effect');
    gleam.style.position = 'absolute';
    gleam.style.top = '0';
    gleam.style.left = '-100%';
    gleam.style.width = `${width}%`;
    gleam.style.height = '100%';
    gleam.style.background = `linear-gradient(${angle}deg, transparent, rgba(255, 255, 255, 0.3), transparent)`;
    gleam.style.zIndex = '10';
    gleam.style.pointerEvents = 'none';
    
    container.appendChild(gleam);
    
    const animate = () => {
      gsap.to(gleam, {
        left: '100%',
        duration,
        delay,
        ease: 'power2.inOut',
        onComplete: () => {
          gleam.style.left = '-100%';
          gsap.delayedCall(delay + 1, animate);
        }
      });
    };
    
    animate();
    
    return () => {
      gsap.killTweensOf(gleam);
      container.removeChild(gleam);
    };
  }, [duration, delay, angle, width]);
  
  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {children}
    </div>
  );
} 