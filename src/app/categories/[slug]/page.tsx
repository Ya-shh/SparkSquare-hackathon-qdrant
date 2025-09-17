import Link from "next/link";
import { FiTag, FiUser, FiMessageSquare, FiCalendar, FiChevronRight } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import UserLink from "@/components/ui/UserLink";
import LiveCommentCount from "@/components/ui/LiveCommentCount";

function ensureEnglishContent(content: string): string {
  const latinPhrases = [
    'lorem ipsum', 'dolor sit amet', 'consectetur adipiscing', 'eiusmod tempor', 
    'incididunt ut labore', 'magna aliqua', 'quis nostrud', 'exercitation ullamco',
    'duis aute', 'irure dolor', 'reprehenderit in', 'voluptate velit', 'esse cillum',
    'fugiat nulla', 'pariatur', 'excepteur sint', 'occaecat cupidatat', 'sunt in culpa',
    'officia deserunt', 'mollit anim', 'laborum', 'sed do', 'tempor incididunt',
  ];
  
  let newContent = content;
  
  const containsLatin = latinPhrases.some(phrase => content.toLowerCase().includes(phrase));
  
  if (containsLatin) {
    return "This post discusses key insights and recent developments in this field. The author shares personal experiences and research findings that contribute to our understanding of the topic. Several examples are provided to illustrate main points, along with references to relevant studies and expert opinions. The community is encouraged to engage with these ideas and share their own perspectives.";
  }
  
  return newContent;
}

function ensureEnglishTitle(title: string): string {
  const latinWords = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit'];
  
  const containsLatin = latinWords.some(word => 
    title.toLowerCase().split(/\s+/).includes(word)
  );
  
  if (containsLatin) {
    return "Important Discussion on This Topic";
  }
  
  return title;
}

const MOCK_CATEGORIES = {
  technology: {
    id: '1',
    name: 'Technology',
    slug: 'technology',
    description: 'Discuss the latest in AI, software development, hardware, and tech innovations that are shaping our future.',
    creator: { name: 'Marcus Johnson', username: 'mjohnson', image: 'https://randomuser.me/api/portraits/men/42.jpg' },
    _count: { posts: 42 },
  },
  science: {
    id: '2',
    name: 'Science',
    slug: 'science',
    description: 'Explore scientific discoveries, physics, chemistry, biology, astronomy, and the mysteries of our universe.',
    creator: { name: 'Eliza Wong', username: 'ewong', image: 'https://randomuser.me/api/portraits/women/56.jpg' },
    _count: { posts: 36 },
  },
  health: {
    id: '3',
    name: 'Health & Wellness',
    slug: 'health',
    description: 'Share knowledge on physical and mental health, nutrition, fitness, mindfulness, and personal well-being.',
    creator: { name: 'Sarah Chen', username: 'sarahc', image: 'https://randomuser.me/api/portraits/women/23.jpg' },
    _count: { posts: 29 },
  },
  philosophy: {
    id: '4',
    name: 'Philosophy',
    slug: 'philosophy',
    description: 'Delve into philosophical questions, ethics, metaphysics, and the fundamental nature of knowledge and reality.',
    creator: { name: 'Ryan Barnes', username: 'rbarnes', image: 'https://randomuser.me/api/portraits/men/32.jpg' },
    _count: { posts: 24 },
  },
  art: {
    id: '5',
    name: 'Art & Culture',
    slug: 'art',
    description: 'Discuss visual arts, music, literature, film, cultural expressions, and creative pursuits across mediums.',
    creator: { name: 'Mira Patel', username: 'mpatel', image: 'https://randomuser.me/api/portraits/women/67.jpg' },
    _count: { posts: 31 },
  },
  education: {
    id: '6',
    name: 'Education',
    slug: 'education',
    description: 'Exchange ideas on learning methodologies, educational resources, academic research, and knowledge sharing.',
    creator: { name: 'Alex Parker', username: 'aparker', image: 'https://randomuser.me/api/portraits/men/64.jpg' },
    _count: { posts: 18 },
  }
};

const MOCK_POSTS = {
  technology: [
    {
      id: '2',
      title: 'The future of AI in healthcare',
      content: "As AI becomes more sophisticated, what applications in healthcare do you think will have the biggest impact in the next 5 years?",
      createdAt: new Date('2023-10-15T14:23:00'),
      author: { name: 'Marcus Johnson', username: 'mjohnson', image: 'https://randomuser.me/api/portraits/men/42.jpg' },
      _count: { comments: 2 }
    },
    {
      id: 'ew3',
      title: 'The practical applications of quantum computing today',
      content: "While universal quantum computers are still developing, specialized quantum systems are already solving real problems in optimization, materials science, and cryptography.",
      createdAt: new Date('2023-09-05T09:45:00'),
      author: { name: 'Dr. Eliza Wong', username: 'ewong', image: 'https://randomuser.me/api/portraits/women/56.jpg' },
      _count: { comments: 1 }
    },
    {
      id: 't1',
      title: 'The Future of Artificial Intelligence in Everyday Life',
      content: 'As AI continues to evolve, we\'re seeing unprecedented integration into daily activities. From smart home devices to predictive text, AI is becoming an invisible but essential part of how we interact with technology.',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      author: { name: 'Alex Rivera', username: 'arivera', image: 'https://randomuser.me/api/portraits/men/22.jpg' },
      _count: { comments: 24 }
    },
    {
      id: 't2',
      title: 'Quantum Computing: Current State and Future Applications',
      content: 'Quantum computing has made significant strides in recent years. What practical applications do you foresee in the next decade?',
      createdAt: new Date('2023-10-10T09:45:00'),
      author: { name: 'Dr. Eliza Wong', username: 'ewong', image: 'https://randomuser.me/api/portraits/women/56.jpg' },
      _count: { comments: 22 }
    }
  ],
  science: [
    {
      id: '3',
      title: 'Understanding quantum computing basics',
      content: "I'm trying to wrap my head around quantum computing principles. Can someone explain qubits and superposition in simple terms?",
      createdAt: new Date('2023-10-10T09:45:00'),
      author: { name: 'Dr. Eliza Wong', username: 'ewong', image: 'https://randomuser.me/api/portraits/women/56.jpg' },
      _count: { comments: 1 }
    },
    {
      id: 'ew2',
      title: 'Quantum entanglement explained simply',
      content: "Einstein called it 'spooky action at a distance,' but quantum entanglement is a foundational concept that can be understood through the right analogies and examples.",
      createdAt: new Date('2023-09-20T09:45:00'),
      author: { name: 'Dr. Eliza Wong', username: 'ewong', image: 'https://randomuser.me/api/portraits/women/56.jpg' },
      _count: { comments: 1 }
    },
    {
      id: 's1',
      title: 'Recent Breakthroughs in Astrophysics',
      content: 'The James Webb Space Telescope is revolutionizing our understanding of distant galaxies and exoplanets. This post summarizes some of the most exciting recent discoveries.',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      author: { name: 'Dr. Eliza Wong', username: 'ewong', image: 'https://randomuser.me/api/portraits/women/56.jpg' },
      _count: { comments: 27 }
    }
  ],
  health: [
    {
      id: '1',
      title: 'How to improve brain memory and cognition',
      content: "I've been researching techniques to improve memory and cognitive function. Has anyone tried specific supplements or techniques that have worked well?",
      createdAt: new Date('2023-10-17T09:15:00'),
      author: { name: 'Dr. Sarah Chen', username: 'sarahc', image: 'https://randomuser.me/api/portraits/women/23.jpg' },
      _count: { comments: 3 }
    },
    {
      id: 'h1',
      title: 'Mindfulness Practices for Reducing Anxiety',
      content: 'This post explores evidence-based mindfulness techniques that can help manage anxiety and improve overall mental well-being in our increasingly stressful world.',
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      author: { name: 'Sarah Chen', username: 'sarahc', image: 'https://randomuser.me/api/portraits/women/23.jpg' },
      _count: { comments: 19 }
    },
    {
      id: 'h2',
      title: 'Nutrition Myths Debunked: What Science Really Says',
      content: 'There\'s a lot of conflicting information about nutrition. This post examines popular claims and compares them with the current scientific consensus.',
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      author: { name: 'Michael Torres', username: 'mtorres', image: 'https://randomuser.me/api/portraits/men/91.jpg' },
      _count: { comments: 23 }
    }
  ],
  philosophy: [
    {
      id: '4',
      title: 'The philosophy of consciousness',
      content: 'How do different philosophical traditions approach the concept of consciousness? Looking for reading recommendations and perspectives on Eastern vs Western views.',
      createdAt: new Date('2023-10-11T14:35:00'),
      author: { name: 'Ryan Barnes', username: 'rbarnes', image: 'https://randomuser.me/api/portraits/men/32.jpg' },
      _count: { comments: 42 }
    },
    {
      id: 'p2',
      title: 'Ethics in the Age of AI',
      content: 'As artificial intelligence becomes more prevalent, we must consider the ethical implications. What moral frameworks should guide AI development and deployment?',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      author: { name: 'Ryan Barnes', username: 'rbarnes', image: 'https://randomuser.me/api/portraits/men/32.jpg' },
      _count: { comments: 31 }
    }
  ],
  art: [
    {
      id: '5',
      title: 'Digital art techniques for beginners',
      content: 'Starting your digital art journey? Here are the essential techniques and tools every beginner should know, from basic brush work to color theory.',
      createdAt: new Date('2023-10-08T11:20:00'),
      author: { name: 'Mira Patel', username: 'mpatel', image: 'https://randomuser.me/api/portraits/women/67.jpg' },
      _count: { comments: 18 }
    },
    {
      id: 'a2',
      title: 'The Renaissance of Street Art',
      content: 'Street art has evolved from simple graffiti to complex artistic expressions. This post explores how urban art is reshaping our cities and cultural landscape.',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      author: { name: 'Mira Patel', username: 'mpatel', image: 'https://randomuser.me/api/portraits/women/67.jpg' },
      _count: { comments: 25 }
    }
  ],
  education: [
    {
      id: 'ed1',
      title: 'The Future of Online Learning',
      content: 'Online education has transformed dramatically in recent years. This post examines emerging trends and technologies that will shape the future of remote learning.',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      author: { name: 'Alex Parker', username: 'aparker', image: 'https://randomuser.me/api/portraits/men/64.jpg' },
      _count: { comments: 16 }
    },
    {
      id: 'ed2',
      title: 'Teaching Critical Thinking in the Digital Age',
      content: 'With information overload and misinformation prevalent online, teaching critical thinking skills has never been more important. Here are practical strategies for educators.',
      createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      author: { name: 'Alex Parker', username: 'aparker', image: 'https://randomuser.me/api/portraits/men/64.jpg' },
      _count: { comments: 28 }
    }
  ]
};

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const category = MOCK_CATEGORIES[slug as keyof typeof MOCK_CATEGORIES];
  
  const posts = MOCK_POSTS[slug as keyof typeof MOCK_POSTS] || [];

  // Fetch real comment counts for each post (from API) to avoid mock mismatches
  const postsWithCounts = await Promise.all(
    posts.map(async (post) => {
      try {
        const res = await fetch(`/api/posts/${post.id}/comments?limit=1`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const realCount = data?.meta?.total ?? post._count?.comments ?? 0;
          return { ...post, _count: { ...(post._count || {}), comments: realCount } };
        }
      } catch {}
      return { ...post, _count: { ...(post._count || {}), comments: post._count?.comments ?? 0 } };
    })
  );

  if (!category) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-3xl font-bold text-white mb-4">Category Not Found</h1>
          <p className="text-gray-400 mb-8">We couldn't find the category you're looking for.</p>
          <Link 
            href="/categories"
            className="inline-flex items-center px-5 py-2 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            <FiChevronRight className="mr-2 h-5 w-5" />
            Back to Categories
          </Link>
        </div>
      </div>
    );
  }

  const realPostsCount = postsWithCounts.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto pt-8 pb-16 px-4 sm:px-6">
        {}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl opacity-20"></div>
        
        {}
        <div className="relative mb-12">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <div>
                  <div className="flex items-center mb-4">
                    <Link 
                      href="/" 
                      className="text-indigo-400 hover:text-indigo-300 mr-2 transition-colors"
                    >
                      Home
                    </Link>
                    <FiChevronRight className="h-4 w-4 text-gray-500 mx-1" />
                    <Link 
                      href="/categories" 
                      className="text-indigo-400 hover:text-indigo-300 mr-2 transition-colors"
                    >
                      Categories
                    </Link>
                    <FiChevronRight className="h-4 w-4 text-gray-500 mx-1" />
                    <span className="text-gray-300">{category.name}</span>
                  </div>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-500 bg-clip-text text-transparent">
                  {category.name}
                </span>
              </h1>
              
              <p className="text-gray-400 max-w-3xl mb-6">
                {category.description}
              </p>
              
              <div className="flex items-center text-sm text-gray-500">
                <div className="flex items-center mr-6">
                  <FiUser className="mr-2 text-indigo-400" />
                  <span>Created by </span>
                  <UserLink
                    username={category.creator.username}
                    name={category.creator.name}
                    className="ml-1"
                  />
                </div>
                
                <div className="flex items-center">
                  <FiMessageSquare className="mr-2 text-indigo-400" />
                  <span>{realPostsCount} posts</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-3">
              <Link
                href={`/?category=${category.slug}`}
                className="inline-flex items-center px-4 py-2 rounded-full bg-gray-700 text-gray-200 font-medium hover:bg-gray-600 transition-colors border border-gray-600"
              >
                <FiChevronRight className="mr-2 h-4 w-4 rotate-180" />
                View on Homepage
              </Link>
              <Link
                href={`/posts/create?category=${category.slug}`}
                className="inline-flex items-center px-5 py-2.5 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
              >
                Create New Post
              </Link>
            </div>
          </div>
          
          <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-full opacity-50"></div>
        </div>
        
        {}
        {postsWithCounts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {postsWithCounts.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="block group"
              >
                <div className="post-card relative bg-gray-900/60 backdrop-blur-sm border border-indigo-500/10 rounded-xl p-6 transition-all duration-300 hover:border-indigo-500/30 hover:shadow-lg hover:-translate-y-1">
                  <h2 className="text-xl font-semibold text-white mb-3 group-hover:text-indigo-400 transition-colors">
                    {ensureEnglishTitle(post.title)}
                  </h2>
                  
                  <p className="text-gray-400 mb-6 line-clamp-2">
                    {ensureEnglishContent(post.content)}
                  </p>
                  
                  <div className="flex flex-wrap items-center justify-between text-sm">
                    <div className="flex items-center mb-2 sm:mb-0">
                      <div className="h-8 w-8 rounded-full overflow-hidden mr-2 border border-indigo-500/20">
                        {post.author.image && (
                          <img
                            src={post.author.image}
                            alt={post.author.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <UserLink 
                        username={post.author.username}
                        name={post.author.name}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-4 text-gray-500">
                      <div className="flex items-center">
                        <FiCalendar className="mr-1.5 text-indigo-400" />
                        <span>{formatDistanceToNow(post.createdAt)} ago</span>
                      </div>
                      
                      <div className="flex items-center">
                        <FiMessageSquare className="mr-1.5 text-indigo-400" />
                        <LiveCommentCount postId={post.id} fallbackCount={post._count?.comments || 0} />
                        <span className="ml-1">comments</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="h-16 w-16 text-gray-500 mx-auto mb-4">
              <FiMessageSquare className="h-full w-full" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
            <p className="text-gray-400 mb-6">Be the first to start a conversation in this category</p>
            <Link
              href={`/posts/create?category=${category.slug}`}
              className="inline-flex items-center px-5 py-2.5 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
            >
              Create New Post
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 