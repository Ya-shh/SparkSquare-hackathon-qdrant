"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FiChevronLeft, FiAlertCircle } from "react-icons/fi";

export default function CreatePostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useState(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setCategory(categoryParam);
    }
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      router.push("/sign-in");
      return;
    }
    
    console.log("Debug - Session object:", session);
    
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    
    if (title.trim().length < 3) {
      setError("Title must be at least 3 characters long");
      return;
    }
    
    if (!content.trim()) {
      setError("Content is required");
      return;
    }
    
    if (content.trim().length < 10) {
      setError("Content must be at least 10 characters long");
      return;
    }
    
    if (!category.trim()) {
      setError("Please enter a category");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Debug - About to create post with:", { title, content, category });
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          category,
        }),
      });
      
      console.log("Debug - Response status:", response.status);
      
      if (!response.ok) {
        try {
          const data = await response.json();
          console.log("Debug - Error response:", data);
          throw new Error(data.error || data.message || "Failed to create post");
        } catch (jsonError) {
          const text = await response.text();
          console.error("Error response not JSON:", text.substring(0, 200) + "...");
          throw new Error(`Server error (${response.status}): Failed to create post`);
        }
      }
      
      const data = await response.json();
      console.log("Debug - Success response:", data);
      router.push(`/posts/${data.post.id}`);
    } catch (err) {
      console.error("Error creating post:", err);
      setError(err instanceof Error ? err.message : "Failed to create post. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4 mx-auto"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4 mx-auto"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Sign in Required
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You need to be signed in to create a post.
          </p>
          <Link
            href="/sign-in"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md text-sm font-medium"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          <FiChevronLeft className="w-4 h-4 mr-1" />
          Back to Home
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Create a New Post
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-start">
              <FiAlertCircle className="text-red-600 dark:text-red-400 w-5 h-5 mr-3 mt-0.5" />
              <div className="text-red-600 dark:text-red-400">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                minLength={3}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Minimum 3 characters
              </p>
            </div>

            <div className="mb-6">
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Category
              </label>
              <input
                type="text"
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Enter a category (e.g., Technology, Health, Sports)"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Create your own category or use an existing one
              </p>
            </div>

            <div className="mb-6">
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post content here..."
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={10}
                required
                minLength={10}
              ></textarea>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                You can use markdown formatting in your post. Minimum 10 characters.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md text-sm font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Creating Post...
                  </>
                ) : (
                  "Create Post"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 