import cors from 'cors';
import express from 'express';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';
import { vehiclesRouter } from './routes/vehicles.js';

/** Builds the Express app. Kept separate from server.ts so tests can import it. */
export function createApp() {
  const app = express();

  // FRONTEND_URL may be a comma-separated list; unset means allow any origin (dev).
  const origins = process.env.FRONTEND_URL?.split(',').map((o) => o.trim()).filter(Boolean);
  app.use(cors(origins?.length ? { origin: origins } : undefined));
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api/auth', authRouter);
  app.use('/api/vehicles', vehiclesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
