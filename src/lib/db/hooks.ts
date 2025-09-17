import { PrismaClient } from '@prisma/client';
import { indexPost, indexComment, indexCategory, deleteDocument, indexUser } from '@/lib/qdrant';

const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
  if (params.model === 'Post') {
    if (params.action === 'create' || params.action === 'update') {
      const result = await next(params);
      
      try {
        const post = await prisma.post.findUnique({
          where: { id: result.id },
          include: {
            user: true,
            category: true,
          },
        });
        
        if (post) {
          try {
            await indexPost(post);
          } catch (indexError) {
            console.error(`Error indexing post ${post.id} in vector DB:`, indexError);
          }
        }
      } catch (error) {
        console.error('Error in post indexing hook:', error);
      }
      
      return result;
    }
    
    if (params.action === 'delete') {
      const post = await prisma.post.findUnique({
        where: params.args.where,
      });
      
      const result = await next(params);
      
      if (post) {
        await deleteDocument(post.id, 'post');
      }
      
      return result;
    }
  }
  
  if (params.model === 'Comment') {
    if (params.action === 'create' || params.action === 'update') {
      const result = await next(params);
      
      const comment = await prisma.comment.findUnique({
        where: { id: result.id },
        include: {
          user: true,
          post: true,
        },
      });
      
      if (comment) {
        await indexComment(comment);
      }
      
      return result;
    }
    
    if (params.action === 'delete') {
      const comment = await prisma.comment.findUnique({
        where: params.args.where,
      });
      
      const result = await next(params);
      
      if (comment) {
        await deleteDocument(comment.id, 'comment');
      }
      
      return result;
    }
  }
  
  if (params.model === 'Category') {
    if (params.action === 'create' || params.action === 'update') {
      const result = await next(params);
      
      const category = await prisma.category.findUnique({
        where: { id: result.id },
      });
      
      if (category) {
        await indexCategory(category);
      }
      
      return result;
    }
    
    if (params.action === 'delete') {
      const category = await prisma.category.findUnique({
        where: params.args.where,
      });
      
      const result = await next(params);
      
      if (category) {
        await deleteDocument(category.id, 'category');
      }
      
      return result;
    }
  }

  if (params.model === 'User') {
    if (params.action === 'create' || params.action === 'update') {
      const result = await next(params);
      try {
        const user = await prisma.user.findUnique({ where: { id: result.id } });
        if (user) {
          await indexUser(user);
        }
      } catch (error) {
        console.error('Error indexing user:', error);
      }
      return result;
    }

    if (params.action === 'delete') {
      const user = await prisma.user.findUnique({ where: params.args.where });
      const result = await next(params);
      if (user) {
        try {
          await deleteDocument(user.id, 'user');
        } catch {}
      }
      return result;
    }
  }
  
  return next(params);
});

export { prisma }; 