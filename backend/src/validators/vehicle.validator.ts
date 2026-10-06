import { z } from 'zod';
import { VehicleStatus } from '@prisma/client';

export const CreateVehicleSchema = z.object({
  body: z.object({
    reg_no: z.string().min(1),
    vehicle_model: z.string().min(1),
    type: z.string().min(1),
    load_capacity: z.number().positive(),
    odometer_reading: z.number().nonnegative(),
    cost: z.number().nonnegative(),
    status: z.nativeEnum(VehicleStatus),
  }),
});

export const UpdateVehicleSchema = z.object({
  body: z.object({
    vehicle_model: z.string().min(1).optional(),
    type: z.string().min(1).optional(),
    load_capacity: z.number().positive().optional(),
    odometer_reading: z.number().nonnegative().optional(),
    cost: z.number().nonnegative().optional(),
    status: z.nativeEnum(VehicleStatus).optional(),
  }),
  params: z.object({
    regNo: z.string(),
  }),
});
