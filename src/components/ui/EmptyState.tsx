"use client";

import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export default function EmptyState({ 
  title, 
  description, 
  icon = <FiAlertCircle className="h-10 w-10 text-muted-foreground/70" />
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 rounded-lg border border-dashed border-muted-foreground/20 bg-card/30">
      <div className="mb-4 rounded-full bg-muted/50 p-3">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2 cosmic-text">{title}</h3>
      <p className="text-muted-foreground text-center max-w-md">{description}</p>
    </div>
  );
} 