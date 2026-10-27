import { afterAll, beforeEach } from 'vitest';
import { truncateAllTables } from '../../prisma/truncate';
import { prisma } from '../../src/lib/prisma';

export function useTestDatabase() {
	beforeEach(async () => {
		await truncateAllTables(prisma);
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});
}
