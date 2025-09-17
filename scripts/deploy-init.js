const { execSync } = require('child_process');
const path = require('path');

console.log('Running prisma migrations...');
execSync('npx prisma migrate deploy', { stdio: 'inherit' });

console.log('Seeding the database...');
execSync('npm run seed', { stdio: 'inherit' });

console.log('Indexing content to Qdrant vector database...');
execSync('npm run index:content', { stdio: 'inherit' });

console.log('Initialization completed successfully!'); 