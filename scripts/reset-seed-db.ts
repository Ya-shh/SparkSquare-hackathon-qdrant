import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import { faker } from '@faker-js/faker';

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

interface User {
  id: string;
  name: string | null;
  email: string | null;
  username: string;
  emailVerified?: Date | null;
  password: string;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  [key: string]: any;
}

interface Post {
  id: string;
  title: string;
  content: string;
  userId: string;
  categoryId: string;
  [key: string]: any;
}

interface Comment {
  id: string;
  content: string;
  userId: string;
  postId: string;
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

async function seedUsers(count: number = 10): Promise<User[]> {
  console.log(`Creating ${count} users...`);
  
  const adminPassword = await hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@sparksquare.com',
      username: 'admin',
      password: adminPassword,
    },
  });
  
  const users: User[] = [admin];
  
  for (let i = 0; i < count - 1; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const username = faker.internet.userName({ firstName, lastName }).toLowerCase();
    
    const user = await prisma.user.create({
      data: {
        name: `${firstName} ${lastName}`,
        email: faker.internet.email({ firstName, lastName, provider: 'sparksquare.com' }),
        username: username.replace(/[^a-z0-9]/g, ''),
        password: await hash('password123', 10),
      },
    });
    
    users.push(user);
  }
  
  console.log(`Created ${users.length} users.`);
  return users;
}

async function seedCategories(users: User[]): Promise<Category[]> {
  console.log('Creating categories...');
  
  const categoryData = [
    {
      name: 'Technology',
      description: 'Discussions about the latest in tech, programming, and digital innovation',
      slug: 'technology',
    },
    {
      name: 'Science',
      description: 'Scientific discoveries, research, and discussions',
      slug: 'science',
    },
    {
      name: 'Business',
      description: 'Entrepreneurship, startups, finance, and market trends',
      slug: 'business',
    },
    {
      name: 'Health',
      description: 'Health, wellness, fitness, and medical breakthroughs',
      slug: 'health',
    },
    {
      name: 'Arts & Culture',
      description: 'Art, literature, music, film, and cultural discussions',
      slug: 'arts-culture',
    },
    {
      name: 'Education',
      description: 'Learning resources, educational discussions, and academic topics',
      slug: 'education',
    },
    {
      name: 'Gaming',
      description: 'Video games, tabletop games, and gaming culture',
      slug: 'gaming',
    },
  ];
  
  const categories: Category[] = [];
  
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

async function seedPosts(users: User[], categories: Category[], count: number = 30): Promise<Post[]> {
  console.log(`Creating ${count} posts...`);
  
  const posts: Post[] = [];
  
  for (let i = 0; i < count; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    const post = await prisma.post.create({
      data: {
        title: faker.lorem.sentence().slice(0, -1),
        content: faker.lorem.paragraphs({ min: 1, max: 5 }),
        userId: user.id,
        categoryId: category.id,
        createdAt: faker.date.recent({ days: 30 }),
      },
    });
    
    posts.push(post);
  }
  
  console.log(`Created ${posts.length} posts.`);
  return posts;
}

async function seedComments(users: User[], posts: Post[], count: number = 80): Promise<Comment[]> {
  console.log(`Creating ${count} comments...`);
  
  const comments: Comment[] = [];
  
  for (let i = 0; i < count; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const post = posts[Math.floor(Math.random() * posts.length)];
    
    const comment = await prisma.comment.create({
      data: {
        content: faker.lorem.paragraph(),
        userId: user.id,
        postId: post.id,
        createdAt: faker.date.recent({ days: 20 }),
      },
    });
    
    comments.push(comment);
  }
  
  const repliesCount = Math.floor(count * 0.4); // 40% of additional comments will be replies
  
  for (let i = 0; i < repliesCount; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const parentComment = comments[Math.floor(Math.random() * comments.length)];
    
    const reply = await prisma.comment.create({
      data: {
        content: faker.lorem.paragraph(),
        userId: user.id,
        postId: parentComment.postId,
        parentId: parentComment.id,
        createdAt: faker.date.recent({ days: 15 }),
      },
    });
    
    comments.push(reply);
  }
  
  console.log(`Created ${comments.length} comments (including replies).`);
  return comments;
}

async function seedVotes(users: User[], posts: Post[], comments: Comment[]) {
  console.log('Creating votes...');
  
  const votes = [];
  
  for (const post of posts) {
    const numVotes = Math.floor(Math.random() * 15) + 1;
    const selectedUsers = faker.helpers.arrayElements(users, numVotes);
    
    for (const user of selectedUsers) {
      const value = Math.random() < 0.8 ? 1 : -1;
      
      try {
        const vote = await prisma.vote.create({
          data: {
            value,
            userId: user.id,
            postId: post.id,
            createdAt: faker.date.recent({ days: 10 }),
          },
        });
        
        votes.push(vote);
      } catch (error) {
        console.log(`Skipping duplicate vote from user ${user.id} on post ${post.id}`);
      }
    }
  }
  
  for (const comment of comments) {
    if (Math.random() < 0.5) {
      const numVotes = Math.floor(Math.random() * 5) + 1;
      const selectedUsers = faker.helpers.arrayElements(users, numVotes);
      
      for (const user of selectedUsers) {
        const value = Math.random() < 0.85 ? 1 : -1;
        
        try {
          const vote = await prisma.vote.create({
            data: {
              value,
              userId: user.id,
              commentId: comment.id,
              createdAt: faker.date.recent({ days: 5 }),
            },
          });
          
          votes.push(vote);
        } catch (error) {
          console.log(`Skipping duplicate vote from user ${user.id} on comment ${comment.id}`);
        }
      }
    }
  }
  
  console.log(`Created ${votes.length} votes.`);
  return votes;
}

async function main() {
  try {
    await cleanup();
    
    const users = await seedUsers(15);
    const categories = await seedCategories(users);
    const posts = await seedPosts(users, categories, 40);
    const comments = await seedComments(users, posts, 100);
    await seedVotes(users, posts, comments);
    
    console.log('Database reset and seed completed successfully!');
  } catch (error) {
    console.error('Error resetting and seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 