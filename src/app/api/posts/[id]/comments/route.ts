import { db, isDatabaseReachable } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { NextRequest } from "next/server";

const commentCreateSchema = z.object({
  content: z.string().min(1).max(1000),
  parentId: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    if (!id) {
      return NextResponse.json(
        { message: "Post ID is required" },
        { status: 400 }
      );
    }

    // Mock comments for specific posts
    const mockComments: Record<string, any[]> = {
      '1': [
        {
          id: 'c1-1',
          content: "This is exactly what I needed! The step-by-step approach really helped me understand the concepts better.",
          createdAt: new Date('2023-10-16T10:30:00').toISOString(),
          user: { id: 'user1', name: 'Alex Chen', username: 'alexc', image: 'https://randomuser.me/api/portraits/men/22.jpg' },
          _count: { votes: 5, children: 2 }
        },
        {
          id: 'c1-2',
          content: "Great post! I've been struggling with this for weeks. Thanks for sharing your insights.",
          createdAt: new Date('2023-10-15T16:45:00').toISOString(),
          user: { id: 'user2', name: 'Sarah Johnson', username: 'sarahj', image: 'https://randomuser.me/api/portraits/women/28.jpg' },
          _count: { votes: 3, children: 1 }
        },
        {
          id: 'c1-3',
          content: "I have a question about the third point. Could you elaborate on that?",
          createdAt: new Date('2023-10-14T14:20:00').toISOString(),
          user: { id: 'user3', name: 'Mike Rodriguez', username: 'miker', image: 'https://randomuser.me/api/portraits/men/35.jpg' },
          _count: { votes: 1, children: 0 }
        }
      ],
      '2': [
        {
          id: 'c2-1',
          content: "This is a game-changer! I never thought about it this way before.",
          createdAt: new Date('2023-10-17T09:15:00').toISOString(),
          user: { id: 'user4', name: 'Emma Wilson', username: 'emmaw', image: 'https://randomuser.me/api/portraits/women/31.jpg' },
          _count: { votes: 4, children: 1 }
        },
        {
          id: 'c2-2',
          content: "I've been following this topic for months. This post really ties everything together.",
          createdAt: new Date('2023-10-16T13:30:00').toISOString(),
          user: { id: 'user5', name: 'David Kim', username: 'davidk', image: 'https://randomuser.me/api/portraits/men/29.jpg' },
          _count: { votes: 2, children: 0 }
        }
      ],
      '3': [
        {
          id: 'c3-1',
          content: "Quantum computing is fascinating! I've been reading about quantum entanglement lately. It's mind-bending stuff.",
          createdAt: new Date('2023-10-11T11:20:00').toISOString(),
          user: { id: 'quantum1', name: 'Dr. Lisa Park', username: 'lisap', image: 'https://randomuser.me/api/portraits/women/42.jpg' },
          _count: { votes: 3, children: 1 }
        }
      ],
      '4': [
        {
          id: 'c4-1',
          content: "This is a fascinating topic! I've been reading about the hard problem of consciousness lately. What do you think about David Chalmers' work on this?",
          createdAt: new Date('2023-10-12T10:30:00').toISOString(),
          user: { id: 'phil1', name: 'Dr. Sarah Williams', username: 'sarahw', image: 'https://randomuser.me/api/portraits/women/45.jpg' },
          _count: { votes: 3, children: 1 }
        },
        {
          id: 'c4-2',
          content: "Eastern philosophy offers such different perspectives on consciousness. The concept of 'no-self' in Buddhism really challenges our Western notions of identity.",
          createdAt: new Date('2023-10-11T15:45:00').toISOString(),
          user: { id: 'phil2', name: 'Marcus Chen', username: 'marcusc', image: 'https://randomuser.me/api/portraits/men/38.jpg' },
          _count: { votes: 2, children: 0 }
        }
      ],
      'p2': [
        {
          id: 'cp2-1',
          content: "The trolley problem becomes so much more complex with AI systems. How do we program ethical decision-making when there's no clear 'right' answer?",
          createdAt: new Date('2023-10-07T14:20:00').toISOString(),
          user: { id: 'eth1', name: 'Dr. Lisa Rodriguez', username: 'lisar', image: 'https://randomuser.me/api/portraits/women/52.jpg' },
          _count: { votes: 4, children: 2 }
        },
        {
          id: 'cp2-2',
          content: "I think we need to establish clear ethical frameworks before AI becomes even more integrated into society. The time to act is now.",
          createdAt: new Date('2023-10-06T16:10:00').toISOString(),
          user: { id: 'eth2', name: 'James Thompson', username: 'jamest', image: 'https://randomuser.me/api/portraits/men/41.jpg' },
          _count: { votes: 1, children: 0 }
        },
        {
          id: 'cp2-3',
          content: "What about the role of transparency in AI decision-making? Should we be able to understand how AI systems make ethical choices?",
          createdAt: new Date('2023-10-05T11:30:00').toISOString(),
          user: { id: 'eth3', name: 'Dr. Maria Garcia', username: 'mariag', image: 'https://randomuser.me/api/portraits/women/48.jpg' },
          _count: { votes: 2, children: 1 }
        }
      ],
      '5': [
        {
          id: 'c5-1',
          content: "I started with Procreate and it's been amazing! The learning curve wasn't too steep and there are so many tutorials available.",
          createdAt: new Date('2023-10-09T09:15:00').toISOString(),
          user: { id: 'art1', name: 'Emma Wilson', username: 'emmaw', image: 'https://randomuser.me/api/portraits/women/29.jpg' },
          _count: { votes: 2, children: 0 }
        },
        {
          id: 'c5-2',
          content: "Don't forget about traditional art fundamentals! Understanding color theory and composition will make your digital work much stronger.",
          createdAt: new Date('2023-10-08T13:45:00').toISOString(),
          user: { id: 'art2', name: 'Carlos Martinez', username: 'carlosm', image: 'https://randomuser.me/api/portraits/men/33.jpg' },
          _count: { votes: 3, children: 1 }
        }
      ],
      'a2': [
        {
          id: 'ca2-1',
          content: "Street art has really evolved beyond just graffiti. Artists like Banksy have shown how powerful this medium can be for social commentary.",
          createdAt: new Date('2023-10-04T12:00:00').toISOString(),
          user: { id: 'street1', name: 'Alex Rivera', username: 'alexr', image: 'https://randomuser.me/api/portraits/men/25.jpg' },
          _count: { votes: 5, children: 2 }
        },
        {
          id: 'ca2-2',
          content: "The legal vs illegal aspect is always interesting. Some cities are embracing street art while others still crack down hard.",
          createdAt: new Date('2023-10-03T16:30:00').toISOString(),
          user: { id: 'street2', name: 'Nina Patel', username: 'ninap', image: 'https://randomuser.me/api/portraits/women/31.jpg' },
          _count: { votes: 2, children: 0 }
        },
        {
          id: 'ca2-3',
          content: "I love how street art can transform a neighborhood. It brings life and color to otherwise dull urban spaces.",
          createdAt: new Date('2023-10-02T10:15:00').toISOString(),
          user: { id: 'street3', name: 'David Kim', username: 'davidk', image: 'https://randomuser.me/api/portraits/men/28.jpg' },
          _count: { votes: 1, children: 0 }
        }
      ],
      'ed1': [
        {
          id: 'ced1-1',
          content: "The shift to online learning during the pandemic really accelerated this evolution. Now we're seeing hybrid models that combine the best of both worlds.",
          createdAt: new Date('2023-10-10T11:20:00').toISOString(),
          user: { id: 'edu1', name: 'Dr. Jennifer Lee', username: 'jenniferl', image: 'https://randomuser.me/api/portraits/women/44.jpg' },
          _count: { votes: 3, children: 1 }
        },
        {
          id: 'ced1-2',
          content: "Accessibility is one of the biggest advantages. Students who couldn't attend traditional classes due to disabilities or location can now participate fully.",
          createdAt: new Date('2023-10-09T14:45:00').toISOString(),
          user: { id: 'edu2', name: 'Michael Torres', username: 'michaelt', image: 'https://randomuser.me/api/portraits/men/36.jpg' },
          _count: { votes: 2, children: 0 }
        }
      ],
      'ed2': [
        {
          id: 'ced2-1',
          content: "Teaching students to fact-check and verify sources is crucial. I always start with the CRAAP test - Currency, Relevance, Authority, Accuracy, Purpose.",
          createdAt: new Date('2023-10-02T08:30:00').toISOString(),
          user: { id: 'crit1', name: 'Prof. Robert Johnson', username: 'robertj', image: 'https://randomuser.me/api/portraits/men/47.jpg' },
          _count: { votes: 4, children: 2 }
        },
        {
          id: 'ced2-2',
          content: "The challenge is making critical thinking engaging for students. I use case studies and real-world examples to show why it matters.",
          createdAt: new Date('2023-10-01T15:20:00').toISOString(),
          user: { id: 'crit2', name: 'Dr. Amanda Foster', username: 'amandaf', image: 'https://randomuser.me/api/portraits/women/39.jpg' },
          _count: { votes: 2, children: 1 }
        },
        {
          id: 'ced2-3',
          content: "Media literacy should be taught from elementary school. Kids are exposed to so much information online, they need these skills early.",
          createdAt: new Date('2023-09-30T12:10:00').toISOString(),
          user: { id: 'crit3', name: 'Sarah Mitchell', username: 'sarahm', image: 'https://randomuser.me/api/portraits/women/35.jpg' },
          _count: { votes: 3, children: 0 }
        }
      ],
      'ew2': [
        {
          id: 'cew2-1',
          content: "This is exactly what I needed! I've been struggling with this concept for weeks.",
          createdAt: new Date('2023-10-18T14:30:00').toISOString(),
          user: { id: 'user6', name: 'Dr. Michael Torres', username: 'michaelt', image: 'https://randomuser.me/api/portraits/men/41.jpg' },
          _count: { votes: 2, children: 1 }
        },
        {
          id: 'cew2-2',
          content: "Great explanation! This really helped clarify things for me.",
          createdAt: new Date('2023-10-17T16:45:00').toISOString(),
          user: { id: 'user7', name: 'Lisa Anderson', username: 'lisaa', image: 'https://randomuser.me/api/portraits/women/33.jpg' },
          _count: { votes: 1, children: 0 }
        }
      ],
      'ew3': [
        {
          id: 'cew3-1',
          content: "Fascinating research! I'd love to learn more about the methodology used here.",
          createdAt: new Date('2023-10-19T11:20:00').toISOString(),
          user: { id: 'user8', name: 'Dr. Jennifer Lee', username: 'jenniferl', image: 'https://randomuser.me/api/portraits/women/44.jpg' },
          _count: { votes: 3, children: 2 }
        },
        {
          id: 'cew3-2',
          content: "This is groundbreaking work. Thank you for sharing your findings!",
          createdAt: new Date('2023-10-18T09:15:00').toISOString(),
          user: { id: 'user9', name: 'Prof. David Wilson', username: 'davidw', image: 'https://randomuser.me/api/portraits/men/46.jpg' },
          _count: { votes: 2, children: 0 }
        },
        {
          id: 'cew3-3',
          content: "I have some questions about the implications of this research. Could you elaborate?",
          createdAt: new Date('2023-10-17T13:40:00').toISOString(),
          user: { id: 'user10', name: 'Dr. Maria Garcia', username: 'mariag', image: 'https://randomuser.me/api/portraits/women/48.jpg' },
          _count: { votes: 1, children: 1 }
        }
      ]
    };

    // Return mock comments for specific posts
    if (mockComments[id]) {
      const comments = mockComments[id];
      return NextResponse.json({
        comments,
        meta: { total: comments.length, page, limit, pageCount: 1 },
      });
    }

    // If DB is not reachable, return empty comments without triggering Prisma
    const reachable = await isDatabaseReachable(400);
    if (!reachable) {
      return NextResponse.json({
        comments: [],
        meta: { total: 0, page, limit, pageCount: 0 },
      });
    }

    try {
      const comments = await db.comment.findMany({
        where: {
          postId: id,
          parentId: null,
        },
        orderBy: {
          createdAt: "desc",
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
          _count: {
            select: {
              votes: true,
              children: true,
            },
          },
        },
        skip,
        take: limit,
      });

      const total = await db.comment.count({
        where: {
          postId: id,
          parentId: null,
        },
      });

      return NextResponse.json({
        comments,
        meta: {
          total,
          page,
          limit,
          pageCount: Math.ceil(total / limit),
        },
      });
    } catch (dbErr) {
      // Soft-fail without noisy stack traces in dev
      return NextResponse.json({
        comments: [],
        meta: { total: 0, page, limit, pageCount: 0 },
      });
    }
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { message: "Could not fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: "You must be logged in to comment" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    if (!id) {
      return NextResponse.json(
        { message: "Post ID is required" },
        { status: 400 }
      );
    }

    const post = await db.post.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json(
        { message: "Post not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { content, parentId } = commentCreateSchema.parse(body);

    if (parentId) {
      const parentComment = await db.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment || parentComment.postId !== id) {
        return NextResponse.json(
          { message: "Parent comment not found" },
          { status: 404 }
        );
      }
    }

    const newComment = await db.comment.create({
      data: {
        content,
        userId: session.user.id,
        postId: id,
        parentId,
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
      },
    });

    return NextResponse.json(
      { comment: newComment, message: "Comment created successfully" },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating comment:", error);
    return NextResponse.json(
      { message: "Could not create comment" },
      { status: 500 }
    );
  }
} 