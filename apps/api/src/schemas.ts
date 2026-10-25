import { z } from 'zod';

/** Request validation schemas, kept in one place so routes stay thin. */

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

export const vehicleSchema = z.object({
  make: z.string().trim().min(1),
  model: z.string().trim().min(1),
  category: z.string().trim().min(1),
  price: z.number().positive(),
  quantity: z.number().int().min(0).default(0),
});

export const vehicleUpdateSchema = vehicleSchema.partial();

export const restockSchema = z.object({
  quantity: z.number().int().positive(),
});

/** Query-string filters for GET /api/vehicles/search. Omit a param rather than sending it empty. */
export const searchSchema = z
  .object({
    make: z.string().trim().min(1).optional(),
    model: z.string().trim().min(1).optional(),
    category: z.string().trim().min(1).optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().nonnegative().optional(),
  })
  .refine((q) => q.minPrice === undefined || q.maxPrice === undefined || q.minPrice <= q.maxPrice, {
    message: 'minPrice must be less than or equal to maxPrice',
  });

export type VehicleInput = z.infer<typeof vehicleSchema>;
export type VehicleUpdateInput = z.infer<typeof vehicleUpdateSchema>;
export type SearchQuery = z.infer<typeof searchSchema>;
