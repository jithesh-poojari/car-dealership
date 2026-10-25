import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { HttpError, prismaCode } from '../errors.js';

export interface PublicUser {
  id: string;
  email: string;
  role: string;
}

// Lower cost in tests keeps the suite fast; production uses a strong cost factor.
const BCRYPT_ROUNDS = process.env.NODE_ENV === 'test' ? 4 : 12;

function toPublicUser(user: PublicUser): PublicUser {
  return { id: user.id, email: user.email, role: user.role };
}

/** Registers a user. Role is decided server-side: only ADMIN_EMAIL becomes ADMIN. */
export async function register(email: string, password: string): Promise<PublicUser> {
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const role = email === process.env.ADMIN_EMAIL ? 'ADMIN' : 'USER';

  try {
    const user = await prisma.user.create({ data: { email, passwordHash, role } });
    return toPublicUser(user);
  } catch (err) {
    if (prismaCode(err) === 'P2002') throw new HttpError(409, 'Email already registered');
    throw err;
  }
}

/** Verifies credentials and issues a JWT. Same error for unknown email and bad password. */
export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid credentials');
  }
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
  return { token, user: toPublicUser(user) };
}
