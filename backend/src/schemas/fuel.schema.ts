import { z } from 'zod';

export const fuelLogSchema = z.object({
  body: z.object({
    reg_no: z.string().min(1, 'Registration number is required'),
    litres: z.number().positive('Litres must be a positive number'),
    fuel_cost: z.number().positive('Fuel cost must be a positive number'),
    date: z.string().datetime({ message: 'Invalid date format' }).optional(),
  }),
});
