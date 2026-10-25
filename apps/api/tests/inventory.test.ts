import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';
import { ADMIN_EMAIL, loginAs, registerAndLogin, resetDb } from './helpers.js';

const app = createApp();
const vehicleBody = { make: 'Toyota', model: 'Camry', category: 'Sedan', price: 25000, quantity: 5 };

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

async function seed(token: string, overrides = {}) {
  const res = await request(app)
    .post('/api/vehicles')
    .set(auth(token))
    .send({ ...vehicleBody, ...overrides });
  return res.body.vehicle.id as string;
}

describe('purchase', () => {
  it('returns 404 for an unknown vehicle', async () => {
    const { token } = await registerAndLogin(app);
    const res = await request(app).post('/api/vehicles/nope/purchase').set(auth(token));
    expect(res.status).toBe(404);
  });

  it('requires authentication', async () => {
    const res = await request(app).post('/api/vehicles/any/purchase');
    expect(res.status).toBe(401);
  });

  it('never oversells under concurrent purchases', async () => {
    const { token } = await registerAndLogin(app);
    const id = await seed(token, { quantity: 1 });

    const results = await Promise.all(
      Array.from({ length: 5 }, () => request(app).post(`/api/vehicles/${id}/purchase`).set(auth(token))),
    );

    const statuses = results.map((r) => r.status).sort();
    expect(statuses.filter((s) => s === 200)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(4);
    expect((await prisma.vehicle.findUnique({ where: { id } }))!.quantity).toBe(0);
  });
});

describe('restock', () => {
  it.each([[{ quantity: 0 }], [{ quantity: -5 }], [{ quantity: 1.5 }], [{}]])(
    'rejects invalid body %j with 400',
    async (body) => {
      const adminToken = await loginAs(app, ADMIN_EMAIL);
      const id = await seed(adminToken);
      const res = await request(app).post(`/api/vehicles/${id}/restock`).set(auth(adminToken)).send(body);
      expect(res.status).toBe(400);
    },
  );

  it('returns 404 for an unknown vehicle', async () => {
    const adminToken = await loginAs(app, ADMIN_EMAIL);
    const res = await request(app)
      .post('/api/vehicles/nope/restock')
      .set(auth(adminToken))
      .send({ quantity: 3 });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/vehicles/:id', () => {
  it('returns the vehicle', async () => {
    const { token } = await registerAndLogin(app);
    const id = await seed(token);
    const res = await request(app).get(`/api/vehicles/${id}`).set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.vehicle.id).toBe(id);
  });

  it('returns 404 when missing', async () => {
    const { token } = await registerAndLogin(app);
    const res = await request(app).get('/api/vehicles/nope').set(auth(token));
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/vehicles/:id', () => {
  it('returns 404 for an admin deleting an unknown vehicle', async () => {
    const adminToken = await loginAs(app, ADMIN_EMAIL);
    const res = await request(app).delete('/api/vehicles/nope').set(auth(adminToken));
    expect(res.status).toBe(404);
  });
});

describe('search validation and filters', () => {
  it('rejects a non-numeric price with 400', async () => {
    const { token } = await registerAndLogin(app);
    const res = await request(app).get('/api/vehicles/search?minPrice=abc').set(auth(token));
    expect(res.status).toBe(400);
  });

  it('rejects minPrice greater than maxPrice with 400', async () => {
    const { token } = await registerAndLogin(app);
    const res = await request(app).get('/api/vehicles/search?minPrice=500&maxPrice=100').set(auth(token));
    expect(res.status).toBe(400);
  });

  it('filters by model and category and combines filters', async () => {
    const { token } = await registerAndLogin(app);
    await seed(token);
    await seed(token, { make: 'Ford', model: 'F-150', category: 'Truck', price: 40000 });

    const byCategory = await request(app).get('/api/vehicles/search?category=truck').set(auth(token));
    expect(byCategory.body.vehicles.map((v: { model: string }) => v.model)).toEqual(['F-150']);

    const byModel = await request(app).get('/api/vehicles/search?model=cam').set(auth(token));
    expect(byModel.body.vehicles).toHaveLength(1);

    const combined = await request(app)
      .get('/api/vehicles/search?make=toyota&maxPrice=30000')
      .set(auth(token));
    expect(combined.body.vehicles).toHaveLength(1);
  });

  it('returns everything when no filters are given', async () => {
    const { token } = await registerAndLogin(app);
    await seed(token);
    const res = await request(app).get('/api/vehicles/search').set(auth(token));
    expect(res.body.vehicles).toHaveLength(1);
  });
});

describe('app-level behaviour', () => {
  it('GET /api/health returns ok without auth', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nothing');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{bad json');
    expect(res.status).toBe(400);
  });
});
