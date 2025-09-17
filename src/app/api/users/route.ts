import { NextRequest, NextResponse } from 'next/server';
import { withDatabase } from '@/lib/db-singleton';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    
    const offset = (page - 1) * limit;

    const result = await withDatabase(async (prisma) => {
      // Build search conditions
      const whereClause = search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { bio: { contains: search, mode: 'insensitive' } }
        ]
      } : {};

      // Get users with counts
      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          include: {
            _count: {
              select: {
                posts: true,
                comments: true,
                followers: true,
                following: true
              }
            }
          },
          orderBy: [
            { createdAt: 'desc' }
          ],
          take: limit,
          skip: offset
        }),
        prisma.user.count({ where: whereClause })
      ]);

      return {
        users: users.map(user => ({
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          image: user.image,
          bio: user.bio,
          location: user.location,
          website: user.website,
          createdAt: user.createdAt.toISOString(),
          _count: user._count
        })),
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      };
    });

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users',
      users: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1
    }, { status: 500 });
  }
}
