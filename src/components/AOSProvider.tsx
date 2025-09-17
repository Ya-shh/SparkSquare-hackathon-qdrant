"use client";

import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

interface AOSProviderProps {
  children: React.ReactNode;
}

export function AOSProvider({ children }: AOSProviderProps) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      AOS.init({
        duration: 800,
        easing: 'ease-out',
        once: false,
        mirror: false,
        disable: window.innerWidth < 768 || 
                window.matchMedia('(prefers-reduced-motion: reduce)').matches
      });

      const handleResize = () => {
        AOS.refresh();
        if (window.innerWidth < 768) {
          document.querySelectorAll('[data-aos]').forEach(el => {
            el.removeAttribute('data-aos');
          });
        }
      };

      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  return <>{children}</>;
} 