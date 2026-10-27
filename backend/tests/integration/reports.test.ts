import { OrderStatus, UserRole, VehicleType } from '@prisma/client';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTestDatabase } from '../helpers/database';
import { createDeliveryPerson, createOrder, createProduct } from '../helpers/factories';
import { api, authHeaderFor } from '../helpers/http';

useTestDatabase();

let header: Record<string, string>;

beforeEach(async () => {
	header = (await authHeaderFor(UserRole.viewer)).header;
});

async function seedSales() {
	const motorcycle = await createDeliveryPerson({ vehicleType: VehicleType.motorcycle });
	const bicycle = await createDeliveryPerson({ vehicleType: VehicleType.bicycle });
	const burger = await createProduct({ name: 'X-Burger', price: 30 });
	const juice = await createProduct({ name: 'Suco', price: 10 });
	const fries = await createProduct({ name: 'Batata', price: 15 });

	await createOrder({
		status: OrderStatus.delivered,
		deliveryPersonId: motorcycle.id,
		createdAt: new Date('2025-01-10T15:00:00Z'),
		travelMinutes: 15,
		items: [
			{ product: burger, quantity: 2 },
			{ product: juice, quantity: 1 },
		],
	});
	await createOrder({
		status: OrderStatus.delivered,
		deliveryPersonId: bicycle.id,
		createdAt: new Date('2025-01-12T15:00:00Z'),
		travelMinutes: 35,
		items: [
			{ product: juice, quantity: 4 },
			{ product: fries, quantity: 1 },
		],
	});
	await createOrder({
		status: OrderStatus.delivered,
		deliveryPersonId: bicycle.id,
		createdAt: new Date('2025-02-20T15:00:00Z'),
		items: [{ product: fries, quantity: 10 }],
	});
	await createOrder({
		status: OrderStatus.cancelled,
		createdAt: new Date('2025-01-11T15:00:00Z'),
		items: [{ product: burger, quantity: 20 }],
	});
	await createOrder({
		status: OrderStatus.pending,
		createdAt: new Date('2025-01-11T16:00:00Z'),
		items: [{ product: burger, quantity: 5 }],
	});
}

describe('GET /api/reports/revenue', () => {
	it('sums only delivered orders inside the period and fills every day', async () => {
		await seedSales();

		const response = await api()
			.get('/api/reports/revenue')
			.query({ startDate: '2025-01-10', endDate: '2025-01-13' })
			.set(header);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			startDate: '2025-01-10',
			endDate: '2025-01-13',
			totalRevenue: 125,
			totalOrders: 2,
			averageOrderValue: 62.5,
			dailyRevenue: [
				{ date: '2025-01-10', revenue: 70, orders: 1 },
				{ date: '2025-01-11', revenue: 0, orders: 0 },
				{ date: '2025-01-12', revenue: 55, orders: 1 },
				{ date: '2025-01-13', revenue: 0, orders: 0 },
			],
		});
	});

	it.each([
		[{}, ['startDate', 'endDate']],
		[{ startDate: '2025-02-01', endDate: '2025-01-01' }, ['endDate']],
		[{ startDate: '2025-02-30', endDate: '2025-03-01' }, ['startDate']],
	])('validates the period %j', async (query, fields) => {
		const response = await api().get('/api/reports/revenue').query(query).set(header);

		expect(response.status).toBe(400);
		expect(response.body.error.details.map((detail: { field: string }) => detail.field)).toEqual(
			expect.arrayContaining(fields),
		);
	});
});

describe('GET /api/reports/top-products', () => {
	it('ranks products by delivered quantity and ignores other statuses', async () => {
		await seedSales();

		const response = await api().get('/api/reports/top-products').set(header);

		expect(response.status).toBe(200);
		expect(response.body.data).toEqual([
			expect.objectContaining({ productName: 'Batata', totalQuantity: 11, totalRevenue: 165 }),
			expect.objectContaining({ productName: 'Suco', totalQuantity: 5, totalRevenue: 50 }),
			expect.objectContaining({ productName: 'X-Burger', totalQuantity: 2, totalRevenue: 60 }),
		]);
	});

	it('respects the period and the limit', async () => {
		await seedSales();

		const response = await api()
			.get('/api/reports/top-products')
			.query({ startDate: '2025-01-01', endDate: '2025-01-31', limit: 1 })
			.set(header);

		expect(response.body.data).toEqual([
			expect.objectContaining({ productName: 'Suco', totalQuantity: 5 }),
		]);
	});
});

describe('GET /api/reports/orders-by-status', () => {
	it('returns every status, including the ones without orders', async () => {
		await seedSales();

		const response = await api().get('/api/reports/orders-by-status').set(header);

		expect(response.body).toEqual({
			data: [
				{ status: 'pending', count: 1 },
				{ status: 'preparing', count: 0 },
				{ status: 'ready', count: 0 },
				{ status: 'delivering', count: 0 },
				{ status: 'delivered', count: 3 },
				{ status: 'cancelled', count: 1 },
			],
			total: 5,
		});
	});
});

describe('GET /api/reports/average-delivery-time', () => {
	it('measures the time from creation to delivery overall and per vehicle type', async () => {
		await seedSales();

		const response = await api()
			.get('/api/reports/average-delivery-time')
			.query({ startDate: '2025-01-01', endDate: '2025-01-31' })
			.set(header);

		expect(response.body).toEqual({
			averageMinutes: 50,
			fastestMinutes: 40,
			slowestMinutes: 60,
			totalDelivered: 2,
			byVehicleType: [
				{ vehicleType: 'bicycle', averageMinutes: 60, count: 1 },
				{ vehicleType: 'motorcycle', averageMinutes: 40, count: 1 },
			],
		});
	});
});
