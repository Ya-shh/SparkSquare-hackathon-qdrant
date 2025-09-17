import UserProfileMini from "@/components/UserProfileMini";
import { hybridSearch, isQdrantReady } from "@/lib/qdrant";
import { withDatabase, isDatabaseAvailable } from "@/lib/db-singleton";

interface UsersPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || "1");
  const searchQuery = resolvedSearchParams.search || "";
  const usersPerPage = 20;

  // Try to get users from Qdrant first, fallback to our seed data
  let users = [];
  let totalUsers = 0;

  try {
    // Try to fetch real users from database API first
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/users?page=${page}&limit=${usersPerPage}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`;
    
    const response = await fetch(apiUrl, { cache: 'no-store' });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.users.length > 0) {
        users = data.users;
        totalUsers = data.totalCount;
      } else {
        // Fallback to seed data if no real users found
        users = await getFallbackUsers(page, usersPerPage, searchQuery);
        totalUsers = 6; // Known database user count
      }
    } else {
      throw new Error('API request failed');
    }
  } catch (error) {
    console.error('Error fetching users from database:', error);
    
    // Try Qdrant as secondary fallback if available and search query provided
    try {
      const qdrantReady = await isQdrantReady();
      
      if (qdrantReady && searchQuery) {
        const searchResults = await hybridSearch(searchQuery, 'users', {
          limit: usersPerPage,
          offset: (page - 1) * usersPerPage,
          scoreThreshold: 0.3
        });
        
        users = searchResults.map(result => ({
          id: result.id,
          name: result.title || result.name || 'Anonymous User',
          username: result.username || `user_${result.id?.slice(0, 8)}`,
          email: result.email || `${result.username || 'user'}@sparksquare.com`,
          image: result.image || '/default-avatar.svg',
          bio: result.content || result.description || 'Community member passionate about knowledge sharing.',
          location: result.location || 'Global Community',
          createdAt: result.createdAt || new Date().toISOString(),
          _count: {
            posts: Math.floor(Math.random() * 10) + 1,
            comments: Math.floor(Math.random() * 20) + 5
          }
        }));
        totalUsers = Math.max(searchResults.length, 6);
      } else {
        // Final fallback to seed data
        users = await getFallbackUsers(page, usersPerPage, searchQuery);
        totalUsers = 6;
      }
    } catch (qdrantError) {
      console.error('Qdrant also failed, using seed data:', qdrantError);
      users = await getFallbackUsers(page, usersPerPage, searchQuery);
      totalUsers = 6;
    }
  }

  const totalPages = Math.ceil(totalUsers / usersPerPage);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Our Community ({totalUsers.toLocaleString()} Members)
        </h1>
        
        {/* Simple Search Form */}
        <div className="mb-8">
          <form action="/users" method="GET" className="max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                name="search"
                placeholder="Search users by name, username, or email..."
                defaultValue={searchQuery}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-white placeholder-gray-400"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {users.map((user) => (
            <UserProfileMini key={user.id} user={user} />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            {page > 1 && (
              <a
                href={`/users?page=${page - 1}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""}`}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Previous
              </a>
            )}
            
            <span className="px-4 py-2 bg-gray-100 rounded">
              Page {page} of {totalPages}
            </span>
            
            {page < totalPages && (
              <a
                href={`/users?page=${page + 1}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""}`}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Next
              </a>
            )}
          </div>
        )}

        {users.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            {searchQuery ? (
              <p>No users found matching "{searchQuery}"</p>
            ) : (
              <p>No users found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

async function getFallbackUsers(page: number, usersPerPage: number, searchQuery: string) {
  // Fallback users data from our English seed
  const allUsers = [
    {
      id: "1",
      name: "Admin User",
      username: "admin",
      email: "admin@sparksquare.com",
      image: "/default-avatar.svg",
      bio: "Platform administrator ensuring smooth operations and community guidelines.",
      location: "Global",
      createdAt: new Date().toISOString(),
      _count: { posts: 15, comments: 45 }
    },
    {
      id: "2", 
      name: "Dr. Sarah Chen",
      username: "sarahc",
      email: "sarah.chen@sparksquare.com",
      image: "/default-avatar.svg",
      bio: "Neuroscientist & Memory Expert researching cognitive enhancement techniques.",
      location: "Stanford, CA",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      _count: { posts: 8, comments: 23 }
    },
    {
      id: "3",
      name: "Marcus Johnson", 
      username: "mjohnson",
      email: "marcus.johnson@sparksquare.com",
      image: "/default-avatar.svg",
      bio: "AI Healthcare Strategist exploring the intersection of technology and medicine.",
      location: "Boston, MA",
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      _count: { posts: 12, comments: 31 }
    },
    {
      id: "4",
      name: "Dr. Eliza Wong",
      username: "ewong", 
      email: "eliza.wong@sparksquare.com",
      image: "/default-avatar.svg",
      bio: "Quantum Computing Researcher pushing the boundaries of computational science.",
      location: "Cambridge, MA",
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      _count: { posts: 6, comments: 18 }
    },
    {
      id: "5",
      name: "David Rodriguez",
      username: "davidr",
      email: "david.rodriguez@sparksquare.com", 
      image: "/default-avatar.svg",
      bio: "Technology entrepreneur and innovation strategist with 15+ years experience.",
      location: "Austin, TX",
      createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      _count: { posts: 10, comments: 27 }
    },
    {
      id: "6",
      name: "Emma Thompson",
      username: "emmat",
      email: "emma.thompson@sparksquare.com",
      image: "/default-avatar.svg", 
      bio: "Science communicator making complex research accessible to everyone.",
      location: "London, UK",
      createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      _count: { posts: 9, comments: 24 }
    }
  ];

  // Filter by search query if provided
  let filteredUsers = allUsers;
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredUsers = allUsers.filter(user => 
      user.name.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query) ||
      user.bio.toLowerCase().includes(query)
    );
  }

  // Paginate
  const startIndex = (page - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  return filteredUsers.slice(startIndex, endIndex);
}
