import { OrderStatus, UserRole } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { useTestDatabase } from '../helpers/database';
import { createDeliveryPerson, createOrder, createProduct } from '../helpers/factories';
import { api, authHeaderFor } from '../helpers/http';

useTestDatabase();

const orderPayload = {
	customerName: 'Maria Oliveira',
	customerPhone: '(21) 98765-4321',
	deliveryAddress: 'Av. Brasil, 456, Rio de Janeiro - RJ',
	latitude: -22.9068,
	longitude: -43.1729,
};

describe('POST /api/orders', () => {
	it('computes the total on the server and snapshots unit prices', async () => {
		const { header } = await authHeaderFor();
		const burger = await createProduct({ price: 32.9 });
		const juice = await createProduct({ price: 12.5 });

		const response = await api()
			.post('/api/orders')
			.set(header)
			.send({
				...orderPayload,
				items: [
					{ productId: burger.id, quantity: 2 },
					{ productId: juice.id, quantity: 1 },
					{ productId: burger.id, quantity: 1 },
				],
			});

		expect(response.status).toBe(201);
		expect(response.body.status).toBe('pending');
		expect(response.body.totalAmount).toBe(111.2);
		expect(response.body.items).toHaveLength(2);
		expect(response.body.availableTransitions).toEqual(['preparing', 'cancelled']);

		await prisma.product.update({ where: { id: burger.id }, data: { price: 99 } });
		const detail = await api().get(`/api/orders/${response.body.id}`).set(header);
		expect(detail.body.totalAmount).toBe(111.2);
		expect(detail.body.statusHistory).toEqual([
			expect.objectContaining({ fromStatus: null, toStatus: 'pending' }),
		]);
	});

	it('returns 422 UNAVAILABLE_PRODUCT listing every unavailable product', async () => {
		const { header } = await authHeaderFor();
		const unavailable = await createProduct({ name: 'Pudim de Leite', isAvailable: false });
		const available = await createProduct();

		const response = await api()
			.post('/api/orders')
			.set(header)
			.send({
				...orderPayload,
				items: [
					{ productId: available.id, quantity: 1 },
					{ productId: unavailable.id, quantity: 1 },
				],
			});

		expect(response.status).toBe(422);
		expect(response.body.error).toMatchObject({
			code: 'UNAVAILABLE_PRODUCT',
			details: [
				{ productId: unavailable.id, productName: 'Pudim de Leite', reason: 'Produto indisponível' },
			],
		});
		expect(await prisma.order.count()).toBe(0);
	});

	it('validates phone format and item list', async () => {
		const { header } = await authHeaderFor();

		const response = await api()
			.post('/api/orders')
			.set(header)
			.send({ ...orderPayload, customerPhone: '11999990000', items: [] });

		expect(response.status).toBe(400);
		expect(response.body.error.details).toEqual(
			expect.arrayContaining([
				{ field: 'customerPhone', message: 'Use o formato (XX) XXXXX-XXXX' },
				{ field: 'items', message: 'Informe ao menos um item' },
			]),
		);
	});
});

describe('PATCH /api/orders/:id/status', () => {
	it.each([
		[OrderStatus.pending, OrderStatus.preparing],
		[OrderStatus.pending, OrderStatus.cancelled],
		[OrderStatus.preparing, OrderStatus.ready],
		[OrderStatus.preparing, OrderStatus.cancelled],
		[OrderStatus.ready, OrderStatus.cancelled],
	])('allows %s -> %s and records the transition', async (from, to) => {
		const { header, user } = await authHeaderFor();
		const order = await createOrder({ status: from });

		const response = await api()
			.patch(`/api/orders/${order.id}/status`)
			.set(header)
			.send({ status: to });

		expect(response.status).toBe(200);
		expect(response.body.status).toBe(to);
		const history = await prisma.orderStatusHistory.findFirst({
			where: { orderId: order.id, toStatus: to },
		});
		expect(history).toMatchObject({ fromStatus: from, changedById: user.id });
	});

	it.each([
		[OrderStatus.delivered, OrderStatus.pending],
		[OrderStatus.delivering, OrderStatus.cancelled],
		[OrderStatus.pending, OrderStatus.ready],
		[OrderStatus.pending, OrderStatus.delivered],
		[OrderStatus.cancelled, OrderStatus.preparing],
		[OrderStatus.preparing, OrderStatus.preparing],
	])('rejects %s -> %s with 422 INVALID_STATUS_TRANSITION', async (from, to) => {
		const { header } = await authHeaderFor();
		const deliveryPerson = await createDeliveryPerson();
		const needsCourier = from === OrderStatus.delivering || from === OrderStatus.delivered;
		const order = await createOrder({
			status: from,
			deliveryPersonId: needsCourier ? deliveryPerson.id : null,
		});

		const response = await api()
			.patch(`/api/orders/${order.id}/status`)
			.set(header)
			.send({ status: to });

		expect(response.status).toBe(422);
		expect(response.body.error).toEqual({
			code: 'INVALID_STATUS_TRANSITION',
			message: `Não é possível alterar o status de '${from}' para '${to}'`,
		});
		expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe(from);
	});

	it('requires a delivery person before moving ready -> delivering', async () => {
		const { header } = await authHeaderFor();
		const order = await createOrder({ status: OrderStatus.ready });

		const response = await api()
			.patch(`/api/orders/${order.id}/status`)
			.set(header)
			.send({ status: 'delivering' });

		expect(response.status).toBe(422);
		expect(response.body.error.code).toBe('INVALID_STATUS_TRANSITION');
	});

	it('moves ready -> delivering after an assignment', async () => {
		const { header } = await authHeaderFor();
		const order = await createOrder({ status: OrderStatus.ready });
		const deliveryPerson = await createDeliveryPerson();

		const assigned = await api()
			.patch(`/api/orders/${order.id}/assign`)
			.set(header)
			.send({ deliveryPersonId: deliveryPerson.id });
		expect(assigned.body.availableTransitions).toEqual(['delivering', 'cancelled']);

		const response = await api()
			.patch(`/api/orders/${order.id}/status`)
			.set(header)
			.send({ status: 'delivering' });

		expect(response.status).toBe(200);
		expect(response.body.deliveryPerson).toMatchObject({ id: deliveryPerson.id });
	});

	it('returns 404 for unknown orders and 403 for viewers', async () => {
		const admin = await authHeaderFor(UserRole.admin);
		const viewer = await authHeaderFor(UserRole.viewer);
		const order = await createOrder();

		const missing = await api()
			.patch('/api/orders/7d0f3a0e-4b8e-4f4a-9d76-1f9d7c1e0b11/status')
			.set(admin.header)
			.send({ status: 'preparing' });
		const forbidden = await api()
			.patch(`/api/orders/${order.id}/status`)
			.set(viewer.header)
			.send({ status: 'preparing' });

		expect(missing.status).toBe(404);
		expect(missing.body.error.code).toBe('ORDER_NOT_FOUND');
		expect(forbidden.status).toBe(403);
	});
});

describe('PATCH /api/orders/:id/assign', () => {
	it('refuses a delivery person who is already delivering another order', async () => {
		const { header } = await authHeaderFor();
		const deliveryPerson = await createDeliveryPerson();
		await createOrder({ status: OrderStatus.delivering, deliveryPersonId: deliveryPerson.id });
		const order = await createOrder({ status: OrderStatus.ready });

		const response = await api()
			.patch(`/api/orders/${order.id}/assign`)
			.set(header)
			.send({ deliveryPersonId: deliveryPerson.id });

		expect(response.status).toBe(422);
		expect(response.body.error.code).toBe('DELIVERY_PERSON_UNAVAILABLE');
	});

	it('refuses inactive delivery persons and finished orders', async () => {
		const { header } = await authHeaderFor();
		const inactive = await createDeliveryPerson({ isActive: false });
		const active = await createDeliveryPerson();
		const readyOrder = await createOrder({ status: OrderStatus.ready });
		const cancelledOrder = await createOrder({ status: OrderStatus.cancelled });

		const inactiveResponse = await api()
			.patch(`/api/orders/${readyOrder.id}/assign`)
			.set(header)
			.send({ deliveryPersonId: inactive.id });
		const finishedResponse = await api()
			.patch(`/api/orders/${cancelledOrder.id}/assign`)
			.set(header)
			.send({ deliveryPersonId: active.id });

		expect(inactiveResponse.status).toBe(422);
		expect(inactiveResponse.body.error.code).toBe('DELIVERY_PERSON_UNAVAILABLE');
		expect(finishedResponse.status).toBe(422);
		expect(finishedResponse.body.error.code).toBe('ORDER_NOT_ASSIGNABLE');
	});

	it('keeps a single delivering order per person even when two ready orders share the courier', async () => {
		const { header } = await authHeaderFor();
		const deliveryPerson = await createDeliveryPerson();
		const first = await createOrder({ status: OrderStatus.ready, deliveryPersonId: deliveryPerson.id });
		const second = await createOrder({ status: OrderStatus.ready, deliveryPersonId: deliveryPerson.id });

		const responses = await Promise.all(
			[first, second].map((order) =>
				api().patch(`/api/orders/${order.id}/status`).set(header).send({ status: 'delivering' }),
			),
		);

		expect(responses.map((response) => response.status).sort()).toEqual([200, 422]);
		expect(await prisma.order.count({ where: { status: OrderStatus.delivering } })).toBe(1);
	});
});

describe('GET /api/orders', () => {
	it('filters by status and sorts by creation date', async () => {
		const { header } = await authHeaderFor(UserRole.viewer);
		const older = await createOrder({ createdAt: new Date('2025-01-10T12:00:00Z') });
		const newer = await createOrder({ createdAt: new Date('2025-01-11T12:00:00Z') });
		await createOrder({ status: OrderStatus.cancelled });

		const response = await api()
			.get('/api/orders')
			.query({ status: 'pending', sortOrder: 'asc' })
			.set(header);

		expect(response.status).toBe(200);
		expect(response.body.data.map((order: { id: string }) => order.id)).toEqual([older.id, newer.id]);
		expect(response.body.pagination.total).toBe(2);
	});

	it('filters by creation date in the business time zone', async () => {
		const { header } = await authHeaderFor();
		await createOrder({ createdAt: new Date('2025-01-11T02:30:00Z') });
		const insideDay = await createOrder({ createdAt: new Date('2025-01-11T03:30:00Z') });

		const response = await api()
			.get('/api/orders')
			.query({ startDate: '2025-01-11', endDate: '2025-01-11' })
			.set(header);

		expect(response.body.data.map((order: { id: string }) => order.id)).toEqual([insideDay.id]);
	});
});
