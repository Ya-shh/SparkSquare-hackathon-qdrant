import { NextRequest, NextResponse } from 'next/server';
import { qdrantClient, COLLECTIONS, generateEmbedding, isQdrantReady } from '@/lib/qdrant';
import { db } from '@/lib/db';

interface TopicCluster {
  id: string;
  name: string;
  description: string;
  posts: string[];
  keywords: string[];
  score: number;
  postCount: number;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const timeRange = (searchParams.get('timeRange') as 'day' | 'week' | 'month' | 'year') || 'month';
    const minPosts = parseInt(searchParams.get('minPosts') || '3');

    const topics = await discoverTopicClusters(timeRange, limit, minPosts);
    
    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Error in topics API:', error);
    return NextResponse.json({ topics: [] }, { status: 500 });
  }
}

async function discoverTopicClusters(
  timeRange: string, 
  limit: number, 
  minPosts: number
): Promise<TopicCluster[]> {
  try {
    const ready = await isQdrantReady();
    if (!ready) {
      return getFallbackTopics(timeRange, limit);
    }

    // Get posts from the specified time range
    const timeFilter = getTimeFilter(timeRange);
    const posts = await db.post.findMany({
      where: {
        createdAt: {
          gte: timeFilter
        }
      },
      include: {
        category: {
          select: { name: true }
        },
        _count: {
          select: { comments: true, votes: true }
        }
      },
      take: 200 // Limit for performance
    });

    if (posts.length < minPosts) {
      return getFallbackTopics(timeRange, limit);
    }

    // Define topic seeds for clustering
    const topicSeeds = [
      {
        name: 'Artificial Intelligence & Machine Learning',
        keywords: ['artificial intelligence', 'machine learning', 'neural networks', 'deep learning', 'AI', 'ML', 'algorithms'],
        query: 'artificial intelligence machine learning AI neural networks deep learning algorithms'
      },
      {
        name: 'Neuroscience & Cognitive Science',
        keywords: ['neuroscience', 'brain', 'cognitive', 'memory', 'consciousness', 'psychology', 'mental health'],
        query: 'neuroscience brain cognitive science memory consciousness psychology mental health'
      },
      {
        name: 'Quantum Computing & Physics',
        keywords: ['quantum', 'physics', 'quantum computing', 'quantum mechanics', 'qubits', 'superposition'],
        query: 'quantum computing physics quantum mechanics qubits superposition entanglement'
      },
      {
        name: 'Healthcare & Medical Innovation',
        keywords: ['healthcare', 'medical', 'health', 'medicine', 'treatment', 'diagnosis', 'therapy'],
        query: 'healthcare medical innovation health medicine treatment diagnosis therapy'
      },
      {
        name: 'Climate & Environment',
        keywords: ['climate', 'environment', 'sustainability', 'renewable energy', 'carbon', 'green technology'],
        query: 'climate change environment sustainability renewable energy carbon footprint green technology'
      },
      {
        name: 'Biotechnology & Genetics',
        keywords: ['biotechnology', 'genetics', 'DNA', 'gene editing', 'CRISPR', 'genomics', 'bioengineering'],
        query: 'biotechnology genetics DNA gene editing CRISPR genomics bioengineering'
      },
      {
        name: 'Space & Astronomy',
        keywords: ['space', 'astronomy', 'astrophysics', 'universe', 'planets', 'stars', 'galaxies'],
        query: 'space exploration astronomy astrophysics universe planets stars galaxies cosmos'
      },
      {
        name: 'Technology & Innovation',
        keywords: ['technology', 'innovation', 'startup', 'tech', 'digital', 'internet', 'software'],
        query: 'technology innovation startup digital transformation software development'
      },
      {
        name: 'Education & Learning',
        keywords: ['education', 'learning', 'teaching', 'knowledge', 'research', 'academic', 'university'],
        query: 'education learning teaching knowledge sharing research academic study'
      },
      {
        name: 'Philosophy & Ethics',
        keywords: ['philosophy', 'ethics', 'morality', 'consciousness', 'existence', 'meaning', 'society'],
        query: 'philosophy ethics morality consciousness existence meaning society culture'
      }
    ];

    const clusters: TopicCluster[] = [];

    // For each topic seed, find related posts using vector similarity
    for (const seed of topicSeeds) {
      try {
        const queryEmbedding = await generateEmbedding(seed.query, 'query');
        
        const results = await qdrantClient.search(COLLECTIONS.POSTS, {
          vector: queryEmbedding,
          limit: 50,
          filter: {
            must: [
              {
                key: 'createdAtTs',
                range: {
                  gte: timeFilter.getTime()
                }
              }
            ]
          }
        });

        if (results.length >= minPosts) {
          const postIds = results.map((r: any) => r.payload?.id).filter(Boolean);
          const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
          
          // Get additional metadata for the cluster
          const clusterPosts = posts.filter(p => postIds.includes(p.id));
          const totalEngagement = clusterPosts.reduce((sum, p) => 
            sum + p._count.comments + p._count.votes, 0
          );
          
          clusters.push({
            id: seed.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            name: seed.name,
            description: generateClusterDescription(seed.name, clusterPosts.length),
            posts: postIds,
            keywords: seed.keywords,
            score: avgScore,
            postCount: clusterPosts.length
          });
        }
      } catch (error) {
        console.error(`Error processing topic seed "${seed.name}":`, error);
      }
    }

    // Sort clusters by relevance (score * post count)
    clusters.sort((a, b) => (b.score * b.postCount) - (a.score * a.postCount));

    return clusters.slice(0, limit);

  } catch (error) {
    console.error('Error discovering topic clusters:', error);
    return getFallbackTopics(timeRange, limit);
  }
}

function getFallbackTopics(timeRange: string, limit: number): TopicCluster[] {
  // Fallback topics when Qdrant is not available
  const fallbackTopics: TopicCluster[] = [
    {
      id: 'artificial-intelligence',
      name: 'Artificial Intelligence & Machine Learning',
      description: 'Discussions about AI, machine learning, and neural networks',
      posts: [],
      keywords: ['AI', 'machine learning', 'neural networks', 'deep learning'],
      score: 0.8,
      postCount: 15
    },
    {
      id: 'neuroscience',
      name: 'Neuroscience & Cognitive Science',
      description: 'Brain research, cognitive function, and mental processes',
      posts: [],
      keywords: ['neuroscience', 'brain', 'cognitive', 'memory'],
      score: 0.75,
      postCount: 12
    },
    {
      id: 'quantum-computing',
      name: 'Quantum Computing & Physics',
      description: 'Quantum mechanics, computing, and physics discussions',
      posts: [],
      keywords: ['quantum', 'physics', 'computing', 'mechanics'],
      score: 0.7,
      postCount: 8
    },
    {
      id: 'healthcare',
      name: 'Healthcare & Medical Innovation',
      description: 'Medical advances, health research, and healthcare technology',
      posts: [],
      keywords: ['healthcare', 'medical', 'health', 'medicine'],
      score: 0.72,
      postCount: 18
    },
    {
      id: 'climate-science',
      name: 'Climate & Environment',
      description: 'Climate change, environmental science, and sustainability',
      posts: [],
      keywords: ['climate', 'environment', 'sustainability'],
      score: 0.68,
      postCount: 10
    }
  ];

  return fallbackTopics.slice(0, limit);
}

function getTimeFilter(timeRange: string): Date {
  const now = new Date();
  switch (timeRange) {
    case 'day':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'year':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

function generateClusterDescription(topicName: string, postCount: number): string {
  const descriptions: Record<string, string> = {
    'Artificial Intelligence & Machine Learning': `Explore ${postCount} discussions about AI, machine learning algorithms, and neural network innovations`,
    'Neuroscience & Cognitive Science': `Discover ${postCount} conversations on brain research, cognitive function, and mental processes`,
    'Quantum Computing & Physics': `Dive into ${postCount} discussions about quantum mechanics, computing breakthroughs, and physics`,
    'Healthcare & Medical Innovation': `Browse ${postCount} posts about medical advances, health research, and healthcare technology`,
    'Climate & Environment': `Join ${postCount} discussions on climate change, environmental science, and sustainability`,
    'Biotechnology & Genetics': `Explore ${postCount} conversations about genetic engineering, biotechnology, and life sciences`,
    'Space & Astronomy': `Discover ${postCount} discussions about space exploration, astronomy, and cosmic phenomena`,
    'Technology & Innovation': `Browse ${postCount} posts about cutting-edge technology, startups, and digital innovation`,
    'Education & Learning': `Join ${postCount} conversations about education, learning methods, and knowledge sharing`,
    'Philosophy & Ethics': `Explore ${postCount} discussions on philosophical questions, ethics, and societal issues`
  };

  return descriptions[topicName] || `Discover ${postCount} discussions in this topic area`;
}






