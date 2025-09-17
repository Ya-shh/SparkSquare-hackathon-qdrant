import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { refreshPostSignals, refreshCommentSignals } from "@/lib/qdrant";

const voteSchema = z.object({
  postId: z.string().optional(),
  commentId: z.string().optional(),
  value: z.number().min(-1).max(1), // -1 downvote, 0 remove, 1 upvote
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    const { postId, commentId, value } = await request.json();
    
    if ((!postId && !commentId) || (postId && commentId)) {
      return NextResponse.json(
        { error: "Either postId or commentId must be provided, but not both" },
        { status: 400 }
      );
    }
    
    if (![1, -1, 0].includes(value)) {
      return NextResponse.json(
        { error: "Value must be -1, 0, or 1" },
        { status: 400 }
      );
    }
    
    const userId = session.user.id;
    
    const existingVote = await db.vote.findFirst({
      where: {
        userId,
        ...(postId ? { postId } : { commentId }),
      },
    });
    
    if (value === 0 && existingVote) {
      await db.vote.delete({
        where: {
          id: existingVote.id,
        },
      });
      if (postId) await refreshPostSignals(postId);
      if (commentId) await refreshCommentSignals(commentId);
      
      return NextResponse.json({ 
        removed: true, 
        message: "Vote removed successfully" 
      });
    }
    
    if (existingVote) {
      if (existingVote.value === value) {
        await db.vote.delete({
          where: {
            id: existingVote.id,
          },
        });
        if (postId) await refreshPostSignals(postId);
        if (commentId) await refreshCommentSignals(commentId);
        return NextResponse.json({ 
          removed: true, 
          message: "Vote removed successfully" 
        });
      } else {
        const updatedVote = await db.vote.update({
          where: {
            id: existingVote.id,
          },
          data: {
            value,
          },
        });
        if (postId) await refreshPostSignals(postId);
        if (commentId) await refreshCommentSignals(commentId);
        return NextResponse.json({ 
          vote: updatedVote, 
          message: "Vote updated successfully" 
        });
      }
    } else if (value !== 0) {
      const newVote = await db.vote.create({
        data: {
          value,
          userId,
          ...(postId ? { postId } : { commentId }),
        },
      });
      if (postId) await refreshPostSignals(postId);
      if (commentId) await refreshCommentSignals(commentId);
      return NextResponse.json({ 
        vote: newVote, 
        message: "Vote created successfully" 
      });
    } else {
      return NextResponse.json({ 
        message: "No vote to remove" 
      });
    }
  } catch (error) {
    console.error("Error voting:", error);
    return NextResponse.json(
      { error: "Failed to process vote" },
      { status: 500 }
    );
  }
} 