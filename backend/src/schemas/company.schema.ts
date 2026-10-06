import { z } from 'zod';

export const inviteUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    roleId: z.number().int().positive('Role ID must be a positive integer'),
  }),
});
