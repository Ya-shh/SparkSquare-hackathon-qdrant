import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Connection management
let connectionCount = 0;
const MAX_CONNECTIONS = 5;

export async function withDatabase<T>(operation: (prisma: PrismaClient) => Promise<T>): Promise<T> {
  if (connectionCount >= MAX_CONNECTIONS) {
    throw new Error('Database connection limit reached');
  }
  
  connectionCount++;
  try {
    return await operation(prisma);
  } finally {
    connectionCount--;
  }
}

export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.warn('Database unavailable:', error.message);
    return false;
  }
}
