"use client";

import { ReactNode, useEffect, useState } from 'react';
import { ParallaxProvider as ReactParallaxProvider } from 'react-scroll-parallax';
import Lenis from '@studio-freight/lenis';

interface ParallaxProviderProps {
  children: ReactNode;
}

export default function ParallaxProvider({ children }: ParallaxProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <ReactParallaxProvider>
      {children}
    </ReactParallaxProvider>
  );
} 