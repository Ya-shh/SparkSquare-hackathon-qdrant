

import { db } from "@/lib/db";

export type NotificationType = 
  | 'mention'       // User mentioned in post/comment
  | 'reply'         // Reply to user's comment
  | 'follow'        // User followed another user
  | 'achievement'   // User earned an achievement 
  | 'upvote'        // User's content was upvoted
  | 'category_post' // New post in followed category
  | 'system';       // System notification


export async function createNotification({
  userId,
  type,
  content,
  data = {},
}: {
  userId: string;
  type: NotificationType;
  content: string;
  data?: Record<string, any>;
}) {
  try {
    console.info('Would create notification:', { userId, type, content, data });
    
    return {
      id: `mock-${Date.now()}`,
      type,
      content,
      userId,
      data: JSON.stringify(data),
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}


export async function markNotificationAsRead(notificationId: string) {
  try {
    console.info('Would mark notification as read:', notificationId);
    return { id: notificationId, isRead: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return null;
  }
}


export async function markAllNotificationsAsRead(userId: string) {
  try {
    console.info('Would mark all notifications as read for user:', userId);
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
}


export async function createMentionNotification({
  mentionedUserId,
  mentionerUserId,
  mentionerUsername,
  contentType,
  contentId,
  contentPreview,
}: {
  mentionedUserId: string;
  mentionerUserId: string;
  mentionerUsername: string;
  contentType: 'post' | 'comment';
  contentId: string;
  contentPreview: string;
}) {
  if (mentionedUserId === mentionerUserId) return null;
  
  const content = `@${mentionerUsername} mentioned you in a ${contentType}`;
  
  return createNotification({
    userId: mentionedUserId,
    type: 'mention',
    content,
    data: {
      mentionerUserId,
      contentType,
      contentId,
      contentPreview: contentPreview.substring(0, 100) + (contentPreview.length > 100 ? '...' : ''),
    },
  });
}


export async function createReplyNotification({
  parentCommentUserId,
  replierUserId,
  replierUsername,
  commentId,
  postId,
  replyPreview,
}: {
  parentCommentUserId: string;
  replierUserId: string;
  replierUsername: string;
  commentId: string;
  postId: string;
  replyPreview: string;
}) {
  if (parentCommentUserId === replierUserId) return null;
  
  const content = `@${replierUsername} replied to your comment`;
  
  return createNotification({
    userId: parentCommentUserId,
    type: 'reply',
    content,
    data: {
      replierUserId,
      commentId,
      postId,
      replyPreview: replyPreview.substring(0, 100) + (replyPreview.length > 100 ? '...' : ''),
    },
  });
}


export async function createAchievementNotification({
  userId,
  achievementId,
  achievementName,
  points,
}: {
  userId: string;
  achievementId: string;
  achievementName: string;
  points: number;
}) {
  const content = `🏆 You earned the "${achievementName}" achievement!`;
  
  return createNotification({
    userId,
    type: 'achievement',
    content,
    data: {
      achievementId,
      points,
    },
  });
}


export async function createFollowNotification({
  followedUserId,
  followerUserId,
  followerUsername,
}: {
  followedUserId: string;
  followerUserId: string;
  followerUsername: string;
}) {
  const content = `@${followerUsername} started following you`;
  
  return createNotification({
    userId: followedUserId,
    type: 'follow',
    content,
    data: {
      followerUserId,
    },
  });
}


export function extractMentions(text: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
  const mentions = text.match(mentionRegex);
  
  if (!mentions) return [];
  
  return [...new Set(mentions.map(mention => mention.substring(1)))];
}

type MentionParams = {
  text: string;
  authorId: string;
  authorUsername: string;
  contentType: 'post' | 'comment';
  contentId: string;
};

type ReplyNotificationParams = {
  parentCommentUserId: string;
  replierUserId: string;
  replierUsername: string;
  commentId: string;
  postId: string;
  replyPreview: string;
};

type AchievementNotificationParams = {
  userId: string;
  achievementId: string;
  achievementName: string;
  points: number;
};


export async function processMentions({ 
  text, 
  authorId, 
  authorUsername,
  contentType,
  contentId 
}: MentionParams) {
  try {
    if (!text) return;
    
    const mentionRegex = /@(\w+)/g;
    const mentions = text.match(mentionRegex);
    
    if (!mentions) return;
    
    const uniqueUsernames = [...new Set(mentions.map(m => m.substring(1)))];
    
    const mentionedUsers = await db.user.findMany({
      where: {
        username: {
          in: uniqueUsernames,
        },
      },
      select: {
        id: true,
        username: true,
      }
    });
    
    for (const user of mentionedUsers) {
      if (user.id === authorId) continue;
      
      try {
        await createNotification({
          userId: user.id,
          type: 'mention',
          content: `@${authorUsername} mentioned you in a ${contentType}`,
          data: {
            authorId,
            authorUsername,
            contentType,
            contentId,
          }
        });
      } catch (notificationError) {
        console.error("Error creating mention notification:", notificationError);
      }
    }
  } catch (error) {
    console.error("Error in processMentions:", error);
  }
} 