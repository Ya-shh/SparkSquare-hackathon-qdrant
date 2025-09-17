"use client";

import React from 'react';

export default function LoadingIndicator() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative h-12 w-12">
        <div className="absolute h-12 w-12 rounded-full border-4 border-gray-700"></div>
        <div className="absolute h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
      <p className="mt-4 text-gray-400">Loading content...</p>
    </div>
  );
} 