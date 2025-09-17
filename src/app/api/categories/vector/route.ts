import { NextRequest, NextResponse } from 'next/server';
import { db, isDatabaseReachable } from '@/lib/db';
import { isQdrantReady, qdrantClient, COLLECTIONS } from '@/lib/qdrant';

export async function GET(req: NextRequest) {
  try {
    const ready = await isQdrantReady();
    if (!ready) {
      return NextResponse.json({ success: false, categories: [], message: 'Qdrant not ready' }, { status: 200 });
    }

    // Try to ensure real categories are indexed from DB
    const dbOk = await isDatabaseReachable(600);
    if (dbOk) {
      const categories = await db.category.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true, description: true }
      });

      // Index into Qdrant (best-effort, ignore errors)
      try {
        const { indexCategory } = await import('@/lib/qdrant');
        for (const category of categories) {
          await indexCategory({
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description || ''
          } as any);
        }
      } catch {}
    }

    // Read categories from Qdrant
    const scroll = await qdrantClient.scroll(COLLECTIONS.CATEGORIES, {
      limit: 100,
      with_payload: true,
      with_vector: false,
    } as any);

    const categories = (scroll.points || []).map((p: any) => ({
      id: p.payload?.id || p.id,
      name: p.payload?.name,
      slug: p.payload?.slug,
      description: p.payload?.description,
      _count: p.payload?._count || undefined,
    })).filter((c: any) => c.name);

    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error('Error in categories/vector:', error);
    return NextResponse.json({ success: false, categories: [] }, { status: 200 });
  }
}



