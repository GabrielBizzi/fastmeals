import { Router } from 'express';
import { prisma } from '../../lib/prisma';

export const healthRouter = Router();

healthRouter.get('/', async (req, res) => {
	try {
		await prisma.$queryRaw`SELECT 1`;
		res.status(200).json({ status: 'ok', database: 'up' });
	} catch (error) {
		req.log.error({ err: error }, 'Health check failed');
		res.status(503).json({ status: 'degraded', database: 'down' });
	}
});
