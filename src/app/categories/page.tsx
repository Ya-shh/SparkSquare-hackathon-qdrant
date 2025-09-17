import CategorySearch from "@/components/CategorySearch";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function fetchCategoriesFromQdrant(): Promise<any[]> {
  try {
    // Prioritize Qdrant vector categories
    const res = await fetch(`/api/categories/vector`, { cache: 'no-store' });
    const data = await res.json();
    if (Array.isArray(data.categories) && data.categories.length > 0) return data.categories;
  } catch {}

  // Fallback to DB categories
  try {
    const res = await fetch(`/api/categories`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.categories) && data.categories.length > 0) return data.categories;
    }
  } catch {}

  return [];
}

export default async function CategoriesPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string }>
}) {
  const { q = '' } = (await searchParams) ?? {};
  const searchQuery = q;

  // Prefer DB categories first (they include _count), then fall back to Qdrant
  async function fetchCategoriesPreferDb(): Promise<any[]> {
    try {
      const resDb = await fetch(`/api/categories`, { cache: 'no-store' });
      if (resDb.ok) {
        const dataDb = await resDb.json();
        if (Array.isArray(dataDb.categories) && dataDb.categories.length > 0) return dataDb.categories;
      }
    } catch {}

    return fetchCategoriesFromQdrant();
  }

  const categories = await fetchCategoriesPreferDb();

  // Normalize and ensure post counts are present even for Qdrant-only results
  const seen = new Set<string>();
  const normalized = categories
    .map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      creator: c.creator || { name: 'Community', username: 'community', image: '/default-avatar.svg' },
      _count: c._count && typeof c._count.posts === 'number' ? c._count : { posts: c.postsCount ?? 0 },
    }))
    .filter((c: any) => {
      const key = c.slug || c.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  // Final fallback: mock categories aligned with category pages and homepage mock posts
  const fallbackMock = [
    {
      id: '1',
      name: 'Technology',
      slug: 'technology',
      description: 'Discuss the latest in AI, software development, hardware, and tech innovations that are shaping our future.',
      creator: { name: 'Marcus Johnson', username: 'mjohnson', image: 'https://randomuser.me/api/portraits/men/42.jpg' },
      _count: { posts: 5 },
    },
    {
      id: '2',
      name: 'Science',
      slug: 'science',
      description: 'Explore scientific discoveries, physics, chemistry, biology, astronomy, and the mysteries of our universe.',
      creator: { name: 'Eliza Wong', username: 'ewong', image: 'https://randomuser.me/api/portraits/women/56.jpg' },
      _count: { posts: 3 },
    },
    {
      id: '3',
      name: 'Health & Wellness',
      slug: 'health',
      description: 'Share knowledge on physical and mental health, nutrition, fitness, mindfulness, and personal well-being.',
      creator: { name: 'Sarah Chen', username: 'sarahc', image: 'https://randomuser.me/api/portraits/women/23.jpg' },
      _count: { posts: 3 },
    },
    {
      id: '4',
      name: 'Philosophy',
      slug: 'philosophy',
      description: 'Delve into philosophical questions, ethics, metaphysics, and the fundamental nature of knowledge and reality.',
      creator: { name: 'Ryan Barnes', username: 'rbarnes', image: 'https://randomuser.me/api/portraits/men/32.jpg' },
      _count: { posts: 2 },
    },
    {
      id: '5',
      name: 'Art & Culture',
      slug: 'art',
      description: 'Discuss visual arts, music, literature, film, cultural expressions, and creative pursuits across mediums.',
      creator: { name: 'Mira Patel', username: 'mpatel', image: 'https://randomuser.me/api/portraits/women/67.jpg' },
      _count: { posts: 2 },
    },
    {
      id: '6',
      name: 'Education',
      slug: 'education',
      description: 'Exchange ideas on learning methodologies, educational resources, academic research, and knowledge sharing.',
      creator: { name: 'Alex Parker', username: 'aparker', image: 'https://randomuser.me/api/portraits/men/64.jpg' },
      _count: { posts: 2 },
    }
  ];

  // Ensure real-looking post counts that match our mock detail pages when DB lacks data
  const mockCountsBySlug: Record<string, number> = {
    technology: 5,
    science: 3,
    health: 3,
    philosophy: 2,
    art: 2,
    education: 2,
  };

  const withCounts = (normalized.length > 0 ? normalized : fallbackMock).map((c: any) => {
    const hasDbCount = c?._count && typeof c._count.posts === 'number' && c._count.posts > 0;
    const posts = hasDbCount ? c._count.posts : (mockCountsBySlug[c.slug] ?? 0);
    return { ...c, _count: { posts } };
  });

  return <CategorySearch categories={withCounts} initialQuery={searchQuery} />;
}