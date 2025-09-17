"use client";

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { FiFolder, FiMessageSquare, FiChevronRight, FiSearch } from "react-icons/fi";
import UnifiedSearchBar from './ui/UnifiedSearchBar';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  creator: {
    name: string;
    username: string;
    image: string;
  };
  _count: {
    posts: number;
  };
}

interface CategorySearchProps {
  categories: Category[];
  initialQuery?: string;
}

export default function CategorySearch({ categories, initialQuery = "" }: CategorySearchProps) {
  const [sourceCategories, setSourceCategories] = useState<Category[]>(categories);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>(categories);
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  // Fetch from Qdrant vector API on mount if no categories were provided
  useEffect(() => {
    const loadFromVector = async () => {
      if (categories.length > 0) return;
      try {
        const res = await fetch('/api/categories/vector', { cache: 'no-store' });
        const data = await res.json();
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          const normalized = data.categories.map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description || '',
            creator: c.creator || { name: 'Community', username: 'community', image: '/default-avatar.svg' },
            _count: c._count || { posts: 0 },
          }));
          setSourceCategories(normalized);
          setFilteredCategories(normalized);
        }
      } catch {}
    };
    loadFromVector();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter categories when search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = (sourceCategories || []).filter(category => 
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(sourceCategories);
    }
  }, [searchQuery, sourceCategories]);

  const handleQueryChange = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto pt-8 pb-16 px-4 sm:px-6">
        <div className="relative">
          {/* Background Elements */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute top-1/2 right-0 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl opacity-10"></div>
          
          {/* Header Section */}
          <div className="relative mb-12 text-center">
            <h1 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-500 bg-clip-text text-transparent">
                Explore Categories
              </span>
            </h1>
            
            <p className="text-gray-400 max-w-2xl mx-auto mb-8">
              Browse our vibrant community categories and join discussions on topics that interest you.
              Each category contains expert insights and community perspectives.
            </p>
            
            {/* Enhanced Search Bar */}
            <div className="max-w-md mx-auto mb-12">
              <UnifiedSearchBar
                placeholder="Search categories..."
                variant="simple"
                size="md"
                showResults={false}
                onQueryChange={handleQueryChange}
                initialQuery={initialQuery}
                className="mx-auto"
              />
            </div>
          </div>
          
          {/* Categories Grid */}
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="block group"
              >
                <div className="category-card relative bg-gray-900/60 backdrop-blur-lg rounded-xl border border-indigo-500/20 p-6 shadow-lg shadow-indigo-500/5 overflow-hidden transition-all duration-300 hover:border-indigo-500/30 h-full hover:shadow-lg hover:-translate-y-1">
                  <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-br from-indigo-600/10 to-fuchsia-600/10 rounded-bl-full"></div>
                  
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                      <FiFolder className="h-6 w-6 text-indigo-400/80 category-icon" />
                    </div>
                    <FiChevronRight className="h-5 w-5 text-indigo-400/60 arrow-icon" />
                  </div>
                  
                  <h2 className="text-xl font-semibold text-white mb-3 group-hover:text-indigo-400 transition-colors">
                    {category.name}
                  </h2>
                  
                  <p className="text-gray-400 mb-6 line-clamp-2 h-12">
                    {category.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm border-t border-gray-800/60 pt-4 mt-auto">
                    <div className="flex items-center text-gray-400">
                      <div className="h-6 w-6 rounded-full overflow-hidden mr-2 border border-indigo-500/20">
                        {category.creator.image && (
                          <img
                            src={category.creator.image}
                            alt={category.creator.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <span>{category.creator.name}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-400">
                      <FiMessageSquare className="mr-1.5 text-indigo-400" />
                      <span>{category._count.posts} posts</span>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-fuchsia-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
                </div>
              </Link>
            ))}
          </div>
          
          {/* No Results State */}
          {filteredCategories.length === 0 && (
            <div className="text-center py-20">
              <FiSearch className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No categories found</h3>
              <p className="text-gray-400 mb-4">
                No categories match "{searchQuery}". Try different search terms.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}






