"use client";

import React from 'react';
import { FiTrendingUp } from 'react-icons/fi';

interface Tag {
  name: string;
  count: number;
}

interface TrendingTagsProps {
  tags: Tag[];
  onTagClick: (tag: string) => void;
}

export default function TrendingTags({ tags, onTagClick }: TrendingTagsProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className="mb-8" data-aos="fade-up" data-aos-duration="600">
      <div className="flex items-center space-x-2 mb-3">
        <FiTrendingUp className="text-blue-500 h-5 w-5" />
        <h3 className="text-lg font-semibold text-white">Trending Topics</h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag.name}
            onClick={() => onTagClick(tag.name)}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm rounded-full border border-gray-700 transition-colors"
            data-aos="fade-up"
            data-aos-duration="400"
            data-aos-delay={(tags.indexOf(tag) % 5) * 100}
          >
            #{tag.name.replace(/[_\s]/g, '')}
            <span className="ml-1.5 px-1.5 py-0.5 bg-gray-700 text-xs rounded-full">
              {tag.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
} 