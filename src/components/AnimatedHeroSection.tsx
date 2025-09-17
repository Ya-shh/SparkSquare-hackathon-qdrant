"use client";

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  FiUsers, 
  FiMessageCircle,
  FiLayers,
  FiArrowRight
} from 'react-icons/fi';

interface AnimatedHeroSectionProps {
  stats: {
    activeUsers: number;
    dailyDiscussions: number;
    topicsCovered: number;
  };
}

interface CounterTextProps {
  value: number;
  label: string;
}

function CounterText({ value, label }: CounterTextProps) {
  return (
    <div className="flex flex-col">
      <span className="text-2xl md:text-3xl font-bold text-primary-bold">{value}+</span>
      <span className="text-xs sm:text-sm text-gray-400">{label}</span>
    </div>
  );
}

export default function AnimatedHeroSection({ stats }: AnimatedHeroSectionProps) {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <div className="flex flex-col lg:flex-row items-center justify-between">
        <div 
          className="w-full lg:w-1/2 lg:pr-8 xl:pr-12 mb-10 lg:mb-0"
          data-aos="fade-right" 
          data-aos-duration="1000"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-high-contrast" data-text="SparkSquare">
            SparkSquare
          </h1>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-medium mb-4 md:mb-6 text-emphasis">
            Discover Ideas & Discussions
          </h2>
          <p className="text-base md:text-lg text-gray-300 mb-6 md:mb-8">
            Join our vibrant community to discuss, share and discover new ideas with like-minded people.
          </p>
          
          <div className="flex flex-wrap gap-6 md:gap-10 mb-8 md:mb-10" data-aos="fade-up" data-aos-duration="600" data-aos-delay="200">
            <CounterText value={stats.activeUsers} label="Active Users" />
            <CounterText value={stats.dailyDiscussions} label="Daily Discussions" />
            <CounterText value={stats.topicsCovered} label="Topics Covered" />
          </div>
          
          <div 
            className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4"
            data-aos="fade-up"
            data-aos-duration="600"
            data-aos-delay="300"
          >
            <Link 
              href="/sign-up" 
              className="px-5 py-2.5 md:px-6 md:py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md flex items-center justify-center transition-colors"
            >
              Join the Discussion
              <FiArrowRight className="ml-2" />
            </Link>
            <Link 
              href="/categories" 
              className="px-5 py-2.5 md:px-6 md:py-3 border border-gray-700 hover:border-gray-600 text-gray-200 font-medium rounded-md flex items-center justify-center transition-colors"
            >
              Browse Categories
            </Link>
          </div>
        </div>
        
        <div 
          className="w-full lg:w-1/2 relative"
          data-aos="fade-left" 
          data-aos-duration="1000" 
          data-aos-delay="200"
        >
          <div className="relative p-5 sm:p-8 bg-gray-800/50 border border-gray-700 rounded-xl shadow-lg">
            <div 
              className="mb-6 flex items-center"
              data-aos="fade-up"
              data-aos-duration="600"
              data-aos-delay="300"
            >
              <FiUsers className="text-blue-500 text-xl mr-2" />
              <h3 className="text-xl font-semibold text-primary-bold">Connect with experts</h3>
            </div>
            <p 
              className="text-gray-300 mb-4"
              data-aos="fade-up"
              data-aos-duration="600"
              data-aos-delay="350"
            >
              SparkSquare connects you with domain experts and enthusiasts across various fields of knowledge.
            </p>
            
            <div 
              className="mb-6 flex items-center"
              data-aos="fade-up"
              data-aos-duration="600"
              data-aos-delay="400"
            >
              <FiMessageCircle className="text-blue-500 text-xl mr-2" />
              <h3 className="text-xl font-semibold text-primary-bold">Engage in discussions</h3>
            </div>
            <p 
              className="text-gray-300 mb-4"
              data-aos="fade-up"
              data-aos-duration="600"
              data-aos-delay="450"
            >
              Participate in thoughtful, structured discussions on topics that matter to you.
            </p>
            
            <div 
              className="mb-6 flex items-center"
              data-aos="fade-up"
              data-aos-duration="600"
              data-aos-delay="500"
            >
              <FiLayers className="text-blue-500 text-xl mr-2" />
              <h3 className="text-xl font-semibold text-primary-bold">Discover new interests</h3>
            </div>
            <p 
              className="text-gray-300"
              data-aos="fade-up"
              data-aos-duration="600"
              data-aos-delay="550"
            >
              Explore trending topics and expand your horizons with our curated content.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 