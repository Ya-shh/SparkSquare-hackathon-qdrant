"use client";

import Link from 'next/link';
import { FiArrowLeft, FiHome, FiSearch } from 'react-icons/fi';

export default function PostNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-gray-900/60 backdrop-blur-lg rounded-xl border border-gray-700/50 p-8 shadow-xl">
          {/* 404 Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-indigo-500/20 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-indigo-400">404</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-3">
            Post Not Found
          </h1>

          {/* Description */}
          <p className="text-gray-400 mb-8">
            The discussion you're looking for doesn't exist or has been moved. 
            It might be available in our threads section.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            >
              <FiHome className="mr-2 h-4 w-4" />
              Go to Homepage
            </Link>
            
            <Link
              href="/search"
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-medium rounded-lg transition-colors border border-gray-700"
            >
              <FiSearch className="mr-2 h-4 w-4" />
              Search Discussions
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="w-full inline-flex items-center justify-center px-6 py-3 text-gray-400 hover:text-white font-medium transition-colors"
            >
              <FiArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </button>
          </div>

          {/* Suggestions */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <p className="text-sm text-gray-500 mb-4">Popular discussions:</p>
            <div className="space-y-2">
              <Link
                href="/threads/1"
                className="block text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                How to improve brain memory and cognition
              </Link>
              <Link
                href="/threads/2"
                className="block text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                The future of AI in healthcare
              </Link>
              <Link
                href="/threads/3"
                className="block text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Understanding quantum computing basics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
