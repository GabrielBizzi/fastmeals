import type { PrismaClient } from '@prisma/client';

export async function truncateAllTables(client: PrismaClient) {
	await client.$executeRaw`
		TRUNCATE TABLE order_status_history, order_items, orders, delivery_persons,
			products, refresh_tokens, users RESTART IDENTITY CASCADE
	`;
}
