#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command) {
  console.log(`\n> ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Failed to execute ${command}`, error);
    process.exit(1);
  }
}

async function deploy() {
  console.log('🚀 Starting SparkSquare deployment preparation');

  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    console.log('Creating .env file from .env.example');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('⚠️ Please update your .env file with your actual credentials before deploying');
  }

  console.log('📦 Installing dependencies...');
  runCommand('npm ci');

  console.log('🔧 Generating Prisma client...');
  runCommand('npx prisma generate');

  console.log('🏗️ Building the application...');
  runCommand('npm run build');
  
  console.log('\n✅ Deployment preparation completed successfully!');
  console.log('\nTo deploy to Vercel:');
  console.log('1. Make sure all your environment variables are set in your Vercel project settings');
  console.log('2. Run: vercel --prod');
  console.log('\nTo test locally before deploying:');
  console.log('1. Run: npm start');
}

deploy().catch(error => {
  console.error('Deployment preparation failed:', error);
  process.exit(1);
}); 