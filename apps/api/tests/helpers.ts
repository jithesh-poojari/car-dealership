import { randomUUID } from 'node:crypto';
import type { Express } from 'express';
import request from 'supertest';
import { prisma } from '../src/db.js';

export const ADMIN_EMAIL = 'admin@dealership.test';
const ADMIN_PASS = 'AdminPass1!';

/** Wipes all tables so every test starts clean. Guarded so it can never hit real data. */
export async function resetDb() {
  if (!process.env.DATABASE_URL?.includes('schema=test')) {
    throw new Error('resetDb() refused: not connected to the test schema');
  }
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
}

/** Registers (if needed) and logs in a user, returning their JWT. */
export async function loginAs(app: Express, email: string, password = ADMIN_PASS) {
  await request(app).post('/api/auth/register').send({ email, password });
  const { body } = await request(app).post('/api/auth/login').send({ email, password });
  return body.token as string;
}

/** Registers a unique regular user and returns their token + email. */
export async function registerAndLogin(app: Express) {
  const email = `user_${randomUUID()}@example.com`;
  const password = 'UserPass1!';
  await request(app).post('/api/auth/register').send({ email, password });
  const { body } = await request(app).post('/api/auth/login').send({ email, password });
  return { token: body.token as string, email };
}
