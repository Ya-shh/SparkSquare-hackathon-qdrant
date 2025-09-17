import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

type Notification = {
  id: string;
  type: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
  data?: string;
};

type Activity = {
  id: string;
  type: 'comment' | 'vote' | 'post' | 'join' | 'trending' | 'ai-recommendation' | 'bookmark' | 'share';
  user: {
    name: string;
    username: string;
    image: string;
    role?: string;
  };
  target?: {
    title: string;
    id: string;
    category?: string;
  };
  timestamp: Date;
  metadata?: {
    voteType?: 'up' | 'down';
    aiScore?: number;
    engagement?: number;
    isHot?: boolean;
  };
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || 'notification';
    
    if (type === 'activity') {
      // Fetch recent activities for the activity feed
      const recentPosts = await db.post.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              username: true,
              image: true,
            }
          },
          category: {
            select: {
              name: true
            }
          },
          _count: {
            select: {
              comments: true,
              votes: true
            }
          }
        }
      });
      
      const recentComments = await db.comment.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              username: true,
              image: true,
            }
          },
          post: {
            select: {
              title: true,
              id: true,
              category: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });
      
      const recentVotes = await db.vote.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              username: true,
              image: true,
            }
          },
          post: {
            select: {
              title: true,
              id: true,
              category: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });
      
      // Convert to activity format
      const activities: Activity[] = [];
      
      // Add post creation activities
      recentPosts.forEach((post, index) => {
        activities.push({
          id: `post-${post.id}`,
          type: 'post',
          user: {
            name: post.user.name,
            username: post.user.username,
            image: post.user.image || '/default-avatar.svg',
            role: post.user.role || 'Community Member'
          },
          target: {
            title: post.title,
            id: post.id,
            category: post.category?.name
          },
          timestamp: post.createdAt,
          metadata: {
            engagement: post._count.comments + post._count.votes,
            isHot: post._count.comments > 5
          }
        });
      });
      
      // Add comment activities
      recentComments.forEach((comment, index) => {
        activities.push({
          id: `comment-${comment.id}`,
          type: 'comment',
          user: {
            name: comment.user.name,
            username: comment.user.username,
            image: comment.user.image || '/default-avatar.svg',
            role: comment.user.role || 'Community Member'
          },
          target: comment.post ? {
            title: comment.post.title,
            id: comment.post.id,
            category: comment.post.category?.name
          } : undefined,
          timestamp: comment.createdAt,
          metadata: {}
        });
      });
      
      // Add vote activities
      recentVotes.forEach((vote, index) => {
        activities.push({
          id: `vote-${vote.id}`,
          type: 'vote',
          user: {
            name: vote.user.name,
            username: vote.user.username,
            image: vote.user.image || '/default-avatar.svg',
            role: vote.user.role || 'Community Member'
          },
          target: vote.post ? {
            title: vote.post.title,
            id: vote.post.id,
            category: vote.post.category?.name
          } : undefined,
          timestamp: vote.createdAt,
          metadata: {
            voteType: vote.type.toLowerCase() as 'up' | 'down'
          }
        });
      });
      
      // Sort by timestamp and limit
      const sortedActivities = activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
      
      return NextResponse.json({
        activities: sortedActivities,
        total: activities.length
      });
    }
    
    // Default notifications response
    return NextResponse.json({
      notifications: [],
      unreadCount: 0,
      page: 1,
      limit,
    });
    
  } catch (error) {
    console.error('Error in notifications API:', error);
    return NextResponse.json({
      notifications: [],
      unreadCount: 0,
      page: 1,
      limit: 20,
    });
  }
} 