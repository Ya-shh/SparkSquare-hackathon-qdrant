"use client";

import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';

interface ErrorDisplayProps {
  message: string;
}

export default function ErrorDisplay({ message }: ErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-800/50 rounded-lg border border-red-800/40">
      <FiAlertCircle className="text-red-500 h-12 w-12 mb-4" />
      <h3 className="text-lg font-semibold text-white mb-2">Something went wrong</h3>
      <p className="text-gray-400 text-center max-w-md">{message}</p>
    </div>
  );
} 