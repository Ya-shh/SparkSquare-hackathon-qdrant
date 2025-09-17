import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const resolvedParams = await params;
    const username = resolvedParams.username;
    
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const offset = (page - 1) * limit;
    
    const user = await db.user.findUnique({
      where: { username },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const comments = await db.comment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: {
        post: {
          select: {
            id: true,
            title: true,
          },
        },
        votes: {
          select: {
            value: true,
          },
        },
      },
    });

    const totalComments = await db.comment.count({
      where: { userId: user.id },
    });

    return NextResponse.json({
      comments,
      pagination: {
        total: totalComments,
        page,
        limit,
        pages: Math.ceil(totalComments / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching user comments:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching user comments" },
      { status: 500 }
    );
  }
} 