import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Router } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env';
import { logger } from './lib/logger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { createRateLimiter } from './middlewares/rateLimiter';
import { authRouter } from './modules/auth/auth.routes';
import { deliveryPersonsRouter } from './modules/deliveryPersons/deliveryPersons.routes';
import { healthRouter } from './modules/health/health.routes';
import { ordersRouter } from './modules/orders/orders.routes';
import { menuRouter, productsRouter } from './modules/products/products.routes';
import { reportsRouter } from './modules/reports/reports.routes';

export type AppOptions = {
	rateLimitPerMinute?: number;
};

export function createApp({
	rateLimitPerMinute = env.RATE_LIMIT_MAX,
}: AppOptions = {}) {
	const app = express();

	app.disable('x-powered-by');
	app.set('trust proxy', env.TRUST_PROXY ? 1 : false);

	app.use(pinoHttp({ logger }));
	app.use(helmet());
	app.use(
		cors({
			origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
			credentials: true,
		}),
	);
	app.use(express.json({ limit: '100kb' }));
	app.use(cookieParser());

	const api = Router();
	api.use('/health', healthRouter);
	api.use(createRateLimiter(rateLimitPerMinute));
	api.use('/auth', authRouter);
	api.use('/menu', menuRouter);
	api.use('/products', productsRouter);
	api.use('/orders', ordersRouter);
	api.use('/delivery-persons', deliveryPersonsRouter);
	api.use('/reports', reportsRouter);

	app.use('/api', api);
	app.use(notFoundHandler);
	app.use(errorHandler);

	return app;
}
