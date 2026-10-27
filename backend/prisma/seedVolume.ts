import {
	OrderStatus,
	Prisma,
	PrismaClient,
	ProductCategory,
	UserRole,
	VehicleType,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { hashPassword } from '../src/modules/auth/auth.service';
import { buildOrderTimeline } from './orderTimeline';
import { truncateAllTables } from './truncate';

const prisma = new PrismaClient();

const PRODUCT_COUNT = Number(process.env.VOLUME_PRODUCTS ?? 10_000);
const ORDER_COUNT = Number(process.env.VOLUME_ORDERS ?? 10_000);
const READY_UNASSIGNED_ORDERS = 50;
const FREE_COURIERS = 30;
const BATCH_SIZE = 1_000;
const DAY_MS = 86_400_000;

const CATEGORIES = Object.values(ProductCategory);
const VEHICLES = Object.values(VehicleType);
const HISTORICAL_STATUSES: OrderStatus[] = [
	OrderStatus.delivered,
	OrderStatus.delivered,
	OrderStatus.delivered,
	OrderStatus.cancelled,
	OrderStatus.pending,
	OrderStatus.preparing,
];

function createRandom(seed: number) {
	let state = seed;
	return () => {
		state = (state * 1_664_525 + 1_013_904_223) % 2 ** 32;
		return state / 2 ** 32;
	};
}

const random = createRandom(42);
const pick = <T>(values: readonly T[]) => values[Math.floor(random() * values.length)];
const saoPauloPoint = () => ({
	latitude: -23.62 + random() * 0.14,
	longitude: -46.72 + random() * 0.16,
});

async function inBatches<T>(rows: T[], insert: (batch: T[]) => Promise<unknown>) {
	for (let start = 0; start < rows.length; start += BATCH_SIZE) {
		await insert(rows.slice(start, start + BATCH_SIZE));
	}
}

async function main() {
	await truncateAllTables(prisma);
	await prisma.user.create({
		data: {
			email: 'admin@fastmeals.com',
			passwordHash: await hashPassword('Admin@123'),
			role: UserRole.admin,
		},
	});

	const products = Array.from({ length: PRODUCT_COUNT }, (_, index) => ({
		id: randomUUID(),
		name: `Produto de volume ${String(index + 1).padStart(5, '0')}`,
		description: 'Produto gerado para medir o desempenho das listagens',
		price: new Prisma.Decimal((5 + random() * 75).toFixed(2)),
		category: pick(CATEGORIES),
		isAvailable: random() > 0.1,
		preparationTime: 1 + Math.floor(random() * 60),
		createdAt: new Date(Date.now() - Math.floor(random() * 365) * DAY_MS),
	}));
	await inBatches(products, (data) => prisma.product.createMany({ data }));

	const couriers = Array.from({ length: FREE_COURIERS + 20 }, (_, index) => ({
		id: randomUUID(),
		name: `Entregador ${index + 1}`,
		phone: '(11) 91234-5678',
		vehicleType: pick(VEHICLES),
		isActive: index < FREE_COURIERS,
		currentLatitude: saoPauloPoint().latitude,
		currentLongitude: saoPauloPoint().longitude,
	}));
	await prisma.deliveryPerson.createMany({ data: couriers });
	const historicalCouriers = couriers.slice(FREE_COURIERS);

	const orders: Prisma.OrderCreateManyInput[] = [];
	const items: Prisma.OrderItemCreateManyInput[] = [];
	const history: Prisma.OrderStatusHistoryCreateManyInput[] = [];

	for (let index = 0; index < ORDER_COUNT; index++) {
		const status =
			index < READY_UNASSIGNED_ORDERS ? OrderStatus.ready : pick(HISTORICAL_STATUSES);
		const createdAt = new Date(Date.now() - Math.floor(random() * 90 * DAY_MS));
		const orderId = randomUUID();
		const chosen = new Set<number>();
		while (chosen.size < 1 + Math.floor(random() * 3)) {
			chosen.add(Math.floor(random() * products.length));
		}

		let total = new Prisma.Decimal(0);
		for (const productIndex of chosen) {
			const product = products[productIndex];
			const quantity = 1 + Math.floor(random() * 3);
			total = total.plus(product.price.times(quantity));
			items.push({
				orderId,
				productId: product.id,
				quantity,
				unitPrice: product.price,
				createdAt,
			});
		}

		const needsCourier = status === OrderStatus.delivered;
		orders.push({
			id: orderId,
			customerName: `Cliente ${index + 1}`,
			customerPhone: '(11) 99999-0000',
			deliveryAddress: `Rua de Volume, ${index + 1}, São Paulo - SP`,
			...saoPauloPoint(),
			status,
			totalAmount: total,
			deliveryPersonId: needsCourier ? pick(historicalCouriers).id : null,
			createdAt,
		});
		for (const entry of buildOrderTimeline(createdAt, status, {
			acceptMinutes: 2 + Math.floor(random() * 5),
			preparationMinutes: 10 + Math.floor(random() * 30),
			pickupMinutes: 2 + Math.floor(random() * 6),
			travelMinutes: 8 + Math.floor(random() * 40),
		})) {
			history.push({ orderId, ...entry });
		}
	}

	await inBatches(orders, (data) => prisma.order.createMany({ data }));
	await inBatches(items, (data) => prisma.orderItem.createMany({ data }));
	await inBatches(history, (data) => prisma.orderStatusHistory.createMany({ data }));
	await prisma.$executeRaw`ANALYZE`;

	process.stdout.write(
		`Volume seed completed: ${JSON.stringify({
			products: products.length,
			orders: orders.length,
			orderItems: items.length,
			statusHistory: history.length,
			readyUnassignedOrders: READY_UNASSIGNED_ORDERS,
			freeCouriers: FREE_COURIERS,
		})}\n`,
	);
}

main()
	.catch((error: unknown) => {
		process.stderr.write(`Volume seed failed: ${String(error)}\n`);
		process.exitCode = 1;
	})
	.finally(() => prisma.$disconnect());
