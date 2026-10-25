import type { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { HttpError, prismaCode } from '../errors.js';
import type { SearchQuery, VehicleInput, VehicleUpdateInput } from '../schemas.js';

const notFound = () => new HttpError(404, 'Vehicle not found');

/** Runs a Prisma write and converts "record not found" into a 404. */
async function orNotFound<T>(op: () => Promise<T>): Promise<T> {
  try {
    return await op();
  } catch (err) {
    if (prismaCode(err) === 'P2025') throw notFound();
    throw err;
  }
}

export const create = (data: VehicleInput) => prisma.vehicle.create({ data });

export const list = () => prisma.vehicle.findMany({ orderBy: { createdAt: 'desc' } });

export async function getById(id: string) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw notFound();
  return vehicle;
}

/** Case-insensitive partial match on make/model/category, plus an inclusive price range. */
export function search(q: SearchQuery) {
  const where: Prisma.VehicleWhereInput = {
    ...(q.make && { make: { contains: q.make, mode: 'insensitive' } }),
    ...(q.model && { model: { contains: q.model, mode: 'insensitive' } }),
    ...(q.category && { category: { contains: q.category, mode: 'insensitive' } }),
    ...((q.minPrice !== undefined || q.maxPrice !== undefined) && {
      price: {
        ...(q.minPrice !== undefined && { gte: q.minPrice }),
        ...(q.maxPrice !== undefined && { lte: q.maxPrice }),
      },
    }),
  };
  return prisma.vehicle.findMany({ where, orderBy: { createdAt: 'desc' } });
}

export const update = (id: string, data: VehicleUpdateInput) =>
  orNotFound(() => prisma.vehicle.update({ where: { id }, data }));

export const remove = (id: string) =>
  orNotFound(() => prisma.vehicle.delete({ where: { id } })).then(() => undefined);

/**
 * Purchases one unit. The stock check and decrement happen in a single
 * conditional UPDATE, so concurrent buyers can never push quantity below zero.
 */
export async function purchase(id: string) {
  const { count } = await prisma.vehicle.updateMany({
    where: { id, quantity: { gt: 0 } },
    data: { quantity: { decrement: 1 } },
  });

  if (count === 0) {
    // Nothing updated: either the vehicle does not exist or it is out of stock.
    await getById(id); // throws 404 if missing
    throw new HttpError(409, 'Out of stock');
  }
  return getById(id);
}

export const restock = (id: string, amount: number) =>
  orNotFound(() =>
    prisma.vehicle.update({ where: { id }, data: { quantity: { increment: amount } } }),
  );
