import { z } from 'zod';

export const expenseSchema = z.object({
  body: z.object({
    trip_id: z.number().int().positive('Trip ID must be a positive integer'),
    reg_no: z.string().min(1, 'Registration number is required'),
    maintenance: z.number().nonnegative('Maintenance cost must be non-negative'),
    toll: z.number().nonnegative('Toll cost must be non-negative'),
    others: z.number().nonnegative('Others cost must be non-negative'),
  }),
});
