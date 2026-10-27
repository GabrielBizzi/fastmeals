import 'dotenv/config';
import { z } from 'zod';

const booleanString = z
	.enum(['true', 'false'])
	.default('false')
	.transform((value) => value === 'true');

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
	PORT: z.coerce.number().int().positive().default(3001),
	DATABASE_URL: z.string().url(),
	JWT_SECRET: z.string().min(16),
	JWT_REFRESH_SECRET: z.string().min(16),
	JWT_EXPIRES_IN: z.string().default('15m'),
	JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
	LOG_LEVEL: z
		.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
		.default('info'),
	CORS_ORIGIN: z.string().default('http://localhost:3000'),
	TRUST_PROXY: booleanString,
	COOKIE_SECURE: z
		.enum(['true', 'false'])
		.optional()
		.transform((value) => (value === undefined ? undefined : value === 'true')),
	RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
	BUSINESS_TIMEZONE: z.string().default('America/Sao_Paulo'),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
