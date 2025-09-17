#!/usr/bin/env node

/**
 * SparkSquare First-Time Setup Script
 * Automates the entire setup process for new users
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function runCommand(command, description) {
  try {
    console.log(`🔄 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed\n`);
    return true;
  } catch (error) {
    console.log(`❌ ${description} failed:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Welcome to SparkSquare First-Time Setup!\n');
  console.log('This script will set up everything you need to run SparkSquare locally.\n');

  // Check if .env exists (updated to use .env instead of .env.local)
  if (!fs.existsSync('.env')) {
    console.log('📝 Setting up environment configuration...');
    
    if (fs.existsSync('env.example')) {
      fs.copyFileSync('env.example', '.env');
      console.log('✅ Created .env from template\n');
      
      console.log('🔧 You may want to add your API keys later for full AI functionality:');
      console.log('   • OPENAI_API_KEY for OpenAI embeddings');
      console.log('   • MISTRAL_API_KEY for Mistral AI');
      console.log('   • HF_API_KEY for HuggingFace models\n');
      
      const editEnv = await ask('Would you like to edit .env now? (y/n): ');
      if (editEnv.toLowerCase() === 'y') {
        console.log('Opening .env in your default editor...');
        try {
          execSync('code .env || nano .env', { stdio: 'inherit' });
        } catch (error) {
          console.log('Please manually edit .env file');
        }
      }
    } else {
      console.log('❌ env.example not found. Creating basic .env...');
      const basicEnv = `DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="your-super-secret-key-change-this"
NEXTAUTH_URL="http://localhost:3000"
QDRANT_URL="http://localhost:6333"
`;
      fs.writeFileSync('.env', basicEnv);
      console.log('✅ Created basic .env\n');
    }
  }

  // Check if Docker is running
  try {
    execSync('docker ps', { stdio: 'pipe' });
  } catch (error) {
    console.log('❌ Docker is not running. Please start Docker Desktop and try again.');
    process.exit(1);
  }

  // Check if Qdrant is already running
  try {
    execSync('curl -s http://localhost:6333/readiness', { stdio: 'pipe' });
    console.log('✅ Qdrant is already running\n');
  } catch (error) {
    console.log('🐳 Starting Qdrant vector database...');
    const startQdrant = runCommand(
      'docker run -d -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant',
      'Starting Qdrant container'
    );
    
    if (startQdrant) {
      console.log('⏳ Waiting for Qdrant to be ready...');
      let retries = 10;
      while (retries > 0) {
        try {
          execSync('curl -s http://localhost:6333/readiness', { stdio: 'pipe' });
          console.log('✅ Qdrant is ready!\n');
          break;
        } catch (error) {
          retries--;
          if (retries === 0) {
            console.log('❌ Qdrant failed to start. Please check Docker logs.');
            process.exit(1);
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
  }

  // Install dependencies
  if (!fs.existsSync('node_modules')) {
    runCommand('npm install', 'Installing dependencies');
  } else {
    console.log('✅ Dependencies already installed\n');
  }

  // Setup database
  runCommand('npx prisma generate', 'Generating Prisma client');
  runCommand('npx prisma db push', 'Setting up database schema');
  runCommand('npm run seed', 'Seeding database with sample data');

  // Initialize Qdrant collections
  runCommand('npx tsx scripts/init-qdrant.ts', 'Initializing Qdrant collections');

  console.log('🎉 Setup complete! Your SparkSquare installation is ready.\n');
  
  const startNow = await ask('Would you like to start the development server now? (y/n): ');
  
  if (startNow.toLowerCase() === 'y') {
    console.log('🚀 Starting SparkSquare...\n');
    console.log('Visit: http://localhost:3000');
    console.log('Press Ctrl+C to stop the server\n');
    
    // Start the development server
    spawn('npm', ['run', 'dev'], { stdio: 'inherit' });
  } else {
    console.log('📋 To start SparkSquare later, run: npm run dev');
    console.log('📋 To verify your setup, run: npm run verify');
    console.log('📋 Visit: http://localhost:3000 when running\n');
  }

  rl.close();
}

main().catch(console.error);
