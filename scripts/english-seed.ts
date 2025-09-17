import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('Cleaning up existing data...');
  
  await prisma.$transaction([
    prisma.$executeRaw`DELETE FROM Notification;`,
    prisma.$executeRaw`DELETE FROM Bookmark;`,
    prisma.$executeRaw`DELETE FROM CategoryFollow;`,
    prisma.$executeRaw`DELETE FROM Follow;`,
    prisma.$executeRaw`DELETE FROM UserAchievement;`,
    prisma.$executeRaw`DELETE FROM Vote;`,
    prisma.$executeRaw`DELETE FROM Comment;`,
    prisma.$executeRaw`DELETE FROM Post;`,
    prisma.$executeRaw`DELETE FROM Category;`,
    prisma.$executeRaw`DELETE FROM Session;`,
    prisma.$executeRaw`DELETE FROM Account;`,
    prisma.$executeRaw`DELETE FROM User;`,
  ]);
  
  console.log('All existing data deleted.');
}

async function seedUsers() {
  console.log('Creating users...');
  
  const adminPassword = await hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      username: 'admin',
      password: adminPassword,
    },
  });

  const users = [
    {
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      username: 'sarahc',
      password: await hash('password123', 10),
    },
    {
      name: 'Marcus Johnson',
      email: 'marcus@example.com',
      username: 'mjohnson',
      password: await hash('password123', 10),
    },
    {
      name: 'Eliza Wong',
      email: 'eliza@example.com',
      username: 'ewong',
      password: await hash('password123', 10),
    },
    {
      name: 'David Rodriguez',
      email: 'david@example.com',
      username: 'drodriguez',
      password: await hash('password123', 10),
    },
    {
      name: 'Emma Thompson',
      email: 'emma@example.com',
      username: 'ethompson',
      password: await hash('password123', 10),
    },
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = await prisma.user.create({ data: userData });
    createdUsers.push(user);
  }

  console.log(`Created ${createdUsers.length + 1} users including admin.`);
  return [admin, ...createdUsers];
}

async function seedCategories(users: any[]) {
  console.log('Creating categories...');
  
  const categoryData = [
    {
      name: 'Technology',
      description: 'Discussions about the latest in tech, programming, and digital innovation',
      slug: 'technology',
    },
    {
      name: 'Artificial Intelligence',
      description: 'Machine learning, neural networks, and AI applications',
      slug: 'ai',
    },
    {
      name: 'Science',
      description: 'Scientific discoveries, research, and discussions',
      slug: 'science',
    },
    {
      name: 'Health & Wellness',
      description: 'Share knowledge on physical and mental health, nutrition, fitness, mindfulness, and personal well-being.',
      slug: 'health',
    },
    {
      name: 'Business',
      description: 'Entrepreneurship, startups, finance, and market trends',
      slug: 'business',
    },
  ];
  
  const categories = [];
  for (const data of categoryData) {
    const creator = users[Math.floor(Math.random() * users.length)];
    const category = await prisma.category.create({
      data: {
        ...data,
        creatorId: creator.id,
      },
    });
    categories.push(category);
  }
  
  console.log(`Created ${categories.length} categories.`);
  return categories;
}

async function seedPosts(users: any[], categories: any[]) {
  console.log('Creating posts...');
  
  const postData = [
    {
      title: "How to improve brain memory and cognition",
      content: "I've been researching techniques to improve memory and cognitive function. Has anyone tried specific supplements or techniques that have worked well?",
      category: "health",
      author: "sarahc"
    },
    {
      title: "The future of AI in healthcare",
      content: "As AI becomes more sophisticated, what applications in healthcare do you think will have the biggest impact in the next 5 years?",
      category: "technology",
      author: "mjohnson"
    },
    {
      title: "Understanding quantum computing basics",
      content: "I'm trying to wrap my head around quantum computing principles. Can someone explain qubits and superposition in simple terms?",
      category: "science",
      author: "ewong"
    },
    {
      title: "Best practices for remote team management",
      content: "Our company is going fully remote. What tools and strategies have worked best for managing distributed teams?",
      category: "business",
      author: "drodriguez"
    },
    {
      title: "Machine learning for beginners",
      content: "I want to get started with machine learning but don't know where to begin. What are the best resources and first projects to tackle?",
      category: "ai",
      author: "ethompson"
    },
    {
      title: "Sustainable energy solutions",
      content: "What are the most promising renewable energy technologies that could help address climate change?",
      category: "science",
      author: "admin"
    },
    {
      title: "Meditation apps that actually work",
      content: "I've tried several meditation apps but struggle to stick with them. Which ones have you found most effective for building a consistent practice?",
      category: "health",
      author: "sarahc"
    },
    {
      title: "The rise of decentralized finance (DeFi)",
      content: "DeFi is changing how we think about traditional banking. What are the opportunities and risks investors should be aware of?",
      category: "business",
      author: "mjohnson"
    },
    {
      title: "Neural networks explained simply",
      content: "Can someone break down how neural networks actually work without getting too technical? I understand the concept but want to grasp the mechanics.",
      category: "ai",
      author: "ewong"
    },
    {
      title: "Space exploration milestone achievements",
      content: "Recent achievements in space exploration have been incredible. What's next on the horizon for human space travel?",
      category: "science",
      author: "drodriguez"
    }
  ];

  const posts = [];
  for (const data of postData) {
    const author = users.find(u => u.username === data.author);
    const category = categories.find(c => c.slug === data.category);
    
    if (author && category) {
      const post = await prisma.post.create({
        data: {
          title: data.title,
          content: data.content,
          userId: author.id,
          categoryId: category.id,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        },
      });
      posts.push(post);
    }
  }
  
  console.log(`Created ${posts.length} posts.`);
  return posts;
}

async function seedComments(users: any[], posts: any[]) {
  console.log('Creating comments...');
  
  const commentData = [
    "Great question! I've had success with spaced repetition techniques using apps like Anki.",
    "I recommend checking out the book 'Peak' by Anders Ericsson for evidence-based learning methods.",
    "AI in diagnostic imaging is already showing incredible results. Radiology will likely be transformed first.",
    "Telemedicine integration with AI could revolutionize patient care in underserved areas.",
    "Think of qubits like coins that can be heads, tails, or spinning in the air simultaneously.",
    "The key insight is that quantum computers can explore many solution paths at once.",
    "Slack for communication, Notion for documentation, and regular video check-ins work well for us.",
    "Don't underestimate the importance of virtual coffee chats for team bonding.",
    "Start with Python and the scikit-learn library. The documentation is excellent for beginners.",
    "I'd recommend Andrew Ng's Machine Learning course on Coursera as a foundation.",
    "Solar panel efficiency has improved dramatically while costs have plummeted.",
    "Battery storage technology is the missing piece for renewable energy adoption.",
    "Headspace worked well for me because of the structured programs and reminders.",
    "Try starting with just 5 minutes a day. Consistency matters more than duration.",
    "DeFi offers great yields but smart contract risks are real. Only invest what you can afford to lose.",
    "The regulatory landscape is still evolving, which creates both opportunities and uncertainties.",
    "Neural networks are essentially mathematical functions that learn patterns from data.",
    "Each layer processes information and passes refined insights to the next layer.",
    "Mars missions are exciting, but I think lunar bases will come first as stepping stones.",
    "Commercial space travel is becoming reality faster than most people expected.",
  ];

  const comments = [];
  for (let i = 0; i < Math.min(commentData.length, 20); i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const post = posts[Math.floor(Math.random() * posts.length)];
    
    const comment = await prisma.comment.create({
      data: {
        content: commentData[i],
        userId: user.id,
        postId: post.id,
        createdAt: new Date(Date.now() - Math.random() * 25 * 24 * 60 * 60 * 1000), // Random date within last 25 days
      },
    });
    
    comments.push(comment);
  }
  
  console.log(`Created ${comments.length} comments.`);
  return comments;
}

async function main() {
  try {
    await cleanup();
    
    const users = await seedUsers();
    const categories = await seedCategories(users);
    const posts = await seedPosts(users, categories);
    const comments = await seedComments(users, posts);
    
    console.log('\n🎉 English seed data created successfully!');
    console.log(`Total: ${users.length} users, ${categories.length} categories, ${posts.length} posts, ${comments.length} comments`);
    
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
