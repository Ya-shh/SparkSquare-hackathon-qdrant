"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from 'sonner';
import ParallaxProvider from "./ParallaxProvider";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <ParallaxProvider>
          <AnimatePresence mode="wait">
            <div key="main-content">{children}</div>
            <Toaster
              position="bottom-right"
              closeButton
              richColors
              expand={false}
              theme="system"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--card)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                },
              }}
            />
          </AnimatePresence>
        </ParallaxProvider>
      </ThemeProvider>
    </SessionProvider>
  );
} 