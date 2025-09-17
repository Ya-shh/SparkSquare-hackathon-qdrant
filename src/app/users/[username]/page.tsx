import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { FiChevronLeft, FiMessageSquare, FiCalendar, FiUser, FiEdit, FiMapPin, FiLink, FiThumbsUp, FiAward, FiUsers, FiBookmark, FiStar, FiGlobe } from "react-icons/fi";
import { db, isDatabaseReachable } from "@/lib/db";
import { Metadata } from "next";
import AchievementBadge from "@/components/AchievementBadge";
import { achievements, calculateAchievementProgress } from "@/lib/achievements";
import { getServerSession } from "next-auth";
import UserProfileTabs from "@/components/users/UserProfileTabs";
import AchievementShowcase from "@/components/AchievementShowcase";

interface MockUser {
  id: string;
  name: string;
  username: string;
  email: string;
  image: string;
  bio: string;
  location: string;
  website: string;
  createdAt: Date;
  _count: {
    posts: number;
    comments: number;
    followers: number;
    following: number;
  };
  recentPosts: MockPost[];
  recentComments: MockComment[];
  media: MockMedia[];
}

interface MockPost {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  likes: number;
  category: string;
}

interface MockComment {
  id: string;
  content: string;
  createdAt: Date;
  postTitle: string;
  likes: number;
}

interface MockMedia {
  id: string;
  type: 'image' | 'link' | 'video';
  url: string;
  title: string;
  description?: string;
  createdAt: Date;
}

const mockUsers: Record<string, MockUser> = {
  'alexmorgan': {
    id: 'user-1',
    name: 'Alex Morgan',
    username: 'alexmorgan',
    email: 'alex@example.com',
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
    bio: 'AI researcher and technology enthusiast. Exploring the intersection of machine learning and practical applications.',
    location: 'San Francisco, CA',
    website: 'https://alexmorgan.tech',
    createdAt: new Date('2022-08-15'),
    _count: {
      posts: 42,
      comments: 156,
      followers: 230,
      following: 87
    },
    recentPosts: [
      {
        id: 'am1',
        title: 'The Future of AI in Everyday Applications',
        content: "As artificial intelligence becomes more accessible, we're seeing innovative applications in unexpected areas of daily life...",
        createdAt: new Date('2023-10-12'),
        likes: 78,
        category: 'Technology'
      },
      {
        id: 'am2',
        title: 'Machine Learning for Non-Technical Users',
        content: "New tools are making ML accessible to those without programming backgrounds. Here's how anyone can leverage these powerful systems...",
        createdAt: new Date('2023-09-28'),
        likes: 64,
        category: 'Technology'
      },
      {
        id: 'am3',
        title: 'The Ethics of Generative AI',
        content: 'With generative models creating increasingly convincing content, we need to address the ethical implications...',
        createdAt: new Date('2023-09-15'),
        likes: 92,
        category: 'Technology'
      }
    ],
    recentComments: [
      {
        id: 'ac1',
        content: "The integration of AI in healthcare has enormous potential, but we need to be careful about privacy protections and ensuring systems don't perpetuate existing biases in medical care.",
        createdAt: new Date('2023-10-15'),
        postTitle: 'The future of AI in healthcare',
        likes: 28
      },
      {
        id: 'ac2',
        content: "This is a fantastic primer on machine learning concepts. I'd add that transfer learning has made many of these approaches much more accessible to smaller teams.",
        createdAt: new Date('2023-10-10'),
        postTitle: 'Understanding ML fundamentals',
        likes: 17
      }
    ],
    media: [
      {
        id: 'am1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=800&h=600&fit=crop',
        title: 'Speaking at AI Summit 2023',
        description: 'Presenting research on neural network optimization',
        createdAt: new Date('2023-08-18')
      },
      {
        id: 'am2',
        type: 'link',
        url: 'https://www.nature.com/articles/s41586-023-05881-4',
        title: 'Latest research on multimodal learning',
        description: 'Our team\'s recent publication on cross-domain feature integration',
        createdAt: new Date('2023-09-05')
      },
      {
        id: 'am3',
        type: 'video',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Introduction to AI Ethics',
        description: 'My lecture series on responsible AI development',
        createdAt: new Date('2023-07-12')
      }
    ]
  },
  'sarahc': {
    id: 'user-s1',
    name: 'Sarah Chen',
    username: 'sarahc',
    email: 'sarahc@example.com',
    image: 'https://randomuser.me/api/portraits/women/23.jpg',
    bio: 'Neuroscientist specializing in cognitive enhancement and memory formation. I research techniques to improve brain function and memory consolidation.',
    location: 'Boston, MA',
    website: 'https://sarahchen.neuro',
    createdAt: new Date('2022-06-12'),
    _count: {
      posts: 37,
      comments: 142,
      followers: 215,
      following: 89
    },
    recentPosts: [
      {
        id: '1',
        title: 'How to improve brain memory and cognition',
        content: "I've been researching techniques to improve memory and cognitive function. Here are scientifically-backed methods to enhance your brain's performance...",
        createdAt: new Date('2023-10-15'),
        likes: 78,
        category: 'Health'
      },
      {
        id: 'h2',
        title: 'The science of neuroplasticity',
        content: "Our brains continue to change throughout our lives. Understanding neuroplasticity can help you harness your brain's natural ability to rewire itself...",
        createdAt: new Date('2023-09-28'),
        likes: 65,
        category: 'Science'
      },
      {
        id: 'h3',
        title: 'Memory enhancement techniques backed by research',
        content: "Memory champions use specific techniques that leverage how our brains naturally store information. Let's explore these methods and how you can apply them...",
        createdAt: new Date('2023-09-10'),
        likes: 92,
        category: 'Health'
      }
    ],
    recentComments: [
      {
        id: 'scc1',
        content: "Sleep is absolutely critical for memory consolidation. Recent studies show that even a 10% reduction in sleep quality can reduce memory formation by up to 30%.",
        createdAt: new Date('2023-10-18'),
        postTitle: 'The connection between sleep and cognitive performance',
        likes: 31
      },
      {
        id: 'scc2',
        content: "Absolutely agree with this assessment. Neuroinflammation is increasingly identified as a key factor in cognitive decline. Anti-inflammatory diets show tremendous promise in this area.",
        createdAt: new Date('2023-10-05'),
        postTitle: 'Nutrition and brain health',
        likes: 24
      }
    ],
    media: [
      {
        id: 'sm1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&h=600&fit=crop',
        title: 'Neuroscience Lab Research',
        description: 'Working with our new fMRI equipment',
        createdAt: new Date('2023-08-15')
      },
      {
        id: 'sm2',
        type: 'video',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Memory Enhancement Techniques',
        description: 'My lecture series on practical cognitive enhancement',
        createdAt: new Date('2023-07-22')
      },
      {
        id: 'sm3',
        type: 'link',
        url: 'https://www.sciencedirect.com/science/article/pii/S0896627322',
        title: 'Recent publication on memory formation',
        description: 'Our team\'s findings on how environmental factors influence recall',
        createdAt: new Date('2023-09-01')
      }
    ]
  },
  'mjohnson': {
    id: 'user-m1',
    name: 'Marcus Johnson',
    username: 'mjohnson',
    email: 'mjohnson@example.com',
    image: 'https://randomuser.me/api/portraits/men/42.jpg',
    bio: 'AI Researcher focused on healthcare applications. Working on making artificial intelligence accessible and beneficial for medical diagnostics and treatment planning.',
    location: 'San Francisco, CA',
    website: 'https://mjohnson.ai',
    createdAt: new Date('2022-04-23'),
    _count: {
      posts: 45,
      comments: 178,
      followers: 267,
      following: 103
    },
    recentPosts: [
      {
        id: '2',
        title: 'The future of AI in healthcare',
        content: "As AI becomes more sophisticated, it's transforming healthcare in unprecedented ways. Here's what to expect in the next five years...",
        createdAt: new Date('2023-10-10'),
        likes: 92,
        category: 'Technology'
      },
      {
        id: 'mj2',
        title: 'Breaking down machine learning algorithms for medical diagnostics',
        content: "Machine learning models are becoming increasingly accurate at diagnosing certain conditions. Let's explore how these systems work...",
        createdAt: new Date('2023-09-18'),
        likes: 75,
        category: 'Science'
      },
      {
        id: 'mj3',
        title: 'Ethics in medical AI development',
        content: "When AI makes medical decisions, ethical considerations become paramount. We need robust frameworks to ensure patient welfare remains the priority...",
        createdAt: new Date('2023-08-29'),
        likes: 83,
        category: 'Technology'
      }
    ],
    recentComments: [
      {
        id: 'mjc1',
        content: "The potential for AI in personalized medicine is enormous. We're now able to analyze thousands of variables simultaneously to tailor treatments to individual genetic profiles.",
        createdAt: new Date('2023-10-16'),
        postTitle: 'Personalized medicine breakthroughs',
        likes: 42
      },
      {
        id: 'mjc2',
        content: "While LLMs show promise in medical applications, we need to be extremely cautious about hallucinations. In medicine, incorrect information can have serious consequences.",
        createdAt: new Date('2023-10-04'),
        postTitle: 'Language models in healthcare',
        likes: 37
      }
    ],
    media: [
      {
        id: 'mjm1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=800&h=600&fit=crop',
        title: 'AI Healthcare Conference 2023',
        description: 'Presenting our research on diagnostic algorithms',
        createdAt: new Date('2023-08-05')
      },
      {
        id: 'mjm2',
        type: 'link',
        url: 'https://www.nature.com/articles/s41591-023-02448-8',
        title: 'Our paper on AI diagnostic accuracy',
        description: 'Comparing deep learning systems to human specialists',
        createdAt: new Date('2023-09-12')
      },
      {
        id: 'mjm3',
        type: 'video',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'The Future of Medical AI',
        description: 'My keynote at Stanford Medical School',
        createdAt: new Date('2023-07-18')
      }
    ]
  },
  'ewong': {
    id: 'user-e1',
    name: 'Eliza Wong',
    username: 'ewong',
    email: 'ewong@example.com',
    image: 'https://randomuser.me/api/portraits/women/56.jpg',
    bio: 'Quantum Computing Expert working at the intersection of quantum information science and practical computing applications. Simplifying quantum concepts for broader understanding.',
    location: 'Cambridge, MA',
    website: 'https://elizawong.quantum',
    createdAt: new Date('2022-05-17'),
    _count: {
      posts: 39,
      comments: 152,
      followers: 201,
      following: 76
    },
    recentPosts: [
      {
        id: '3',
        title: 'Understanding quantum computing basics',
        content: "Quantum computing principles can seem intimidating, but the core concepts are accessible. Here's my explanation of qubits and superposition in simple terms...",
        createdAt: new Date('2023-10-08'),
        likes: 45,
        category: 'Science'
      },
      {
        id: 'ew2',
        title: 'Quantum entanglement explained simply',
        content: "Einstein called it 'spooky action at a distance,' but quantum entanglement is a foundational concept that can be understood through the right analogies...",
        createdAt: new Date('2023-09-20'),
        likes: 62,
        category: 'Science'
      },
      {
        id: 'ew3',
        title: 'The practical applications of quantum computing today',
        content: "While universal quantum computers are still developing, specialized quantum systems are already solving real problems in optimization, materials science, and cryptography...",
        createdAt: new Date('2023-09-05'),
        likes: 53,
        category: 'Technology'
      }
    ],
    recentComments: [
      {
        id: 'ewc1',
        content: "The distinction between quantum supremacy and quantum advantage is crucial. Supremacy demonstrates theoretical capability, while advantage solves real-world problems better than classical computers.",
        createdAt: new Date('2023-10-14'),
        postTitle: 'Quantum computing milestones',
        likes: 31
      },
      {
        id: 'ewc2',
        content: "Many popular explanations of quantum computing focus too much on the weirdness and not enough on the algorithms. Understanding quantum algorithms is key to grasping the potential.",
        createdAt: new Date('2023-10-01'),
        postTitle: 'Learning resources for quantum computing',
        likes: 25
      }
    ],
    media: [
      {
        id: 'ewm1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=600&fit=crop',
        title: 'Quantum Computing Lab',
        description: 'Working with IBM quantum systems',
        createdAt: new Date('2023-08-10')
      },
      {
        id: 'ewm2',
        type: 'video',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Quantum Computing Explained',
        description: 'My popular science lecture series',
        createdAt: new Date('2023-07-15')
      },
      {
        id: 'ewm3',
        type: 'link',
        url: 'https://www.science.org/doi/10.1126/science.abj9119',
        title: 'Our recent paper on quantum error correction',
        description: 'New methods for improving qubit stability',
        createdAt: new Date('2023-09-08')
      }
    ]
  },
  'sophiachen': {
    id: 'user-2',
    name: 'Sophia Chen',
    username: 'sophiachen',
    email: 'sophia@example.com',
    image: 'https://randomuser.me/api/portraits/women/44.jpg',
    bio: 'Neuroscientist studying cognitive enhancement and brain-computer interfaces. Passionate about making science accessible.',
    location: 'Boston, MA',
    website: 'https://sophiachen.science',
    createdAt: new Date('2022-10-07'),
    _count: {
      posts: 37,
      comments: 129,
      followers: 189,
      following: 73
    },
    recentPosts: [
      {
        id: 'sc1',
        title: 'How Meditation Physically Changes Your Brain',
        content: 'Recent neuroimaging studies show that consistent meditation practice leads to structural changes in key brain regions...',
        createdAt: new Date('2023-10-05'),
        likes: 85,
        category: 'Health'
      },
      {
        id: 'sc2',
        title: 'The Science Behind Memory Formation',
        content: 'Understanding how memories form can help us develop better learning strategies. Recent discoveries suggest...',
        createdAt: new Date('2023-09-22'),
        likes: 62,
        category: 'Science'
      },
      {
        id: 'sc3',
        title: 'Brain-Computer Interfaces: Current State and Future Possibilities',
        content: "As BCI technology improves, we're approaching new frontiers in human-computer interaction...",
        createdAt: new Date('2023-09-08'),
        likes: 79,
        category: 'Technology'
      }
    ],
    recentComments: [
      {
        id: 'scc1',
        content: "The research on neuroplasticity is fascinating. Even into old age, our brains retain remarkable adaptability. The key is consistent mental stimulation combined with physical exercise.",
        createdAt: new Date('2023-10-14'),
        postTitle: 'How to improve brain memory and cognition',
        likes: 35
      },
      {
        id: 'scc2',
        content: "When it comes to cognitive enhancement, sleep quality might be the most underrated factor. Even a single night of poor sleep can significantly impair working memory and executive function.",
        createdAt: new Date('2023-10-08'),
        postTitle: 'Cognitive enhancement methods',
        likes: 27
      }
    ],
    media: [
      {
        id: 'scm1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1582560486643-010a9008da73?w=800&h=600&fit=crop',
        title: 'Neuroscience Lab Research',
        description: 'Working with our new fMRI equipment',
        createdAt: new Date('2023-08-25')
      },
      {
        id: 'scm2',
        type: 'link',
        url: 'https://www.sciencedirect.com/science/article/pii/S1053811923001854',
        title: 'Our paper on memory consolidation',
        description: 'New findings on how sleep affects long-term memory storage',
        createdAt: new Date('2023-09-12')
      }
    ]
  },
  'marcuswilliams': {
    id: 'user-3',
    name: 'Marcus Williams',
    username: 'marcuswilliams',
    email: 'marcus@example.com',
    image: 'https://randomuser.me/api/portraits/men/64.jpg',
    bio: 'Digital philosopher and educator. Examining how technology shapes our understanding of reality and human connection.',
    location: 'Austin, TX',
    website: 'https://marcuswilliams.edu',
    createdAt: new Date('2022-11-22'),
    _count: {
      posts: 51,
      comments: 183,
      followers: 267,
      following: 102
    },
    recentPosts: [
      {
        id: 'mw1',
        title: 'Digital Identity in the Age of Social Media',
        content: 'How our online personas increasingly shape our sense of self and perception of reality...',
        createdAt: new Date('2023-10-08'),
        likes: 118,
        category: 'Philosophy'
      },
      {
        id: 'mw2',
        title: 'The Philosophical Implications of Artificial Consciousness',
        content: 'As AI systems grow more sophisticated, we approach profound questions about the nature of consciousness...',
        createdAt: new Date('2023-09-20'),
        likes: 96,
        category: 'Philosophy'
      },
      {
        id: 'mw3',
        title: 'Technology and the Evolution of Human Connection',
        content: 'Digital communication has fundamentally altered how we form and maintain relationships...',
        createdAt: new Date('2023-09-01'),
        likes: 87,
        category: 'Society'
      }
    ],
    recentComments: [
      {
        id: 'mwc1',
        content: "The modern quest for meaning has been profoundly shaped by our technological context. We seek authenticity while increasingly living through digital mediations of experience.",
        createdAt: new Date('2023-10-12'),
        postTitle: 'Finding meaning in a digital world',
        likes: 44
      },
      {
        id: 'mwc2',
        content: "There's a fascinating parallel between Eastern philosophical traditions and recent developments in quantum physics. Both challenge our conventional understanding of observer and observed.",
        createdAt: new Date('2023-10-05'),
        postTitle: 'Understanding quantum computing basics',
        likes: 38
      }
    ],
    media: [
      {
        id: 'mwm1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=600&fit=crop',
        title: 'Philosophy and Technology Conference',
        description: 'Panel discussion on digital ethics',
        createdAt: new Date('2023-08-22')
      },
      {
        id: 'mwm2',
        type: 'video',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'The Evolution of Digital Society',
        description: 'My lecture series on technology and social transformation',
        createdAt: new Date('2023-07-18')
      }
    ]
  }
};

function createMockUserForUsername(username: string): MockUser {
  const capitalized = username
    .split(/[._-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return {
    id: `user-${username}`,
    name: capitalized || username,
    username,
    email: `${username}@example.com`,
    image: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(capitalized || username)}`,
    bio: "Community member.",
    location: "",
    website: "",
    createdAt: new Date('2023-01-01'),
    _count: {
      posts: 0,
      comments: 0,
      followers: 0,
      following: 0,
    },
    recentPosts: [],
    recentComments: [],
    media: [],
  };
}

export async function generateMetadata({
  params
}: {
  params: { username: string }
}): Promise<Metadata> {
  const resolvedParams = await params;
  
  const decodedUsername = decodeURIComponent(resolvedParams.username);
  
  if (mockUsers[decodedUsername]) {
    const user = mockUsers[decodedUsername];
    return {
      title: `${user.name}'s Profile | Modern Forum`,
      description: `View ${user.name}'s profile and contributions to the community`,
    };
  }

  try {
    const reachable = await isDatabaseReachable();
    if (!reachable) {
      const user = createMockUserForUsername(decodedUsername);
      return {
        title: `${user.name}'s Profile | Modern Forum`,
        description: `View ${user.name}'s profile and contributions to the community`,
      };
    }

    const user = await db.user.findUnique({
      where: { username: decodedUsername },
    });

    if (!user) {
      return {
        title: "User Not Found",
      };
    }

    return {
      title: `${user.name || user.username}'s Profile | Modern Forum`,
      description: `View ${user.name || user.username}'s profile and contributions to the community`,
    };
  } catch {
    const user = createMockUserForUsername(decodedUsername);
    return {
      title: `${user.name}'s Profile | Modern Forum`,
      description: `View ${user.name}'s profile and contributions to the community`,
    };
  }
}

export interface UserProfilePageProps {
  params: {
    username: string;
  };
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const session = await getServerSession();
  
  const resolvedParams = await params;
  
  const decodedUsername = decodeURIComponent(resolvedParams.username);

  const mockUser = mockUsers[decodedUsername];
  
  let user;
  let isOwnProfile = false;
  
  if (mockUser) {
    user = mockUser;
    isOwnProfile = session?.user?.email === user.email;
  } else {
    try {
      const reachable = await isDatabaseReachable();
      if (!reachable) {
        user = createMockUserForUsername(decodedUsername);
        isOwnProfile = false;
      } else {
        user = await db.user.findUnique({
          where: { username: decodedUsername },
          include: {
            _count: {
              select: {
                posts: true,
                comments: true,
                followers: true,
                following: true,
              },
            },
          },
        });
        
        if (!user) {
          notFound();
        }
        
        isOwnProfile = session?.user?.id === user.id;
      }
    } catch {
      user = createMockUserForUsername(decodedUsername);
      isOwnProfile = false;
    }
  }

  let similarUsers: any[] = [];
  try {
    const dbUser = await db.user.findUnique({ where: { username: decodedUsername } });
    if (dbUser) {
      // similarUsers = await findSimilarUsersByUserId(dbUser.id, 6); // Removed - function doesn't exist
    }
  } catch {}

  return (
    <div className="container max-w-6xl py-6 px-4 sm:px-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sticky top-24">
            <div className="flex flex-col items-center">
              {}
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-md">
                  <img
                    src={user.image || `/images/default-avatar.png`}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              {}
              <h1 className="text-2xl font-bold mt-4 text-gray-900 dark:text-white">
                {user.name}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                @{user.username}
              </p>
              
              {}
              <div className="w-full mt-3 space-y-2">
                {user.location && (
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <FiMapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">{user.location}</span>
                  </div>
                )}
                {user.website && (
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <FiLink className="w-4 h-4 mr-2" />
                    <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-500 hover:underline truncate">
                      {user.website.replace(/(^\w+:|^)\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
              
              {}
              <div className="w-full mt-4 grid grid-cols-2 gap-2 text-center border-t border-b border-gray-100 dark:border-gray-700 py-4">
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {user._count.posts}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Posts</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {user._count.comments}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Comments</p>
                </div>
              </div>
              
              {}
              <div className="w-full mt-3 grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {user._count.followers}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Followers</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {user._count.following}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Following</p>
                </div>
              </div>
              
              {}
              <div className="w-full mt-4 space-y-3">
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <FiCalendar className="w-4 h-4 mr-2" />
                  <span className="text-sm">
                    Joined {format(new Date(user.createdAt), "MMMM yyyy")}
                  </span>
                </div>
              </div>
              
              {}
              <div className="w-full mt-6">
                {isOwnProfile ? (
                  <a
                    href="/settings/profile"
                    className="w-full py-2 px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-center text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-150"
                  >
                    Edit Profile
                  </a>
                ) : (
                  <button
                    className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-150"
                  >
                    Follow
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {}
        <div className="md:col-span-2">
          {}
          {('recentPosts' in user) && ('media' in user) ? (
            <>
              {}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">About Me</h2>
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                  {user.bio}
                </p>
              </div>
              
              {}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Recent Posts</h2>
                  <Link href="#" className="text-sm text-indigo-500 hover:underline">View All</Link>
                </div>
                <div className="space-y-4">
                  {(user as MockUser).recentPosts.map((post: MockPost) => (
                    <div key={post.id} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0">
                      <Link href={`/posts/${post.id}`} className="block group">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                          {post.content}
                        </p>
                        <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{format(new Date(post.createdAt), "MMM d, yyyy")}</span>
                          <span className="mx-2">•</span>
                          <span className="flex items-center">
                            <FiThumbsUp className="mr-1" />
                            {post.likes} likes
                          </span>
                          <span className="mx-2">•</span>
                          <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                            {post.category}
                          </span>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
              
              {}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">Media & Links</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(user as MockUser).media.map((item: MockMedia) => (
                    <div key={item.id} className="border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden group">
                      {item.type === 'image' && (
                        <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
                          <img 
                            src={item.url} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}
                      {item.type === 'video' && (
                        <div className="relative h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <FiUser className="text-4xl text-gray-400" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-indigo-500 bg-opacity-80 rounded-full p-3">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}
                      {item.type === 'link' && (
                        <div className="h-48 bg-gray-100 dark:bg-gray-800 p-4 flex flex-col">
                          <div className="flex items-center text-indigo-500 mb-2">
                            <FiLink className="mr-2" />
                            <span className="font-medium">External Link</span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 text-sm flex-grow line-clamp-3">
                            {item.description}
                          </p>
                          <div className="mt-2 text-xs text-gray-400">
                            {format(new Date(item.createdAt), "MMM d, yyyy")}
                          </div>
                        </div>
                      )}
                      <div className="p-3">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                        {item.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
                <AchievementShowcase userId={user.id} className="mb-6" />
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <UserProfileTabs username={user.username} />
              </div>
              {similarUsers && similarUsers.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mt-6">
                  <h2 className="text-xl font-bold mb-4">Similar Users</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {similarUsers.map((su) => (
                      <Link key={su.id} href={`/users/${su.username}`} className="flex items-center gap-3 p-3 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600">
                          <img src={su.image || '/default-avatar.svg'} alt={su.username} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{su.name || su.username}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">@{su.username}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 