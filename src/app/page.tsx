"use client";

import EnhancedHomepage from '@/components/EnhancedHomepage';
import LoadingWrapper from '@/components/ui/LoadingWrapper';

export default function Home() {
  return (
    <LoadingWrapper>
      <EnhancedHomepage />
    </LoadingWrapper>
  );
}
