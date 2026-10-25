import { prisma } from '../src/db';

export const ADMIN_EMAIL = 'admin@dealership.test';

/** Wipes all tables so every test starts clean. Guarded so it can never hit real data. */
export async function resetDb() {
  if (!process.env.DATABASE_URL?.includes('schema=test')) {
    throw new Error('resetDb() refused: not connected to the test schema');
  }
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
}
