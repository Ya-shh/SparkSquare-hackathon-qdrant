"use client";

import { useState, useEffect } from 'react';
import LoadingIndicator from '../LoadingIndicator';

interface LoadingWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  timeout?: number;
}

export default function LoadingWrapper({ 
  children, 
  fallback = <LoadingIndicator />, 
  timeout = 5000 
}: LoadingWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Ensure content shows after a short delay to prevent blank pages
    const timer = setTimeout(() => {
      setIsLoading(false);
      setShowContent(true);
    }, 100);

    // Force show content after timeout to prevent infinite loading
    const forceTimeout = setTimeout(() => {
      setIsLoading(false);
      setShowContent(true);
    }, timeout);

    return () => {
      clearTimeout(timer);
      clearTimeout(forceTimeout);
    };
  }, [timeout]);

  if (isLoading && !showContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {fallback}
      </div>
    );
  }

  return <>{children}</>;
}



