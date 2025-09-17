import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { refreshCommentSignals } from "@/lib/qdrant";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await context.params;
    
    if (!id) {
      return new NextResponse("Comment ID is required", { status: 400 });
    }

    const comment = await db.comment.findUnique({
      where: { id }
    });

    if (!comment) {
      return new NextResponse("Comment not found", { status: 404 });
    }

    const existingVote = await db.vote.findFirst({
      where: {
        userId: session.user.id,
        commentId: id,
        value: 1 // like
      }
    });

    let liked = false;

    if (existingVote) {
      await db.vote.delete({
        where: {
          id: existingVote.id
        }
      });
      liked = false;
    } else {
      const existingDislike = await db.vote.findFirst({
        where: {
          userId: session.user.id,
          commentId: id,
          value: -1
        }
      });

      if (existingDislike) {
        await db.vote.update({
          where: {
            id: existingDislike.id
          },
          data: {
            value: 1
          }
        });
      } else {
        await db.vote.create({
          data: {
            userId: session.user.id,
            commentId: id,
            value: 1
          }
        });
      }
      liked = true;
    }

    const likesCount = await db.vote.count({
      where: {
        commentId: id,
        value: 1
      }
    });

    await refreshCommentSignals(id);

    return NextResponse.json({ 
      message: liked ? "Comment liked successfully" : "Like removed successfully", 
      liked,
      likeCount: likesCount
    });
  } catch (error) {
    console.error("Error in comment like route:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await context.params;
    
    if (!id) {
      return new NextResponse("Comment ID is required", { status: 400 });
    }

    const vote = await db.vote.findFirst({
      where: {
        commentId: id,
        userId: session.user.id,
        value: 1
      }
    });

    const likesCount = await db.vote.count({
      where: {
        commentId: id,
        value: 1
      }
    });

    return NextResponse.json({ 
      liked: !!vote,
      likeCount: likesCount
    });
  } catch (error) {
    console.error("Error in comment like GET route:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 