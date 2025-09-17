#!/bin/bash

echo "🚀 SparkSquare GitHub Push Script"
echo "================================="
echo ""

# Check if repository exists
echo "📝 Step 1: Create the repository at https://github.com/new"
echo "   Repository name: SparkSquare"
echo "   Description: 🚀 AI-Powered Discussion Platform with Qdrant Vector Database"
echo "   Public repository ✅"
echo "   Don't initialize with README"
echo ""

read -p "Have you created the repository? (y/n): " created

if [ "$created" != "y" ]; then
    echo "Please create the repository first, then run this script again."
    exit 1
fi

echo ""
echo "🔗 Step 2: Pushing to GitHub..."

# Push to GitHub
if git push -u origin main; then
    echo ""
    echo "🎉 Success! SparkSquare has been pushed to GitHub!"
    echo ""
    echo "📋 Your repository is now available at:"
    echo "   https://github.com/Ya-shh/SparkSquare"
    echo ""
    echo "🌟 Don't forget to:"
    echo "   1. Star your own repository"
    echo "   2. Add topics: ai, qdrant, vector-database, semantic-search, nextjs"
    echo "   3. Update your GitHub profile README to showcase this project"
    echo ""
    echo "📚 Key files to highlight:"
    echo "   • QDRANT_INSIGHTS.md - Deep dive into vector database usage"
    echo "   • QUICKSTART.md - 5-minute setup guide" 
    echo "   • README.md - Complete project overview"
    echo ""
else
    echo ""
    echo "❌ Push failed. Make sure you:"
    echo "   1. Created the repository on GitHub"
    echo "   2. Have the correct repository name (SparkSquare)"
    echo "   3. Have push permissions"
    echo ""
    echo "You can manually run:"
    echo "   git push -u origin main"
fi
