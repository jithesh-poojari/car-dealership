import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';
import { resetDb, ADMIN_EMAIL } from './helpers.js';

const app = createApp();
const creds = { email: 'jane@example.com', password: 'Secret123!' };

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('POST /api/auth/register', () => {
  it('creates a user and never returns the password', async () => {
    const res = await request(app).post('/api/auth/register').send(creds);

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: creds.email, role: 'USER' });
    expect(res.body.user.id).toBeDefined();
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });

  it('stores a hash, not the plain password', async () => {
    await request(app).post('/api/auth/register').send(creds);
    const user = await prisma.user.findUnique({ where: { email: creds.email } });
    expect(user!.passwordHash).not.toBe(creds.password);
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send(creds);
    const res = await request(app).post('/api/auth/register').send(creds);
    expect(res.status).toBe(409);
  });

  it.each([
    [{ email: 'not-an-email', password: 'Secret123!' }],
    [{ email: 'a@b.com', password: 'short' }],
    [{}],
  ])('rejects invalid input %j with 400', async (body) => {
    const res = await request(app).post('/api/auth/register').send(body);
    expect(res.status).toBe(400);
  });

  it('ignores a client-supplied role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...creds, role: 'ADMIN' });
    expect(res.body.user.role).toBe('USER');
  });

  it('makes the configured ADMIN_EMAIL an admin', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: ADMIN_EMAIL, password: 'Secret123!' });
    expect(res.body.user.role).toBe('ADMIN');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(creds);
  });

  it('returns a token and user for valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send(creds);

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user.email).toBe(creds.email);
  });

  it('rejects a wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ ...creds, password: 'WrongPass1!' });
    expect(res.status).toBe(401);
  });

  it('rejects an unknown email with 401 (same as wrong password)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'Secret123!' });
    expect(res.status).toBe(401);
  });
});

describe('auth middleware via GET /api/auth/me', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with a malformed token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer garbage');
    expect(res.status).toBe(401);
  });

  it('returns the current user with a valid token', async () => {
    await request(app).post('/api/auth/register').send(creds);
    const { body } = await request(app).post('/api/auth/login').send(creds);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(creds.email);
  });
});
