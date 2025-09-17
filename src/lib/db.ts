import { prisma } from './db/hooks';

export const db = prisma;

export async function isDatabaseReachable(timeoutMs: number = 500): Promise<boolean> {
  try {
    // Simple connect test with timeout race
    await Promise.race([
      db.$connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('db-timeout')), timeoutMs)),
    ]);
    return true;
  } catch {
    return false;
  }
}