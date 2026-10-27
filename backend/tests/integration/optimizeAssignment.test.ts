import { OrderStatus, UserRole } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { useTestDatabase } from '../helpers/database';
import { createDeliveryPerson, createOrder } from '../helpers/factories';
import { api, authHeaderFor } from '../helpers/http';

useTestDatabase();

const optimize = (header: Record<string, string>) =>
	api().post('/api/orders/optimize-assignment').set(header);

describe('POST /api/orders/optimize-assignment', () => {
	it('suggests the assignment with the smallest total distance', async () => {
		const { header } = await authHeaderFor();
		const nearPaulista = await createDeliveryPerson({
			name: 'Perto da Paulista',
			currentLatitude: -23.5635,
			currentLongitude: -46.6545,
		});
		const nearVilaMariana = await createDeliveryPerson({
			name: 'Perto da Vila Mariana',
			currentLatitude: -23.588,
			currentLongitude: -46.637,
		});
		const paulista = await createOrder({
			status: OrderStatus.ready,
			latitude: -23.5632,
			longitude: -46.6542,
		});
		const vilaMariana = await createOrder({
			status: OrderStatus.ready,
			latitude: -23.5891,
			longitude: -46.6378,
		});

		const response = await optimize(header);

		expect(response.status).toBe(200);
		expect(response.body.algorithm).toBe('hungarian');
		expect(response.body.unassigned).toEqual([]);
		expect(
			Object.fromEntries(
				response.body.assignments.map((assignment: { orderId: string; deliveryPersonId: string }) => [
					assignment.orderId,
					assignment.deliveryPersonId,
				]),
			),
		).toEqual({
			[paulista.id]: nearPaulista.id,
			[vilaMariana.id]: nearVilaMariana.id,
		});
		expect(response.body.assignments[0]).toMatchObject({
			orderAddress: expect.any(String),
			deliveryPersonName: expect.any(String),
			estimatedDistanceKm: expect.any(Number),
		});
		expect(response.body.totalDistanceKm).toBeLessThan(0.5);
		expect(response.body.executionTimeMs).toEqual(expect.any(Number));
	});

	it('returns ready orders as unassigned when no delivery person is available', async () => {
		const { header } = await authHeaderFor();
		const busy = await createDeliveryPerson();
		await createDeliveryPerson({ isActive: false });
		await createDeliveryPerson({ currentLatitude: null, currentLongitude: null });
		await createOrder({ status: OrderStatus.delivering, deliveryPersonId: busy.id });
		const ready = await createOrder({ status: OrderStatus.ready });

		const response = await optimize(header);

		expect(response.status).toBe(200);
		expect(response.body).toMatchObject({
			assignments: [],
			unassigned: [
				{
					orderId: ready.id,
					orderAddress: expect.any(String),
					reason: 'No available delivery person',
				},
			],
			totalDistanceKm: 0,
		});
	});

	it('ignores orders that already have a courier and returns an empty plan when nothing is ready', async () => {
		const { header } = await authHeaderFor();
		const courier = await createDeliveryPerson();
		await createDeliveryPerson();
		await createOrder({ status: OrderStatus.ready, deliveryPersonId: courier.id });
		await createOrder({ status: OrderStatus.preparing });

		const response = await optimize(header);

		expect(response.body).toMatchObject({ assignments: [], unassigned: [], totalDistanceKm: 0 });
	});

	it('assigns only as many orders as there are couriers', async () => {
		const { header } = await authHeaderFor();
		await createDeliveryPerson();
		await Promise.all([1, 2, 3].map(() => createOrder({ status: OrderStatus.ready })));

		const response = await optimize(header);

		expect(response.body.assignments).toHaveLength(1);
		expect(response.body.unassigned).toHaveLength(2);
	});

	it('is restricted to admins', async () => {
		const { header } = await authHeaderFor(UserRole.viewer);

		const response = await optimize(header);

		expect(response.status).toBe(403);
	});
});
