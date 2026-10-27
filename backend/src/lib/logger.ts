import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
	level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
	redact: {
		paths: [
			'req.headers.authorization',
			'req.headers.cookie',
			'res.headers["set-cookie"]',
			'*.password',
			'*.refreshToken',
		],
		censor: '[redacted]',
	},
	transport:
		env.NODE_ENV === 'development'
			? { target: 'pino-pretty', options: { singleLine: true } }
			: undefined,
});
