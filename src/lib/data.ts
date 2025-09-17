import { db } from "@/lib/db";


export async function getPostById(postId: string) {
  try {
    const post = await db.post.findUnique({
      where: {
        id: postId,
      },
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
          },
        },
        votes: true,
      },
    });

    return post;
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
} 