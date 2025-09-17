import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { refreshPostSignals } from "@/lib/qdrant";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "You must be signed in to bookmark posts" },
        { status: 401 }
      );
    }
    
    const { postId } = await req.json();
    
    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }
    
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true }
    });
    
    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }
    
    const existingBookmark = await db.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId: postId
        }
      }
    });
    
    if (existingBookmark) {
      return NextResponse.json(
        { message: "Post already bookmarked" },
        { status: 200 }
      );
    }
    
    const bookmark = await db.bookmark.create({
      data: {
        userId: user.id,
        postId: postId
      }
    });
    await refreshPostSignals(postId);
    
    return NextResponse.json(
      { message: "Post bookmarked successfully", bookmark },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating bookmark:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the bookmark" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "You must be signed in to remove bookmarks" },
        { status: 401 }
      );
    }
    
    const { postId } = await req.json();
    
    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }
    
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    const bookmark = await db.bookmark.deleteMany({
      where: {
        userId: user.id,
        postId: postId
      }
    });
    await refreshPostSignals(postId);
    if (bookmark.count === 0) {
      return NextResponse.json(
        { message: "Bookmark not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: "Bookmark removed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing bookmark:", error);
    return NextResponse.json(
      { error: "An error occurred while removing the bookmark" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { isBookmarked: false, message: "Not authenticated" },
        { status: 200 }
      );
    }
    
    const url = new URL(req.url);
    const postId = url.searchParams.get("postId");
    
    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }
    
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { isBookmarked: false },
        { status: 200 }
      );
    }
    
    const bookmark = await db.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId: postId
        }
      }
    });
    
    return NextResponse.json({
      isBookmarked: !!bookmark
    });
  } catch (error) {
    console.error("Error checking bookmark status:", error);
    return NextResponse.json(
      { error: "An error occurred while checking bookmark status" },
      { status: 500 }
    );
  }
} 