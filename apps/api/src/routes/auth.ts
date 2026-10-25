import { Router } from 'express';
import { authenticate, type AuthenticatedRequest } from '../middleware/authenticate.js';
import { loginSchema, registerSchema } from '../schemas.js';
import * as authService from '../services/auth.service.js';

export const authRouter = Router();

// Express 5 forwards rejected promises from async handlers to the error handler.

authRouter.post('/register', async (req, res) => {
  const { email, password } = registerSchema.parse(req.body);
  res.status(201).json({ user: await authService.register(email, password) });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  res.json(await authService.login(email, password));
});

authRouter.get('/me', authenticate, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});
