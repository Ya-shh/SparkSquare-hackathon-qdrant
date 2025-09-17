import Link from "next/link";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { FiArrowLeft, FiClock, FiMessageCircle, FiThumbsUp, FiThumbsDown, FiShare2, FiBookmark, FiFolder } from "react-icons/fi";
import EnhancedCommentSection from "@/components/EnhancedCommentSection";
import { findSimilarPostsByPostId } from "@/lib/qdrant";
import ThreadDiscussion from "@/components/ThreadDiscussion";
import VoteButtons from "@/components/VoteButtons";
import BookmarkButton from "@/components/BookmarkButton";
import ShareButton from "@/components/ShareButton";
import CommentSection from "@/components/CommentSection";
import UserProfilePopover from "@/components/UserProfilePopover";
import ReactionsDisplay from "@/components/ReactionsDisplay";
import React from "react";

type PostPageProps = {
  params: {
    id: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
};

const getEnglishContent = (content: string): string => {
  const latinWords = [
    "lorem ipsum", "vivo", "amet", "confido", "sonitus", "vicinus", "denego", "socius", "cruentus", "ipsum", 
    "dolore", "magna", "consectetur", "adipiscing", "elit", "quis", "coma", "arguo", "enim", "conscendo", 
    "causa", "victus", "cubicularis", "deinde", "toties", "cunctatio", "approbo", "copia", "deripio", "vita", 
    "canonicus", "compello", "audio", "venio", "vilis", "nesciunt", "aureus", "creator", "ara", "basium", 
    "derideo", "officia", "commemoro", "tamquam", "auxilium", "deludo", "reiciendis", "laboriosam", "sapiente", 
    "vesco", "desidero", "tactus", "decimus", "spoliatio", "deserunt", "conservo", "autus", "despecto", "apud", 
    "consequatur", "vis", "videlicet", "aggero", "dens", "aperio", "triduana", "cometes", "adeptio", "amplus",
    "crepusculum", "verto", "aestus", "amiculum", "debitis", "ubi", "aeger", "consequuntur", "abstergo", 
    "vilicus", "aequus", "celebrer", "tabella", "bibo", "balbus", "trepide", "allatus", "ater", "verumtamen",
    "degero", "umerus", "ventito", "crebro", "dicta", "utrimque", "supellex"
  ];
  
  const contentLower = content.toLowerCase();
  const hasLatinWords = latinWords.some(word => contentLower.includes(word));
  
  if (hasLatinWords || !content) {
    const englishDescriptions = [
      "This thread explores innovative approaches to modern technology and their impact on society. With a focus on practical applications and real-world examples, the discussion aims to provide valuable insights for both beginners and experts in the field.",
      "In this discussion, we're analyzing recent scientific breakthroughs and their potential implications. The evidence presented suggests significant advances that could reshape our understanding of fundamental principles.",
      "An in-depth analysis of current market trends and their impact on small businesses. This thread examines strategic approaches to navigating economic challenges while maintaining sustainable growth.",
      "This health-focused thread covers recent medical research and wellness practices. The discussion includes evidence-based approaches to improving physical and mental wellbeing in today's fast-paced world.",
      "A celebration of cultural expression across various art forms. This thread explores the intersection of traditional and contemporary artistic movements and their reflection of societal values.",
      "This educational resource thread compiles valuable learning materials and pedagogical approaches. The discussion emphasizes accessible, effective methods for diverse learning environments.",
      "An exploration of gaming culture, mechanics, and industry developments. This thread discusses both technical aspects and social implications of modern gaming experiences.",
      "This discussion analyzes current political events and policy implications. The thread maintains a balanced perspective while examining various viewpoints on complex issues."
    ];
    return englishDescriptions[Math.floor(Math.random() * englishDescriptions.length)];
  }
  return content;
};

const getEnglishTitle = (title: string): string => {
  const latinWords = [
    "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "vivo", "confido", 
    "sonitus", "denego", "socius", "enim", "conscendo", "causa", "victus", "cubicularis", "deinde", 
    "toties", "cunctatio", "approbo", "copia", "deripio", "vita", "canonicus", "compello", "audio", 
    "venio", "vilis", "nesciunt", "aureus", "creator", "ara", "basium", "derideo", "officia", "commemoro", 
    "tamquam", "auxilium", "deludo", "reiciendis", "laboriosam", "sapiente", "vesco", "desidero", "tactus", 
    "decimus", "spoliatio", "deserunt", "conservo", "autus", "despecto", "apud", "consequatur", "vis", 
    "videlicet", "magnam", "canto", "advenio", "atrox", "degero", "umerus", "facere", "ventito", "crebro",
    "dicta", "utrimque", "supellex", "bibo", "aggero", "aperio"
  ];
  
  const titleLower = title.toLowerCase();
  const hasLatinWords = latinWords.some(word => titleLower.includes(word));
  
  if (hasLatinWords || !title) {
    const englishTitles = [
      "The Future of AI in Everyday Applications",
      "Recent Breakthroughs in Quantum Computing",
      "Sustainable Business Practices for the Modern Economy",
      "Evidence-Based Approaches to Mental Wellness",
      "The Evolution of Digital Art in Contemporary Culture",
      "Innovative Teaching Methods for Online Learning",
      "How Game Design Influences Player Experience",
      "Understanding Global Economic Trends",
      "What makes mainstream games so addictive?",
      "The psychology behind popular game mechanics",
      "Exploring the impact of art direction in modern games",
      "The future of cross-platform gaming experiences",
      "How indie developers are changing the industry"
    ];
    return englishTitles[Math.floor(Math.random() * englishTitles.length)];
  }
  return title;
};

const MOCK_POSTS = {
  // Primary numeric IDs (main posts)
  '1': {
    id: '1',
    title: 'How to improve brain memory and cognition',
    content: "I've been researching techniques to improve memory and cognitive function. Has anyone tried specific supplements or techniques that have worked well?",
    createdAt: new Date('2023-10-17T09:15:00').toISOString(),
    user: { 
      id: 'sarahc', 
      name: 'Sarah Chen', 
      username: 'sarahc',
      image: 'https://randomuser.me/api/portraits/women/23.jpg',
    },
    category: { 
      id: '3', 
      name: 'Health & Wellness', 
      slug: 'health' 
    },
    categoryId: '3',
    _count: { comments: 3, votes: 78 },
    votes: [{value: 1}, {value: 1}, {value: 1}, {value: 1}],
    viewCount: 342
  },
  '2': {
    id: '2',
    title: 'The future of AI in healthcare',
    content: "As AI becomes more sophisticated, what applications in healthcare do you think will have the biggest impact in the next 5 years?",
    createdAt: new Date('2023-10-15T14:23:00').toISOString(),
    user: { 
      id: 'mjohnson', 
      name: 'Marcus Johnson', 
      username: 'mjohnson',
      image: 'https://randomuser.me/api/portraits/men/42.jpg',
    },
    category: { 
      id: '1', 
      name: 'Technology', 
      slug: 'technology' 
    },
    categoryId: '1',
    _count: { comments: 2, votes: 92 },
    votes: [{value: 1}, {value: 1}, {value: 1}],
    viewCount: 527
  },
  '3': {
    id: '3',
    title: 'Understanding quantum computing basics',
    content: "I'm trying to wrap my head around quantum computing principles. Can someone explain qubits and superposition in simple terms?",
    createdAt: new Date('2023-10-10T09:45:00').toISOString(),
    user: { 
      id: 'ewong', 
      name: 'Eliza Wong', 
      username: 'ewong',
      image: 'https://randomuser.me/api/portraits/women/56.jpg',
    },
    category: { 
      id: '2', 
      name: 'Science', 
      slug: 'science' 
    },
    categoryId: '2',
    _count: { comments: 1, votes: 45 },
    votes: [{value: 1}, {value: 1}, {value: 1}, {value: 1}],
    viewCount: 289
  },
  '4': {
    id: '4',
    title: 'The philosophy of consciousness',
    content: "How do different philosophical traditions approach the concept of consciousness? Looking for reading recommendations and perspectives on Eastern vs Western views.",
    createdAt: new Date('2023-10-11T14:35:00').toISOString(),
    user: { 
      id: 'rbarnes', 
      name: 'Ryan Barnes', 
      username: 'rbarnes',
      image: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    category: { 
      id: '4', 
      name: 'Philosophy', 
      slug: 'philosophy' 
    },
    categoryId: '4',
    _count: { comments: 42, votes: 67 },
    votes: [{value: 1}, {value: 1}, {value: 1}],
    viewCount: 398
  },
  '5': {
    id: '5',
    title: 'Digital art techniques for beginners',
    content: "I'm just starting with digital art. What software and techniques would you recommend for someone completely new to the medium?",
    createdAt: new Date('2023-10-10T16:42:00').toISOString(),
    user: { 
      id: 'mpatel', 
      name: 'Maya Patel', 
      username: 'mpatel',
      image: 'https://randomuser.me/api/portraits/women/33.jpg',
    },
    category: { 
      id: '5', 
      name: 'Art & Culture', 
      slug: 'art' 
    },
    categoryId: '5',
    _count: { comments: 29, votes: 53 },
    votes: [{value: 1}, {value: 1}],
    viewCount: 267
  },
  
  // Science IDs (s1, s2, etc.)
  's1': {
    id: 's1',
    title: 'Latest breakthroughs in neuroscience research',
    content: "Recent studies have shown fascinating insights into brain plasticity and neural networks. What are your thoughts on the implications for cognitive enhancement?",
    createdAt: new Date('2023-10-12T11:20:00').toISOString(),
    user: { 
      id: 'drneuro', 
      name: 'Dr. Neural Networks', 
      username: 'drneuro',
      image: 'https://randomuser.me/api/portraits/men/55.jpg',
    },
    category: { 
      id: '2', 
      name: 'Science', 
      slug: 'science' 
    },
    categoryId: '2',
    _count: { comments: 1, votes: 89 },
    votes: [{value: 1}, {value: 1}, {value: 1}],
    viewCount: 456
  },
  's2': {
    id: 's2',
    title: 'Climate science and renewable energy solutions',
    content: "Exploring the latest research in climate science and sustainable energy technologies. What innovations do you think will make the biggest impact?",
    createdAt: new Date('2023-10-13T08:45:00').toISOString(),
    user: { 
      id: 'climatesci', 
      name: 'Dr. Climate Science', 
      username: 'climatesci',
      image: 'https://randomuser.me/api/portraits/women/47.jpg',
    },
    category: { 
      id: '2', 
      name: 'Science', 
      slug: 'science' 
    },
    categoryId: '2',
    _count: { comments: 28, votes: 72 },
    votes: [{value: 1}, {value: 1}],
    viewCount: 389
  },
  
  // Technology IDs (t1, t2, etc.) - Keep existing ones
  't1': {
    id: 't1',
    title: 'The Future of AI in Healthcare',
    content: "As AI becomes more sophisticated, what applications in healthcare do you think will have the biggest impact in the next 5 years?",
    createdAt: new Date('2023-10-15T14:23:00').toISOString(),
    user: { 
      id: 'mjohnson', 
      name: 'Marcus Johnson', 
      username: 'mjohnson',
      image: 'https://randomuser.me/api/portraits/men/42.jpg',
    },
    category: { 
      id: '1', 
      name: 'Technology', 
      slug: 'technology' 
    },
    categoryId: '1',
    _count: { comments: 36, votes: 92 },
    votes: [{value: 1}, {value: 1}, {value: 1}],
    viewCount: 527
  },
  't2': {
    id: 't2',
    title: 'Quantum Computing: Current State and Future Applications',
    content: "Quantum computing has made significant strides in recent years. What practical applications do you foresee in the next decade?",
    createdAt: new Date('2023-10-10T09:45:00').toISOString(),
    user: { 
      id: 'ewong', 
      name: 'Eliza Wong', 
      username: 'ewong',
      image: 'https://randomuser.me/api/portraits/women/56.jpg',
    },
    category: { 
      id: '2', 
      name: 'Science', 
      slug: 'science' 
    },
    categoryId: '2',
    _count: { comments: 22, votes: 76 },
    votes: [{value: 1}, {value: 1}, {value: 1}, {value: 1}],
    viewCount: 384
  },
  
  // Health IDs (h1, h2, etc.)
  'h1': {
    id: 'h1',
    title: 'How to Improve Brain Memory and Cognition',
    content: "I've been researching techniques to improve memory and cognitive function. Has anyone tried specific supplements or techniques that have worked well?",
    createdAt: new Date('2023-10-17T09:15:00').toISOString(),
    user: { 
      id: 'sarahc', 
      name: 'Sarah Chen', 
      username: 'sarahc',
      image: 'https://randomuser.me/api/portraits/women/23.jpg',
    },
    category: { 
      id: '3', 
      name: 'Health & Wellness', 
      slug: 'health' 
    },
    categoryId: '3',
    _count: { comments: 24, votes: 78 },
    votes: [{value: 1}, {value: 1}, {value: 1}, {value: 1}],
    viewCount: 342
  },
  'h2': {
    id: 'h2',
    title: 'The science of neuroplasticity',
    content: "Our brains continue to change throughout our lives. Understanding neuroplasticity can help you harness your brain's natural ability to rewire itself and improve cognitive function.",
    createdAt: new Date('2023-09-28T13:30:00').toISOString(),
    user: { 
      id: 'sarahc', 
      name: 'Sarah Chen', 
      username: 'sarahc',
      image: 'https://randomuser.me/api/portraits/women/23.jpg',
    },
    category: { 
      id: '2', 
      name: 'Science', 
      slug: 'science' 
    },
    categoryId: '2',
    _count: { comments: 1, votes: 65 },
    votes: [{value: 1}, {value: 1}, {value: 1}],
    viewCount: 321
  },
  'h3': {
    id: 'h3',
    title: 'Memory enhancement techniques backed by research',
    content: "Memory champions use specific techniques that leverage how our brains naturally store information. Let's explore these methods and how you can apply them to improve your own memory.",
    createdAt: new Date('2023-09-10T13:30:00').toISOString(),
    user: { 
      id: 'sarahc', 
      name: 'Sarah Chen', 
      username: 'sarahc',
      image: 'https://randomuser.me/api/portraits/women/23.jpg',
    },
    category: { 
      id: '3', 
      name: 'Health & Wellness', 
      slug: 'health' 
    },
    categoryId: '3',
    _count: { comments: 1, votes: 92 },
    votes: [{value: 1}, {value: 1}, {value: 1}, {value: 1}],
    viewCount: 456
  },
  
  // Marcus Johnson's additional posts
  'mj2': {
    id: 'mj2',
    title: 'Breaking down machine learning algorithms for medical diagnostics',
    content: "Machine learning models are becoming increasingly accurate at diagnosing certain conditions. Let's explore how these systems work and their potential impact on healthcare delivery.",
    createdAt: new Date('2023-09-18T14:23:00').toISOString(),
    user: { 
      id: 'mjohnson', 
      name: 'Marcus Johnson', 
      username: 'mjohnson',
      image: 'https://randomuser.me/api/portraits/men/42.jpg',
    },
    category: { 
      id: '2', 
      name: 'Science', 
      slug: 'science' 
    },
    categoryId: '2',
    _count: { comments: 1, votes: 75 },
    votes: [{value: 1}, {value: 1}, {value: 1}],
    viewCount: 398
  },
  'mj3': {
    id: 'mj3',
    title: 'Ethics in medical AI development',
    content: "When AI makes medical decisions, ethical considerations become paramount. We need robust frameworks to ensure patient welfare remains the priority while leveraging AI's diagnostic capabilities.",
    createdAt: new Date('2023-08-29T14:23:00').toISOString(),
    user: { 
      id: 'mjohnson', 
      name: 'Marcus Johnson', 
      username: 'mjohnson',
      image: 'https://randomuser.me/api/portraits/men/42.jpg',
    },
    category: { 
      id: '1', 
      name: 'Technology', 
      slug: 'technology' 
    },
    categoryId: '1',
    _count: { comments: 1, votes: 83 },
    votes: [{value: 1}, {value: 1}, {value: 1}, {value: 1}],
    viewCount: 445
  },
  
  // Eliza Wong's additional posts
  'ew2': {
    id: 'ew2',
    title: 'Quantum entanglement explained simply',
    content: "Einstein called it 'spooky action at a distance,' but quantum entanglement is a foundational concept that can be understood through the right analogies and examples.",
    createdAt: new Date('2023-09-20T09:45:00').toISOString(),
    user: { 
      id: 'ewong', 
      name: 'Eliza Wong', 
      username: 'ewong',
      image: 'https://randomuser.me/api/portraits/women/56.jpg',
    },
    category: { 
      id: '2', 
      name: 'Science', 
      slug: 'science' 
    },
    categoryId: '2',
    _count: { comments: 1, votes: 62 },
    votes: [{value: 1}, {value: 1}, {value: 1}],
    viewCount: 334
  },
  'ew3': {
    id: 'ew3',
    title: 'The practical applications of quantum computing today',
    content: "While universal quantum computers are still developing, specialized quantum systems are already solving real problems in optimization, materials science, and cryptography.",
    createdAt: new Date('2023-09-05T09:45:00').toISOString(),
    user: { 
      id: 'ewong', 
      name: 'Eliza Wong', 
      username: 'ewong',
      image: 'https://randomuser.me/api/portraits/women/56.jpg',
    },
    category: { 
      id: '1', 
      name: 'Technology', 
      slug: 'technology' 
    },
    categoryId: '1',
    _count: { comments: 1, votes: 53 },
    votes: [{value: 1}, {value: 1}, {value: 1}],
    viewCount: 287
  }
  ,
  // Philosophy extension
  'p2': {
    id: 'p2',
    title: 'Ethics in the Age of AI',
    content: "As artificial intelligence becomes more prevalent, we must consider the ethical implications. What moral frameworks should guide AI development and deployment?",
    createdAt: new Date('2023-10-06T12:22:00').toISOString(),
    user: {
      id: 'rbarnes',
      name: 'Ryan Barnes',
      username: 'rbarnes',
      image: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    category: {
      id: '4',
      name: 'Philosophy',
      slug: 'philosophy'
    },
    categoryId: '4',
    _count: { comments: 31, votes: 61 },
    votes: [{ value: 1 }, { value: 1 }, { value: 1 }],
    viewCount: 312
  },

  // Art extension
  'a2': {
    id: 'a2',
    title: 'The Renaissance of Street Art',
    content: 'Street art has evolved from simple graffiti to complex artistic expressions. This post explores how urban art is reshaping our cities and cultural landscape.',
    createdAt: new Date('2023-10-03T10:10:00').toISOString(),
    user: {
      id: 'mpatel',
      name: 'Mira Patel',
      username: 'mpatel',
      image: 'https://randomuser.me/api/portraits/women/67.jpg',
    },
    category: {
      id: '5',
      name: 'Art & Culture',
      slug: 'art'
    },
    categoryId: '5',
    _count: { comments: 25, votes: 49 },
    votes: [{ value: 1 }, { value: 1 }],
    viewCount: 221
  },

  // Education extension
  'ed1': {
    id: 'ed1',
    title: 'The Future of Online Learning',
    content: 'Online education has transformed dramatically in recent years. This post examines emerging trends and technologies that will shape the future of remote learning.',
    createdAt: new Date('2023-10-09T08:30:00').toISOString(),
    user: {
      id: 'aparker',
      name: 'Alex Parker',
      username: 'aparker',
      image: 'https://randomuser.me/api/portraits/men/64.jpg',
    },
    category: {
      id: '6',
      name: 'Education',
      slug: 'education'
    },
    categoryId: '6',
    _count: { comments: 16, votes: 41 },
    votes: [{ value: 1 }, { value: 1 }],
    viewCount: 177
  },
  'ed2': {
    id: 'ed2',
    title: 'Teaching Critical Thinking in the Digital Age',
    content: 'With information overload and misinformation prevalent online, teaching critical thinking skills has never been more important. Here are practical strategies for educators.',
    createdAt: new Date('2023-10-01T09:00:00').toISOString(),
    user: {
      id: 'aparker',
      name: 'Alex Parker',
      username: 'aparker',
      image: 'https://randomuser.me/api/portraits/men/64.jpg',
    },
    category: {
      id: '6',
      name: 'Education',
      slug: 'education'
    },
    categoryId: '6',
    _count: { comments: 28, votes: 58 },
    votes: [{ value: 1 }, { value: 1 }, { value: 1 }],
    viewCount: 233
  }
};

export default async function PostPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: { [key: string]: string | string[] | undefined } }) {
  try {
    const { id } = await params;
    
    if (id === "new") {
      const categoryParam = searchParams?.category 
        ? `?category=${searchParams.category}` 
        : '';
      
      redirect(`/posts/create${categoryParam}`);
    }

    if (id in MOCK_POSTS) {
      const mockPost = MOCK_POSTS[id as keyof typeof MOCK_POSTS];
      
      const score = mockPost.votes && Array.isArray(mockPost.votes) 
        ? mockPost.votes.reduce((acc: number, vote: { value: number }) => acc + vote.value, 0) 
        : 0;
      
      const relatedPostsWithScores = Object.values(MOCK_POSTS)
        .filter(post => post.id !== id && post.categoryId === mockPost.categoryId)
        .map(post => {
          const voteScore = post.votes && Array.isArray(post.votes)
            ? post.votes.reduce((acc, vote: { value: number }) => acc + vote.value, 0)
            : 0;
          
          return {
            ...post,
            voteScore,
          };
        });

      const userRoles: Record<string, string> = {
        'sarahc': 'Neuroscientist',
        'mjohnson': 'AI Researcher',
        'ewong': 'Quantum Computing Expert',
        'rbarnes': 'Philosophy Professor',
        'mpatel': 'Digital Artist',
        'aparker': 'Neurologist',
        'jsmith': 'Fitness Coach',
        'mwong': 'Sleep Researcher',
        'drq': 'Theoretical Physicist'
      };

      const enhancedPost = {
        ...mockPost,
        title: getEnglishTitle(mockPost.title),
        content: getEnglishContent(mockPost.content),
        user: {
          ...mockPost.user,
          role: userRoles[mockPost.user.username] || "Community Member"
        }
      };

      return (
        <div className="container mx-auto py-8 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <Link href={`/categories/${mockPost.category.slug}`} className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-4">
                <FiArrowLeft className="mr-2" /> Back to {mockPost.category.name}
              </Link>
              
              <div className="bg-background border border-border rounded-xl p-6 shadow-sm">
                {}
                <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-20 -z-10"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl opacity-20 -z-10"></div>
                
                <div className="flex flex-col">
                  <h1 className="text-2xl md:text-3xl font-bold">{enhancedPost.title}</h1>
                  
                  <div className="flex items-center mt-4 mb-6">
                    <UserProfilePopover
                      username={enhancedPost.user.username}
                      name={enhancedPost.user.name}
                      image={enhancedPost.user.image}
                      role={enhancedPost.user.role}
                    >
                      <Link href={`/users/${enhancedPost.user.username}`} className="flex items-center group">
                        <div className="h-10 w-10 rounded-full overflow-hidden mr-3 border border-primary/30">
                          {enhancedPost.user.image ? (
                            <img 
                              src={enhancedPost.user.image} 
                              alt={enhancedPost.user.name || enhancedPost.user.username}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-primary/60 to-secondary/60 flex items-center justify-center">
                              <span className="text-white font-medium">
                                {(enhancedPost.user.name || enhancedPost.user.username).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium group-hover:text-primary transition-colors">
                            {enhancedPost.user.name || enhancedPost.user.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Posted {formatDistanceToNow(new Date(enhancedPost.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </Link>
                    </UserProfilePopover>
                  </div>
                  
                  <div className="prose prose-neutral dark:prose-invert max-w-none">
                    <ThreadDiscussion
                      post={{
                        ...mockPost,
                        content: enhancedPost.content,
                        title: enhancedPost.title
                      }}
                      showComments={false}
                    />
                  </div>
                  
                  <div className="flex items-center mt-6 pt-4 border-t border-border">
                    <Link href={`/categories/${mockPost.category.slug}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                      <FiFolder className="mr-1" />
                      {mockPost.category.name}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <EnhancedCommentSection postId={id} />
            </div>
          </div>
        </div>
      );
    }

    const post = await db.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        category: true,
        _count: {
          select: {
            comments: true,
            votes: true,
          },
        },
        votes: {
          select: {
            id: true,
            userId: true,
            value: true,
          },
        },
      },
    });

    if (!post) {
      // If no post found in database, check if it should redirect to threads
      if (['1', '2', '3', '4', '5'].includes(id)) {
        redirect(`/threads/${id}`);
      }
      
      // Handle various mock post ID patterns
      if (id.match(/^[shtmew]+\d+$/)) {
        // IDs like s1, h1, t1, mj2, ew3, etc. - redirect to appropriate thread if they don't exist as posts
        const numericId = id.replace(/^[shtmew]+/, '');
        if (['1', '2', '3', '4', '5'].includes(numericId)) {
          redirect(`/threads/${numericId}`);
        }
      }
      
      console.error(`Post with ID ${id} not found`);
      return notFound();
    }

    const score = post.votes && Array.isArray(post.votes) 
      ? post.votes.reduce((acc: number, vote: { value: number }) => acc + vote.value, 0) 
      : 0;
      
    // Temporarily comment out the similar posts call to prevent the error:
    // const relatedPostsWithScores = await findSimilarPostsByPostId(id, 4);
    const relatedPostsWithScores = []; // Placeholder for now

    const userRoles: Record<string, string> = {
      'sarahc': 'Neuroscientist',
      'mjohnson': 'AI Researcher',
      'ewong': 'Quantum Computing Expert',
      'rbarnes': 'Philosophy Professor',
      'mpatel': 'Digital Artist',
      'aparker': 'Neurologist',
      'jsmith': 'Fitness Coach',
      'mwong': 'Sleep Researcher',
      'drq': 'Theoretical Physicist'
    };

    const enhancedPost = {
      ...post,
      title: getEnglishTitle(post.title),
      content: getEnglishContent(post.content),
      user: {
        ...post.user,
        role: userRoles[post.user.username as keyof typeof userRoles] || "Community Member"
      }
    };

    return (
      <div className="container mx-auto py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href={`/categories/${post.category.slug}`} className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-4">
              <FiArrowLeft className="mr-2" /> Back to {post.category.name}
            </Link>
            
            <div className="bg-background border border-border rounded-xl p-6 shadow-sm">
              {}
              <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-20 -z-10"></div>
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl opacity-20 -z-10"></div>
              
              <div className="flex flex-col">
                <h1 className="text-2xl md:text-3xl font-bold">{enhancedPost.title}</h1>
                
                <div className="flex items-center mt-4 mb-6">
                  <UserProfilePopover
                    username={enhancedPost.user.username}
                    name={enhancedPost.user.name}
                    image={enhancedPost.user.image}
                    role={enhancedPost.user.role}
                  >
                    <Link href={`/users/${enhancedPost.user.username}`} className="flex items-center group">
                      <div className="h-10 w-10 rounded-full overflow-hidden mr-3 border border-primary/30">
                        {enhancedPost.user.image ? (
                          <img 
                            src={enhancedPost.user.image} 
                            alt={enhancedPost.user.name || enhancedPost.user.username}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-primary/60 to-secondary/60 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {(enhancedPost.user.name || enhancedPost.user.username).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium group-hover:text-primary transition-colors">
                          {enhancedPost.user.name || enhancedPost.user.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Posted {formatDistanceToNow(new Date(enhancedPost.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </Link>
                  </UserProfilePopover>
                </div>
                
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <ThreadDiscussion
                    post={{
                      ...post,
                      content: enhancedPost.content,
                      title: enhancedPost.title
                    }}
                    showComments={false}
                  />
                </div>
                
                <div className="flex items-center mt-6 pt-4 border-t border-border">
                  <Link href={`/categories/${post.category.slug}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                    <FiFolder className="mr-1" />
                    {post.category.name}
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <EnhancedCommentSection postId={id} />
          </div>
          {/* Temporarily comment out the similar posts call to prevent the error: */}
          {/*
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.isArray(relatedPostsWithScores) && relatedPostsWithScores.map((rp: any) => (
                <Link key={rp.id} href={`/posts/${rp.id}`} className="block border border-border rounded-lg p-4 hover:bg-muted/20 transition-colors">
                  <div className="text-sm text-muted-foreground mb-1">{rp.category?.name}</div>
                  <div className="font-medium">{rp.title}</div>
                </Link>
              ))}
            </div>
          </div>
          */}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in PostPage:", error);
    return notFound();
  }
} 