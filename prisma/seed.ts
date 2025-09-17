import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    const adminPassword = await hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        username: 'admin',
        password: adminPassword,
      },
    });

    console.log('Admin user created:', admin.username);

    const user1Password = await hash('password123', 10);
    const user1 = await prisma.user.create({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: user1Password,
      },
    });

    const user2Password = await hash('password123', 10);
    const user2 = await prisma.user.create({
      data: {
        name: 'Jane Smith',
        email: 'jane@example.com',
        username: 'janesmith',
        password: user2Password,
      },
    });

    console.log('Sample users created:', user1.username, user2.username);

    const categories = await Promise.all([
      prisma.category.create({
        data: {
          name: 'Technology',
          description: 'Discussions about the latest in tech, programming, and digital innovation',
          slug: 'technology',
          creatorId: admin.id,
        },
      }),
      prisma.category.create({
        data: {
          name: 'Science',
          description: 'Scientific discoveries, research, and discussions',
          slug: 'science',
          creatorId: admin.id,
        },
      }),
      prisma.category.create({
        data: {
          name: 'Entertainment',
          description: 'Movies, TV shows, music, games, and all things entertainment',
          slug: 'entertainment',
          creatorId: admin.id,
        },
      }),
      prisma.category.create({
        data: {
          name: 'Sports',
          description: 'Sports news, events, and discussions',
          slug: 'sports',
          creatorId: admin.id,
        },
      }),
    ]);

    console.log('Categories created:', categories.map(c => c.name).join(', '));

    const posts = await Promise.all([
      prisma.post.create({
        data: {
          title: 'The Future of AI',
          content: 'AI is rapidly evolving and changing how we interact with technology. What do you think the future holds?',
          userId: user1.id,
          categoryId: categories[0].id,
        },
      }),
      prisma.post.create({
        data: {
          title: 'New Discoveries on Mars',
          content: 'NASA has recently announced new findings from the Mars rover. Let\'s discuss what this means for space exploration.',
          userId: user2.id,
          categoryId: categories[1].id,
        },
      }),
      prisma.post.create({
        data: {
          title: 'Best TV Shows of 2023',
          content: 'What are your favorite TV shows that came out this year? Share your recommendations!',
          userId: user1.id,
          categoryId: categories[2].id,
        },
      }),
    ]);

    console.log('Sample posts created:', posts.map(p => p.title).join(', '));

    const comments = await Promise.all([
      prisma.comment.create({
        data: {
          content: 'I think AI will completely transform how we work in the next decade.',
          userId: user2.id,
          postId: posts[0].id,
        },
      }),
      prisma.comment.create({
        data: {
          content: 'The discoveries on Mars are fascinating. I wonder if we\'ll find evidence of past life.',
          userId: user1.id,
          postId: posts[1].id,
        },
      }),
      prisma.comment.create({
        data: {
          content: 'My favorite show this year has to be The Last of Us. Absolutely brilliant adaptation!',
          userId: admin.id,
          postId: posts[2].id,
        },
      }),
    ]);

    console.log('Sample comments created:', comments.length);

    await Promise.all([
      prisma.vote.create({
        data: {
          value: 1,
          userId: user1.id,
          postId: posts[1].id,
        },
      }),
      prisma.vote.create({
        data: {
          value: 1,
          userId: user2.id,
          postId: posts[0].id,
        },
      }),
      prisma.vote.create({
        data: {
          value: 1,
          userId: admin.id,
          commentId: comments[0].id,
        },
      }),
    ]);

    console.log('Sample votes created');

    console.log('Database seed completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
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