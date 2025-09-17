# 🌟 SparkSquare - AI-Powered Discussion Platform

> 🏆 **Hackathon Submission**: Advanced AI discussion platform showcasing cutting-edge vector database technology and real-time semantic intelligence.

A modern discussion platform with advanced AI features including vector search, semantic understanding, and intelligent recommendations powered by Qdrant vector database. This project demonstrates enterprise-grade implementation of vector databases for creating intelligent, semantically-aware user experiences.

## ✨ Features

- **Vector Search**: Semantic search across posts, comments, and users using Qdrant
- **AI Recommendations**: Intelligent content suggestions based on user preferences
- **Real Statistics**: Live user counts, activity metrics, and community statistics from database
- **Live Activity Feed**: Real-time AI-powered activity updates with Qdrant integration
- **Modern UI**: Clean, responsive interface with dark mode support
- **Real-time Updates**: Live discussions and notifications
- **User Profiles**: Comprehensive user management with achievements
- **Threaded Discussions**: Organized comment system with voting
- **Category Management**: Browse discussions by topic

## 🛠 Tech Stack

- **Frontend**: Next.js 14, TailwindCSS, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (development) / PostgreSQL (production)
- **Vector Database**: Qdrant
- **Authentication**: NextAuth.js
- **AI**: OpenAI, Mistral AI, HuggingFace

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker (for Qdrant)
- Git

### Option 1: Automatic Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/yashh/sparksquare.git
cd sparksquare

# Run automated setup (interactive)
npm run first-setup
```

This interactive script will:
- Install all dependencies
- Start Qdrant vector database
- Configure environment variables
- Setup database and seed data with real users
- Initialize AI collections
- Optionally start the development server

After setup, verify everything is working:
```bash
npm run verify
```

### Option 2: Manual Setup

1. **Clone the repository**
```bash
git clone https://github.com/yashh/sparksquare.git
cd sparksquare
```

2. **Install dependencies**
```bash
npm install
```

3. **Start Qdrant vector database**
```bash
docker run -d -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant
```

4. **Configure environment**
```bash
cp env.example .env.local
```

5. **Setup database**
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

6. **Initialize Qdrant collections**
```bash
npx tsx scripts/init-qdrant.ts
```

7. **Start development server**
```bash
npm run dev
```

### Verification

```bash
# Verify your setup is working
npm run verify
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

> 📖 **Need detailed instructions?** See [LOCAL_SETUP_GUIDE.md](LOCAL_SETUP_GUIDE.md) for comprehensive setup documentation.

## 📁 Project Structure

```
src/
├── app/                 # Next.js app router pages
│   ├── api/            # API endpoints
│   ├── posts/          # Post pages
│   ├── search/         # Search interface
│   └── users/          # User profiles
├── components/         # React components
├── lib/                # Utilities and configurations
│   ├── auth.ts         # Authentication setup
│   ├── db.ts           # Database client
│   └── qdrant.ts       # Vector database client
└── types/              # TypeScript type definitions

prisma/
├── schema.prisma       # Database schema
├── migrations/         # Database migrations
└── seed.ts            # Database seeding

scripts/               # Setup and utility scripts
public/               # Static assets
```

## 🧠 AI Features

### Vector Search
The platform uses Qdrant for semantic search across all content:
- Posts are automatically indexed with vector embeddings
- Search by meaning, not just keywords
- Supports multiple embedding providers (OpenAI, Mistral, HuggingFace)

### Intelligent Recommendations
- Content-based filtering using vector similarity
- User behavior analysis
- Category-aware suggestions

## 🔧 Available Scripts

- `npm run first-setup` - Interactive first-time setup
- `npm run verify` - Verify your setup is working
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run reset-db` - Reset and reseed database

## 🐳 Docker Deployment

For production deployment with Docker:

```bash
# Build and start all services
docker-compose up --build -d
```

This starts:
- SparkSquare application on port 3000
- Qdrant vector database on port 6333
- PostgreSQL database on port 5432

## 🌐 Environment Variables

### Required
- `DATABASE_URL` - Database connection string
- `NEXTAUTH_SECRET` - NextAuth.js secret key
- `NEXTAUTH_URL` - Application URL
- `QDRANT_URL` - Qdrant database URL

### Optional
- `OPENAI_API_KEY` - For OpenAI embeddings
- `MISTRAL_API_KEY` - For Mistral AI embeddings
- `HF_API_KEY` - For HuggingFace embeddings
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - Google OAuth
- `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET` - GitHub OAuth

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 🆕 Recent Updates (Latest Version)

### Real Data Integration
- ✅ **Fixed Statistics**: Community stats now show real data from database instead of hardcoded values
- ✅ **Live User Counts**: "Our Community (X Members)" now displays actual user count from database  
- ✅ **Real Authors**: User profiles and posts show actual users from database, not mock data
- ✅ **Working Qdrant**: Live Activity feed uses real Qdrant vector search for AI recommendations
- ✅ **Database API**: New `/api/users` endpoint for fetching real user data with pagination and search
- ✅ **Enhanced Setup**: Improved setup scripts ensure new users get working real data from the start

### Statistics Now Show:
- **Active Members**: Real count from database (e.g., 3 instead of hardcoded 24)
- **Daily Discussions**: Calculated from actual posts + comments activity
- **Topics Covered**: Real category count from database
- **Expert Contributors**: Users who have actually created posts
- **AI Recommendations**: Powered by real Qdrant vector embeddings

### Fixed Issues:
- Environment file creation (`.env` instead of `.env.local`)
- Prisma seed script configuration (TypeScript support)
- Database connection and real-time statistics
- Live Activity showing genuine "🤖 Qdrant AI-Powered" functionality

## 👨‍💻 Author

**Yash** - AI Engineer focusing on NLP, MLOps & AI  
🔗 [GitHub](https://github.com/Ya-shh) | 🤗 [HuggingFace](https://huggingface.co/yashvardhan7) | 📍 Mumbai, India

*Interested in NLP, MLOps & AI. Currently expanding knowledge in Advanced RAG & Generative AI.*

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Qdrant](https://qdrant.tech/) - Vector database
- [Prisma](https://prisma.io/) - Database ORM
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [TailwindCSS](https://tailwindcss.com/) - Styling
