# 🚀 SparkSquare Quick Start Guide

Get SparkSquare running in under 5 minutes!

## Prerequisites
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop)
- **Git** - [Download here](https://git-scm.com/)

## Installation

### 1. Clone & Navigate
```bash
git clone https://github.com/yashh/sparksquare.git
cd sparksquare
```

### 2. Automated Setup (Recommended)
```bash
npm run first-setup
```

This will:
- ✅ Install dependencies
- ✅ Start Qdrant vector database
- ✅ Create `.env` file
- ✅ Setup SQLite database
- ✅ Seed with real users and posts  
- ✅ Initialize AI collections
- ✅ Optionally start the server

### 3. Verify Installation
```bash
npm run verify
```

### 4. Start Development Server
```bash
npm run dev
```

🌐 **Visit: http://localhost:3000**

## What You'll See

### Real Data Features:
- **3 Active Members** (real database count)
- **Real User Profiles**: Admin User, John Doe, Jane Smith
- **Live Statistics**: Actual post/comment counts
- **AI-Powered Activity**: Genuine Qdrant vector search
- **Working Search**: Semantic search across content

### Sample Content:
- "How to improve brain memory and cognition" by Sarah Chen
- "The future of AI in healthcare" by Marcus Johnson  
- "Understanding quantum computing basics" by Eliza Wong

## Troubleshooting

### Common Issues:

1. **"Database file not found"**
   ```bash
   npm run setup
   ```

2. **"Qdrant not responding"**
   ```bash
   docker run -d -p 6333:6333 qdrant/qdrant
   ```

3. **"No users found"**
   ```bash
   npm run seed
   ```

4. **Verify everything works**
   ```bash
   npm run verify
   ```

## Next Steps

1. **Add API Keys** (optional but recommended):
   Edit `.env` file:
   ```env
   OPENAI_API_KEY="your-key-here"
   MISTRAL_API_KEY="your-key-here" 
   ```

2. **Explore Features**:
   - Try the semantic search
   - Check the live activity feed
   - Browse user profiles
   - Create new posts

3. **Development**:
   - See `README.md` for detailed documentation
   - Check `/api` routes for backend API
   - Explore `/src/components` for UI components

## Support

- 📚 **Full Documentation**: See `README.md`
- 🐛 **Issues**: Report on GitHub
- 💬 **Discussions**: Use GitHub Discussions

---

**That's it! SparkSquare should now be running with real data and AI features.** 🎉
