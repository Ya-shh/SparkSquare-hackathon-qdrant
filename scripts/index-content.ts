import { PrismaClient } from '@prisma/client';
import { initQdrantCollections, indexPost, indexComment, indexCategory, indexUser } from '../src/lib/qdrant';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting content indexing to Qdrant...');
  
  const initialized = await initQdrantCollections();
  if (!initialized) {
    console.error('Failed to initialize Qdrant collections. Aborting.');
    return;
  }
  
  console.log('Initialized Qdrant collections');
  
  console.log('Indexing categories...');
  const categories = await prisma.category.findMany();
  for (const category of categories) {
    await indexCategory(category);
    console.log(`Indexed category: ${category.name}`);
  }

  console.log('Indexing users...');
  const users = await prisma.user.findMany();
  for (const user of users) {
    await indexUser(user);
    console.log(`Indexed user: ${user.username}`);
  }
  
  console.log('Indexing posts...');
  const posts = await prisma.post.findMany({
    include: {
      user: true,
      category: true,
    },
  });
  
  for (const post of posts) {
    await indexPost(post);
    console.log(`Indexed post: ${post.title}`);
  }
  
  console.log('Indexing comments...');
  const comments = await prisma.comment.findMany({
    include: {
      user: true,
      post: true,
    },
  });
  
  for (const comment of comments) {
    await indexComment(comment);
    console.log(`Indexed comment by ${comment.user.username}`);
  }
  
  console.log('Content indexing completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during content indexing:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 