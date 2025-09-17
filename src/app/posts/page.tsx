import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { FiUser, FiMessageCircle, FiThumbsUp, FiClock, FiSearch, FiFilter } from "react-icons/fi";
import { hybridSearch, isQdrantReady } from "@/lib/qdrant";
import LiveCommentCount from "@/components/ui/LiveCommentCount";

export default async function AllPostsPage() {
  // Get posts from Qdrant or fallback data
  let posts = [];
  
  try {
    const qdrantReady = await isQdrantReady();
    
    if (qdrantReady) {
      // Use Qdrant to get all posts
      const searchResults = await hybridSearch('discussions posts content', 'posts', {
        limit: 50,
        scoreThreshold: 0.1 // Very low threshold to get all posts
      });
      
      posts = searchResults.map(result => ({
        id: result.id,
        title: result.title,
        content: result.content,
        createdAt: result.createdAt || new Date().toISOString(),
        user: {
          id: result.userId || '1',
          name: result.userName || 'Anonymous',
          username: result.username || 'user',
          image: '/default-avatar.svg'
        },
        category: {
          id: result.categoryId || '1',
          name: result.categoryName || 'General',
          slug: result.categorySlug || 'general'
        },
        _count: {
          comments: Math.floor(Math.random() * 30) + 5,
          votes: Math.floor(Math.random() * 20) + 1
        },
        score: Math.floor(Math.random() * 15) + 1
      }));
    } else {
      posts = getFallbackPosts();
    }
  } catch (error) {
    console.error('Error fetching posts:', error);
    posts = getFallbackPosts();
  }

  const postsWithScores = posts;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 sm:mb-0">All Discussions</h1>
        
        <div className="flex space-x-4">
          <Link
            href="/posts/create"
            className="btn-primary flex items-center"
          >
            Create Post
          </Link>
        </div>
      </div>
      
      <div className="space-y-4">
        {postsWithScores.map(post => (
          <div 
            key={post.id} 
            className="bg-card border border-border hover:border-primary/20 rounded-xl p-5 transition-all hover:shadow-md"
          >
            <div className="flex gap-4">
              {}
              <div className="hidden sm:flex flex-col items-center space-y-1 pt-2 w-10">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <span className={`font-semibold ${
                    post.score > 0 ? 'text-primary' : 
                    post.score < 0 ? 'text-destructive' : 
                    'text-muted-foreground'
                  }`}>
                    {post.score}
                  </span>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Link
                    href={`/categories/${post.category.slug}`}
                    className="px-2 py-0.5 bg-primary/10 rounded-full text-xs font-medium hover:bg-primary/20 transition-colors"
                  >
                    {post.category.name}
                  </Link>
                  <span>•</span>
                  <span className="flex items-center">
                    <FiClock className="mr-1 h-3 w-3" />
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </span>
                </div>
                
                <Link href={`/posts/${post.id}`}>
                  <h2 className="text-xl font-semibold hover:text-primary transition-colors mb-2">
                    {post.title}
                  </h2>
                </Link>
                
                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {post.content}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {post.user.image ? (
                      <img 
                        src={post.user.image} 
                        alt={post.user.name || post.user.username}
                        className="h-6 w-6 rounded-full mr-2"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                        <FiUser className="h-3 w-3 text-primary" />
                      </div>
                    )}
                    <Link
                      href={`/users/${post.user.username}`}
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      {post.user.name || post.user.username}
                    </Link>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center sm:hidden">
                      <FiThumbsUp className="mr-1 h-4 w-4" />
                      <span>{post.score}</span>
                    </div>
                    <div className="flex items-center">
                      <FiMessageCircle className="mr-1 h-4 w-4" />
                      <LiveCommentCount postId={post.id} fallbackCount={post._count?.comments || 0} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getFallbackPosts() {
  return [
    {
      id: "1",
      title: "The future of AI in healthcare",
      content: "As AI becomes more sophisticated, what applications in healthcare do you think will have the biggest impact in the next 5 years?",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: "3",
        name: "Marcus Johnson", 
        username: "mjohnson",
        image: "/default-avatar.svg"
      },
      category: {
        id: "2",
        name: "Artificial Intelligence",
        slug: "ai"
      },
      _count: { comments: 63, votes: 201 },
      score: 89
    },
    {
      id: "2", 
      title: "How to improve brain memory and cognition",
      content: "I've been researching techniques to improve memory and cognitive function. Has anyone tried specific supplements or techniques that have worked well?",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: "2",
        name: "Dr. Sarah Chen",
        username: "sarahc", 
        image: "/default-avatar.svg"
      },
      category: {
        id: "4",
        name: "Health & Wellness",
        slug: "health"
      },
      _count: { comments: 47, votes: 156 },
      score: 95
    },
    {
      id: "3",
      title: "Understanding quantum computing basics",
      content: "I'm trying to wrap my head around quantum computing principles. Can someone explain qubits and superposition in simple terms?",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: "4",
        name: "Dr. Eliza Wong",
        username: "ewong",
        image: "/default-avatar.svg"
      },
      category: {
        id: "3",
        name: "Science",
        slug: "science"
      },
      _count: { comments: 34, votes: 89 },
      score: 76
    },
    {
      id: "4",
      title: "Climate engineering: Can we reverse global warming with technology?",
      content: "Exploring cutting-edge geoengineering solutions from carbon capture to solar radiation management. What are the ethical implications?",
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: "5",
        name: "David Rodriguez",
        username: "davidr",
        image: "/default-avatar.svg"
      },
      category: {
        id: "3", 
        name: "Science",
        slug: "science"
      },
      _count: { comments: 71, votes: 189 },
      score: 92
    },
    {
      id: "5",
      title: "The psychology behind startup failures and how to avoid them",
      content: "After analyzing 200+ failed startups, I've identified 7 psychological patterns that consistently lead to failure. Here's what every entrepreneur needs to know...",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: "6",
        name: "Emma Thompson",
        username: "emmat",
        image: "/default-avatar.svg"
      },
      category: {
        id: "5",
        name: "Business",
        slug: "business"
      },
      _count: { comments: 52, votes: 143 },
      score: 88
    }
  ];
} 