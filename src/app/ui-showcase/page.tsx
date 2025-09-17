"use client";

import React from 'react';
import { FiShare, FiBookmark, FiThumbsUp, FiMessageSquare } from 'react-icons/fi';
import toast from '@/lib/toast';
import { FloatingActionButton } from '@/components/ui/fab';

export default function UIShowcase() {
  const showToast = (type: 'success' | 'error' | 'info' | 'warning') => {
    switch (type) {
      case 'success':
        toast.success('This is a success toast message!');
        break;
      case 'error':
        toast.error('This is an error toast message!');
        break;
      case 'info':
        toast.info('This is an info toast message!');
        break;
      case 'warning':
        toast.warning('This is a warning toast message!');
        break;
    }
  };

  const showPromiseToast = () => {
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        const success = Math.random() > 0.5;
        if (success) {
          resolve('Operation completed successfully!');
        } else {
          reject(new Error('Operation failed!'));
        }
      }, 2000);
    });

    toast.promise(promise, {
      loading: 'Loading...',
      success: (data) => `${data}`,
      error: (error) => `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  };

  const fabActions = [
    {
      id: 'share',
      icon: <FiShare />,
      label: 'Share',
      onClick: () => console.log('Share clicked'),
    },
    {
      id: 'bookmark',
      icon: <FiBookmark />,
      label: 'Bookmark',
      onClick: () => console.log('Bookmark clicked'),
    },
    {
      id: 'like',
      icon: <FiThumbsUp />,
      label: 'Like',
      onClick: () => console.log('Like clicked'),
    },
    {
      id: 'comment',
      icon: <FiMessageSquare />,
      label: 'Comment',
      onClick: () => console.log('Comment clicked'),
    },
  ];

  return (
    <main className="min-h-screen py-16 px-4 md:px-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gradient">UI Component Showcase</h1>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Toast Notifications</h2>
        <div className="flex flex-wrap gap-3">
          <button 
            className="btn-modern"
            onClick={() => showToast('success')}
          >
            Success Toast
          </button>
          <button 
            className="btn-modern"
            onClick={() => showToast('error')}
          >
            Error Toast
          </button>
          <button 
            className="btn-modern"
            onClick={() => showToast('info')}
          >
            Info Toast
          </button>
          <button 
            className="btn-modern"
            onClick={() => showToast('warning')}
          >
            Warning Toast
          </button>
          <button 
            className="btn-modern"
            onClick={showPromiseToast}
          >
            Promise Toast
          </button>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Card Styles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card-modern p-6">
            <h3 className="text-lg font-medium mb-2">Modern Card</h3>
            <p className="text-sm text-gray-400">A modern card with subtle backdrop blur and hover effects.</p>
          </div>
          
          <div className="clean-card p-6 rounded-xl">
            <h3 className="text-lg font-medium mb-2">Clean Card</h3>
            <p className="text-sm text-gray-400">A clean card with minimal styling.</p>
          </div>

          <div className="glass-effect p-6 rounded-xl">
            <h3 className="text-lg font-medium mb-2">Glass Effect</h3>
            <p className="text-sm text-gray-400">A card with a glass effect using backdrop blur.</p>
          </div>

          <div className="gradient-card p-6 rounded-xl">
            <h3 className="text-lg font-medium mb-2">Gradient Card</h3>
            <p className="text-sm text-gray-400">A card with a subtle gradient overlay.</p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Typography</h2>
        <div className="space-y-4">
          <h1 className="text-gradient text-4xl font-bold">Gradient Heading</h1>
          <h2 className="text-gradient-secondary text-3xl font-bold">Secondary Gradient Heading</h2>
          <p className="text-lg text-pretty">This is a paragraph with text-pretty class for optimal text wrapping and line-breaking.</p>
          <p className="text-balance">This paragraph uses text-balance to optimize the distribution of text to avoid widows and orphans.</p>
          <a href="#" className="fancy-link">This is a fancy link with hover effect</a>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Animations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="float p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            Float Animation
          </div>
          <div className="float-slow p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            Slow Float Animation
          </div>
          <div className="cursor-blink p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            Cursor Blink|
          </div>
        </div>
      </section>

      {}
      <FloatingActionButton actions={fabActions} />
    </main>
  );
} 