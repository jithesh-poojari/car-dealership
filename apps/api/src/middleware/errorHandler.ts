import type { NextFunction, Request, Response } from 'express';
import { z, ZodError } from 'zod';
import { HttpError } from '../errors.js';

/** 404 for any route that did not match. */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Route not found' });
}

/** Central error handler: validation -> 400, HttpError -> its status, anything else -> 500. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Invalid input', details: z.flattenError(err) });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  // Malformed JSON body from express.json()
  if (typeof err === 'object' && err !== null && (err as { type?: string }).type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Malformed JSON' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
