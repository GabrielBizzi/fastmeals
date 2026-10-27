import { OrderStatus, Prisma, PrismaClient } from '@prisma/client';
import { haversineDistanceKm } from '../src/algorithms/haversine';
import { hashPassword } from '../src/modules/auth/auth.service';
import { buildOrderTimeline, timelineEnd } from './orderTimeline';
import { readSeedFile, type SeedFile } from './seedData';
import { truncateAllTables } from './truncate';

const prisma = new PrismaClient();

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const FINISHED_STATUSES: OrderStatus[] = [
	OrderStatus.delivered,
	OrderStatus.cancelled,
];

function resolveCreatedAt(
	status: OrderStatus,
	activeIndex: number,
	finishedIndex: number,
	now: number,
): Date {
	if (FINISHED_STATUSES.includes(status)) {
		const daysAgo = 1 + finishedIndex * 2;
		return new Date(now - daysAgo * DAY_MS - (finishedIndex % 3) * 47 * MINUTE_MS);
	}
	return new Date(now - (activeIndex * 14 + 6) * MINUTE_MS);
}

async function seed(data: SeedFile) {
	await truncateAllTables(prisma);

	const users = await Promise.all(
		data.users.map(async (user) => ({
			email: user.email.toLowerCase(),
			role: user.role,
			passwordHash: await hashPassword(user.password),
		})),
	);
	await prisma.user.createMany({ data: users });

	const products = await prisma.$transaction(
		data.products.map((product) =>
			prisma.product.create({
				data: { ...product, imageUrl: product.imageUrl ?? null },
			}),
		),
	);

	const deliveryPersons = await prisma.$transaction(
		data.deliveryPersons.map((person) =>
			prisma.deliveryPerson.create({ data: person }),
		),
	);

	const now = Date.now();
	let activeIndex = 0;
	let finishedIndex = 0;

	for (const order of data.orders) {
		const isFinished = FINISHED_STATUSES.includes(order.status);
		const requestedCreatedAt = resolveCreatedAt(
			order.status,
			isFinished ? 0 : activeIndex++,
			isFinished ? finishedIndex++ : 0,
			now,
		);

		const items = order.items.map((item) => {
			const product = products[item.productIndex];
			if (!product) {
				throw new Error(`Seed order references missing product ${item.productIndex}`);
			}
			return { product, quantity: item.quantity };
		});

		const courier =
			order.deliveryPersonIndex === undefined
				? null
				: deliveryPersons[order.deliveryPersonIndex];
		if (order.deliveryPersonIndex !== undefined && !courier) {
			throw new Error(
				`Seed order references missing delivery person ${order.deliveryPersonIndex}`,
			);
		}

		const travelKm =
			courier?.currentLatitude && courier.currentLongitude
				? haversineDistanceKm(
						{
							latitude: courier.currentLatitude.toNumber(),
							longitude: courier.currentLongitude.toNumber(),
						},
						order,
					)
				: 3;

		const durations = {
			acceptMinutes: 3,
			preparationMinutes: Math.max(
				...items.map((item) => item.product.preparationTime),
			),
			pickupMinutes: 4,
			travelMinutes: Math.round(8 + travelKm * 4),
		};
		const draftTimeline = buildOrderTimeline(
			requestedCreatedAt,
			order.status,
			durations,
		);
		const overshootMs = Math.max(
			0,
			timelineEnd(draftTimeline).getTime() - (now - MINUTE_MS),
		);
		const createdAt = new Date(requestedCreatedAt.getTime() - overshootMs);
		const timeline = buildOrderTimeline(createdAt, order.status, durations);

		const totalAmount = items.reduce(
			(sum, item) => sum.plus(item.product.price.times(item.quantity)),
			new Prisma.Decimal(0),
		);

		await prisma.order.create({
			data: {
				customerName: order.customerName,
				customerPhone: order.customerPhone,
				deliveryAddress: order.deliveryAddress,
				latitude: order.latitude,
				longitude: order.longitude,
				status: order.status,
				totalAmount,
				deliveryPersonId: courier?.id ?? null,
				createdAt,
				updatedAt: timelineEnd(timeline),
				items: {
					create: items.map((item) => ({
						productId: item.product.id,
						quantity: item.quantity,
						unitPrice: item.product.price,
						createdAt,
					})),
				},
				statusHistory: { create: timeline },
			},
		});
	}

	return {
		users: users.length,
		products: products.length,
		deliveryPersons: deliveryPersons.length,
		orders: data.orders.length,
	};
}

async function main() {
	const onlyIfEmpty = process.argv.includes('--if-empty');
	if (onlyIfEmpty && (await prisma.user.count()) > 0) {
		process.stdout.write('Database already seeded, skipping.\n');
		return;
	}

	const summary = await seed(readSeedFile());
	process.stdout.write(`Seed completed: ${JSON.stringify(summary)}\n`);
}

if (require.main === module) {
	main()
		.catch((error: unknown) => {
			process.stderr.write(`Seed failed: ${String(error)}\n`);
			process.exitCode = 1;
		})
		.finally(() => prisma.$disconnect());
}
