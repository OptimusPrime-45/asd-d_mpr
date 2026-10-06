import { z } from 'zod';
import { DriverStatus } from '@prisma/client';

export const CreateDriverSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    license_no: z.string().min(1),
    status: z.nativeEnum(DriverStatus),
    safety_score: z.number().nonnegative(),
    license_type: z.string().min(1),
    expiry_date: z.string().datetime(),
    contact_number: z.string().optional(),
    trip_completion_rate: z.number().nonnegative().optional(),
  }),
});

export const UpdateDriverSchema = z.object({
  body: z.object({
    status: z.nativeEnum(DriverStatus).optional(),
    safety_score: z.number().nonnegative().optional(),
    license_type: z.string().min(1).optional(),
    expiry_date: z.string().datetime().optional(),
  }),
  params: z.object({
    driverId: z.string().regex(/^\d+$/, 'Driver ID must be a number'),
  }),
});
