import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';
import { resetDb, ADMIN_EMAIL, loginAs, registerAndLogin } from './helpers.js';

const app = createApp();

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

// ─── Helpers ──────────────────────────────────────────────────────────────────

const vehicleBody = {
  make: 'Toyota',
  model: 'Camry',
  category: 'Sedan',
  price: 25000,
  quantity: 5,
};

async function addVehicle(token: string, overrides = {}) {
  return request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${token}`)
    .send({ ...vehicleBody, ...overrides });
}

// ─── POST /api/vehicles ───────────────────────────────────────────────────────

describe('POST /api/vehicles', () => {
  it('creates a vehicle for an authenticated user', async () => {
    const { token } = await registerAndLogin(app);
    const res = await addVehicle(token);

    expect(res.status).toBe(201);
    expect(res.body.vehicle).toMatchObject({
      make: 'Toyota',
      model: 'Camry',
      price: 25000,
      quantity: 5,
    });
    expect(res.body.vehicle.id).toBeDefined();
  });

  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).post('/api/vehicles').send(vehicleBody);
    expect(res.status).toBe(401);
  });

  it('rejects invalid input with 400', async () => {
    const { token } = await registerAndLogin(app);
    const res = await addVehicle(token, { price: -100 });
    expect(res.status).toBe(400);
  });
});

// ─── GET /api/vehicles ────────────────────────────────────────────────────────

describe('GET /api/vehicles', () => {
  it('returns all vehicles for authenticated users', async () => {
    const { token } = await registerAndLogin(app);
    await addVehicle(token);
    await addVehicle(token, { make: 'Honda', model: 'Civic' });

    const res = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.vehicles).toHaveLength(2);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/vehicles');
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/vehicles/search ─────────────────────────────────────────────────

describe('GET /api/vehicles/search', () => {
  it('filters by make (case-insensitive)', async () => {
    const { token } = await registerAndLogin(app);
    await addVehicle(token, { make: 'Toyota' });
    await addVehicle(token, { make: 'Honda', model: 'Civic' });

    const res = await request(app)
      .get('/api/vehicles/search?make=toy')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.vehicles).toHaveLength(1);
    expect(res.body.vehicles[0].make).toBe('Toyota');
  });

  it('filters by price range', async () => {
    const { token } = await registerAndLogin(app);
    await addVehicle(token, { price: 20000 });
    await addVehicle(token, { make: 'BMW', model: 'M3', price: 80000 });

    const res = await request(app)
      .get('/api/vehicles/search?minPrice=15000&maxPrice=30000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.vehicles).toHaveLength(1);
    expect(res.body.vehicles[0].price).toBe(20000);
  });
});

// ─── PUT /api/vehicles/:id ────────────────────────────────────────────────────

describe('PUT /api/vehicles/:id', () => {
  it('updates a vehicle', async () => {
    const { token } = await registerAndLogin(app);
    const { body } = await addVehicle(token);
    const id = body.vehicle.id;

    const res = await request(app)
      .put(`/api/vehicles/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ price: 28000 });

    expect(res.status).toBe(200);
    expect(res.body.vehicle.price).toBe(28000);
  });

  it('returns 404 for a non-existent vehicle', async () => {
    const { token } = await registerAndLogin(app);
    const res = await request(app)
      .put('/api/vehicles/non-existent-id')
      .set('Authorization', `Bearer ${token}`)
      .send({ price: 1000 });
    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/vehicles/:id ─────────────────────────────────────────────────

describe('DELETE /api/vehicles/:id', () => {
  it('allows an admin to delete a vehicle', async () => {
    const adminToken = await loginAs(app, ADMIN_EMAIL);
    const { body } = await addVehicle(adminToken);
    const id = body.vehicle.id;

    const res = await request(app)
      .delete(`/api/vehicles/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
    expect(await prisma.vehicle.findUnique({ where: { id } })).toBeNull();
  });

  it('forbids a regular user from deleting with 403', async () => {
    const adminToken = await loginAs(app, ADMIN_EMAIL);
    const { token } = await registerAndLogin(app);
    const { body } = await addVehicle(adminToken);
    const id = body.vehicle.id;

    const res = await request(app)
      .delete(`/api/vehicles/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

// ─── POST /api/vehicles/:id/purchase ─────────────────────────────────────────

describe('POST /api/vehicles/:id/purchase', () => {
  it('decrements quantity by 1', async () => {
    const { token } = await registerAndLogin(app);
    const { body } = await addVehicle(token, { quantity: 3 });
    const id = body.vehicle.id;

    const res = await request(app)
      .post(`/api/vehicles/${id}/purchase`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.vehicle.quantity).toBe(2);
  });

  it('returns 409 when out of stock', async () => {
    const { token } = await registerAndLogin(app);
    const { body } = await addVehicle(token, { quantity: 0 });
    const id = body.vehicle.id;

    const res = await request(app)
      .post(`/api/vehicles/${id}/purchase`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
  });
});

// ─── POST /api/vehicles/:id/restock ──────────────────────────────────────────

describe('POST /api/vehicles/:id/restock', () => {
  it('allows an admin to restock', async () => {
    const adminToken = await loginAs(app, ADMIN_EMAIL);
    const { body } = await addVehicle(adminToken, { quantity: 2 });
    const id = body.vehicle.id;

    const res = await request(app)
      .post(`/api/vehicles/${id}/restock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: 10 });

    expect(res.status).toBe(200);
    expect(res.body.vehicle.quantity).toBe(12);
  });

  it('forbids a regular user from restocking with 403', async () => {
    const adminToken = await loginAs(app, ADMIN_EMAIL);
    const { token } = await registerAndLogin(app);
    const { body } = await addVehicle(adminToken);
    const id = body.vehicle.id;

    const res = await request(app)
      .post(`/api/vehicles/${id}/restock`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 5 });

    expect(res.status).toBe(403);
  });
});
