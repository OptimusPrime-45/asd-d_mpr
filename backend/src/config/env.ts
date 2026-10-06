import { z } from 'zod';
import dotenv from 'dotenv';
import type { SignOptions } from 'jsonwebtoken';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(10).default('default_jwt_secret_change_me'),
  JWT_EXPIRES_IN: z
    .string()
    .default('24h')
    .transform((val) => val as Exclude<SignOptions['expiresIn'], undefined>),
  SMTP_HOST: z.string().default('sandbox.smtp.mailtrap.io'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  MAIL_FROM: z.string().default('FleetOps <no-reply@fleetops.com>'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  JIRA_HOST: z.string().optional().default(''),
  JIRA_EMAIL: z.string().optional().default(''),
  JIRA_API_TOKEN: z.string().optional().default(''),
  JIRA_PROJECT_KEY: z.string().optional().default('FLEET'),
  JIRA_WEBHOOK_SECRET: z.string().optional().default(''),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
