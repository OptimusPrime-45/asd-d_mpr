import { z } from 'zod';
import { ServiceType } from '@prisma/client';

export const maintenanceSchema = z.object({
  body: z.object({
    reg_no: z.string().min(1, 'Registration number is required'),
    service_type: z.nativeEnum(ServiceType, { message: 'Invalid service type' }),
    cost: z.number().positive('Cost must be a positive number'),
    date: z.string().datetime({ message: 'Invalid date format' }),
    status: z.string().min(1, 'Status is required'),
  }),
});
