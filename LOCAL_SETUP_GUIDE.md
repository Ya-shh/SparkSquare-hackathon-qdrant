# 🚀 SparkSquare - Complete Local Setup Guide

This guide will help anyone run SparkSquare locally from scratch, even with zero prior knowledge of the project.

## 📋 Prerequisites

Before starting, ensure you have these installed on your system:

### Required Software
- **Node.js 18 or higher** - [Download here](https://nodejs.org/)
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download here](https://git-scm.com/downloads)

### Verify Installation
```bash
# Check Node.js version (should be 18+)
node --version

# Check npm is available
npm --version

# Check Docker is running
docker --version

# Check Git is available
git --version
```

## 🔧 Step-by-Step Setup

### Step 1: Clone the Repository

```bash
# Clone the project
git clone https://github.com/yashh/sparksquare.git

# Navigate to project directory
cd sparksquare
```

### Step 2: Install Dependencies

```bash
# Install all required packages
npm install
```

This will install all the necessary dependencies including Next.js, Prisma, Qdrant client, and AI libraries.

### Step 3: Start Qdrant Vector Database

Qdrant is required for the AI-powered search functionality.

```bash
# Pull and start Qdrant container
docker run -d -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant
```

**Verify Qdrant is running:**
```bash
# This should return "OK"
curl http://localhost:6333/readiness
```

### Step 4: Configure Environment Variables

```bash
# Copy the environment template
cp env.example .env.local
```

**Edit `.env.local` file with your preferred text editor:**

```bash
# Option 1: Using nano (beginner-friendly)
nano .env.local

# Option 2: Using VS Code
code .env.local

# Option 3: Using vim
vim .env.local
```

**Required Configuration:**
```env
# Database (SQLite for local development)
DATABASE_URL="file:./dev.db"

# NextAuth.js configuration
NEXTAUTH_SECRET="your-super-secret-key-change-this"
NEXTAUTH_URL="http://localhost:3000"

# Qdrant vector database
QDRANT_URL="http://localhost:6333"

# Optional: AI providers (at least one recommended)
OPENAI_API_KEY="your-openai-api-key"
MISTRAL_API_KEY="your-mistral-api-key"  
HF_API_KEY="your-huggingface-api-key"
```

**⚠️ Important Notes:**
- Change `NEXTAUTH_SECRET` to a random string (use: `openssl rand -base64 32`)
- AI API keys are optional but recommended for full functionality
- Without AI keys, the system will use mock embeddings (still works!)

### Step 5: Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed database with sample data
npx prisma db seed
```

### Step 6: Initialize Qdrant Collections

```bash
# Create vector collections for AI search
npx tsx scripts/init-qdrant.ts
```

### Step 7: Start the Development Server

```bash
# Start the application
npm run dev
```

**The application will be available at: [http://localhost:3000](http://localhost:3000)**

## ✅ Verification Steps

### 1. Check Application Status
```bash
# Test if the app is responding
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Should return: 200
```

### 2. Check Qdrant Collections
```bash
# List Qdrant collections
curl http://localhost:6333/collections | jq
```

### 3. Test Search Functionality
- Visit: [http://localhost:3000](http://localhost:3000)
- Try searching for posts
- Create a new post
- Test user registration

## 🛠️ Troubleshooting

### Common Issues & Solutions

#### 1. Port 3000 Already in Use
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process (replace PID with actual number)
kill -9 <PID>

# Or use a different port
npm run dev -- -p 3001
```

#### 2. Docker Issues
```bash
# Check if Docker is running
docker ps

# Restart Qdrant container
docker restart $(docker ps -q --filter ancestor=qdrant/qdrant)

# If container doesn't exist, start fresh
docker run -d -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant
```

#### 3. Database Issues
```bash
# Reset database if needed
rm prisma/dev.db*
npx prisma migrate reset
npx prisma db seed
```

#### 4. Node Modules Issues
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install
```

#### 5. Permission Issues (macOS/Linux)
```bash
# Fix permissions for qdrant_storage
sudo chown -R $(whoami) qdrant_storage/
```

## 🎯 Quick Start Commands

For experienced developers, here's the rapid setup:

```bash
# One-liner setup (after cloning)
git clone https://github.com/yashh/sparksquare.git && cd sparksquare && npm install && docker run -d -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant && cp env.example .env.local && npx prisma generate && npx prisma migrate dev --name init && npx prisma db seed && npx tsx scripts/init-qdrant.ts && npm run dev
```

**Just remember to edit `.env.local` with your configuration!**

## 🔧 Development Workflow

### Daily Development
```bash
# Start development (if containers already exist)
npm run dev

# With fresh containers
docker run -d -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant
npm run dev
```

### Making Changes
```bash
# Lint code
npm run lint

# Format code
npm run format

# Reset database with new seed data
npm run reset-db
```

### Adding New Content
```bash
# Reindex content for vector search
npx tsx scripts/index-content.ts
```

## 🌐 Production Deployment

### Using Docker Compose
```bash
# Production deployment
docker-compose up --build -d
```

### Environment for Production
Update `.env.local` for production:
```env
DATABASE_URL="postgresql://user:password@host:5432/sparksquare"
NEXTAUTH_URL="https://yourdomain.com"
QDRANT_URL="https://your-qdrant-cloud-instance.com"
```

## 📚 Additional Resources

- **Documentation**: Check the main README.md for detailed features
- **API Reference**: Visit `/api/docs` when running locally
- **Database Management**: Use `npx prisma studio` for database GUI
- **Vector Search Testing**: Visit `/search` page for semantic search demo

## 🆘 Need Help?

If you encounter issues:

1. **Check Prerequisites**: Ensure Node.js 18+, Docker, and Git are installed
2. **Review Error Messages**: Most errors are descriptive and self-explanatory
3. **Check Logs**: Use `docker logs [container-id]` for Qdrant issues
4. **Reset Everything**: Delete `node_modules`, `qdrant_storage`, and `dev.db`, then start fresh

## ✨ You're Ready!

Once setup is complete, you'll have:
- ✅ A fully functional AI-powered discussion platform
- ✅ Vector search with semantic understanding
- ✅ Real-time discussions and notifications
- ✅ User authentication and profiles
- ✅ Admin dashboard and content management

**Happy coding! 🎉**
