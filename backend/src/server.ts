import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';

const server = createApp().listen(env.PORT, () => {
	logger.info({ port: env.PORT }, 'FastMeals API listening');
});

function shutdown(signal: NodeJS.Signals) {
	logger.info({ signal }, 'Shutting down');
	server.close(() => {
		prisma
			.$disconnect()
			.catch((error: unknown) => logger.error({ err: error }, 'Disconnect failed'))
			.finally(() => process.exit(0));
	});
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
