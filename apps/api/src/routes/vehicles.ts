import { Router, type Request } from 'express';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { restockSchema, searchSchema, vehicleSchema, vehicleUpdateSchema } from '../schemas.js';
import * as vehicles from '../services/vehicle.service.js';

export const vehiclesRouter = Router();

// Every vehicle/inventory route requires a valid token.
vehiclesRouter.use(authenticate);

const adminOnly = requireRole('ADMIN');

/** Route param as a plain string (Express 5 types allow string | string[]). */
const idOf = (req: Request): string => String(req.params.id);

vehiclesRouter.post('/', async (req, res) => {
  res.status(201).json({ vehicle: await vehicles.create(vehicleSchema.parse(req.body)) });
});

vehiclesRouter.get('/', async (_req, res) => {
  res.json({ vehicles: await vehicles.list() });
});

// Must be registered before '/:id', otherwise "search" is treated as an id.
vehiclesRouter.get('/search', async (req, res) => {
  res.json({ vehicles: await vehicles.search(searchSchema.parse(req.query)) });
});

vehiclesRouter.get('/:id', async (req, res) => {
  res.json({ vehicle: await vehicles.getById(idOf(req)) });
});

vehiclesRouter.put('/:id', async (req, res) => {
  const data = vehicleUpdateSchema.parse(req.body);
  res.json({ vehicle: await vehicles.update(idOf(req), data) });
});

vehiclesRouter.delete('/:id', adminOnly, async (req, res) => {
  await vehicles.remove(idOf(req));
  res.status(204).send();
});

vehiclesRouter.post('/:id/purchase', async (req, res) => {
  res.json({ vehicle: await vehicles.purchase(idOf(req)) });
});

vehiclesRouter.post('/:id/restock', adminOnly, async (req, res) => {
  const { quantity } = restockSchema.parse(req.body);
  res.json({ vehicle: await vehicles.restock(idOf(req), quantity) });
});
