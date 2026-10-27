import rateLimit from 'express-rate-limit';
import { AppError } from '../errors/AppError';

export function createRateLimiter(maxRequestsPerMinute: number) {
	return rateLimit({
		windowMs: 60_000,
		limit: maxRequestsPerMinute,
		standardHeaders: 'draft-7',
		legacyHeaders: false,
		handler: (_req, _res, next) => {
			next(
				new AppError(
					'RATE_LIMIT_EXCEEDED',
					'Muitas requisições em pouco tempo. Aguarde um instante e tente novamente.',
				),
			);
		},
	});
}
