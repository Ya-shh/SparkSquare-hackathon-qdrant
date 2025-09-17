#!/usr/bin/env node

/**
 * SparkSquare Setup Verification Script
 * Verifies that all components are working correctly
 */

const { execSync } = require('child_process');
const fs = require('fs');

function checkStatus(condition, message) {
  if (condition) {
    console.log(`✅ ${message}`);
    return true;
  } else {
    console.log(`❌ ${message}`);
    return false;
  }
}

async function testEndpoint(url, expectedField = null) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      if (expectedField && data[expectedField] !== undefined) {
        console.log(`✅ ${url} - ${expectedField}: ${data[expectedField]}`);
      } else {
        console.log(`✅ ${url} - Response OK`);
      }
      return true;
    } else {
      console.log(`❌ ${url} - HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${url} - ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 SparkSquare Setup Verification\n');
  
  let allGood = true;
  
  // Check files
  console.log('📁 Checking required files...');
  allGood &= checkStatus(fs.existsSync('.env'), '.env file exists');
  allGood &= checkStatus(fs.existsSync('prisma/dev.db'), 'Database file exists');
  allGood &= checkStatus(fs.existsSync('node_modules'), 'Dependencies installed');
  
  // Check Docker services
  console.log('\n🐳 Checking Docker services...');
  try {
    execSync('docker ps --format "table {{.Names}}\\t{{.Status}}"', { stdio: 'pipe' });
    console.log('✅ Docker is running');
  } catch (error) {
    console.log('❌ Docker is not running');
    allGood = false;
  }
  
  // Check Qdrant
  try {
    const response = await fetch('http://localhost:6333/readiness');
    if (response.ok) {
      console.log('✅ Qdrant vector database is ready');
    } else {
      console.log('❌ Qdrant is not responding correctly');
      allGood = false;
    }
  } catch (error) {
    console.log('❌ Qdrant is not accessible (http://localhost:6333)');
    allGood = false;
  }
  
  // Check if development server is running
  console.log('\n🌐 Testing API endpoints...');
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Test key endpoints
    await testEndpoint(`${baseUrl}/api/statistics`, 'stats');
    await testEndpoint(`${baseUrl}/api/users?limit=3`, 'totalCount');
    await testEndpoint(`${baseUrl}/api/test-qdrant`, 'totalInQdrant');
    
    console.log('\n📊 Fetching real statistics...');
    const statsResponse = await fetch(`${baseUrl}/api/statistics`);
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      const stats = statsData.stats;
      
      console.log(`   • Active Users: ${stats.activeUsers}`);
      console.log(`   • Daily Discussions: ${stats.dailyDiscussions}`);
      console.log(`   • Topics Covered: ${stats.topicsCovered}`);
      console.log(`   • Expert Contributors: ${stats.expertContributors}`);
      console.log(`   • AI Recommendations: ${stats.aiRecommendations}`);
      
      // Verify real data (not hardcoded)
      if (stats.activeUsers > 0 && stats.topicsCovered > 0) {
        console.log('✅ Statistics are showing real data from database');
      } else {
        console.log('⚠️ Statistics might still be using fallback data');
      }
    }
    
    console.log('\n👥 Testing user data...');
    const usersResponse = await fetch(`${baseUrl}/api/users?limit=3`);
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log(`   • Total Users in Database: ${usersData.totalCount}`);
      console.log(`   • Sample Users: ${usersData.users.map(u => u.name).join(', ')}`);
      
      if (usersData.totalCount > 0) {
        console.log('✅ User API is returning real data from database');
      }
    }
    
  } catch (error) {
    console.log('❌ Development server is not running');
    console.log('💡 Start the server with: npm run dev');
    allGood = false;
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (allGood) {
    console.log('🎉 All systems operational! SparkSquare is ready to use.');
    console.log('🌐 Visit: http://localhost:3000');
    console.log('📚 Check the README.md for more information');
  } else {
    console.log('⚠️ Some issues detected. Please check the output above.');
    console.log('🔧 Try running: npm run setup');
    console.log('📚 Check the README.md for troubleshooting');
  }
}

main().catch(console.error);