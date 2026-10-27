import { OrderStatus, UserRole } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { useTestDatabase } from '../helpers/database';
import { createDeliveryPerson, createOrder } from '../helpers/factories';
import { api, authHeaderFor } from '../helpers/http';

useTestDatabase();

describe('delivery persons', () => {
	it('creates a delivery person and validates the payload', async () => {
		const { header } = await authHeaderFor();

		const created = await api()
			.post('/api/delivery-persons')
			.set(header)
			.send({ name: 'Carlos Santos', phone: '(11) 91234-5678', vehicleType: 'motorcycle' });
		const invalid = await api()
			.post('/api/delivery-persons')
			.set(header)
			.send({ name: 'Ca', phone: '11912345678', vehicleType: 'truck' });
		const halfCoordinates = await api()
			.post('/api/delivery-persons')
			.set(header)
			.send({
				name: 'Carlos Santos',
				phone: '(11) 91234-5678',
				vehicleType: 'car',
				currentLatitude: -23.5,
			});

		expect(created.status).toBe(201);
		expect(created.body).toMatchObject({
			isActive: true,
			currentLatitude: null,
			currentOrderId: null,
		});
		expect(invalid.status).toBe(400);
		expect(invalid.body.error.details.map((detail: { field: string }) => detail.field)).toEqual(
			expect.arrayContaining(['name', 'phone', 'vehicleType']),
		);
		expect(halfCoordinates.status).toBe(400);
		expect(halfCoordinates.body.error.details).toEqual([
			{
				field: 'currentLongitude',
				message: 'Informe latitude e longitude juntas ou deixe ambas em branco',
			},
		]);
	});

	it('lists available couriers with their current order', async () => {
		const { header } = await authHeaderFor(UserRole.viewer);
		const busy = await createDeliveryPerson({ name: 'Ocupado' });
		await createDeliveryPerson({ name: 'Livre' });
		await createDeliveryPerson({ name: 'Inativo', isActive: false });
		const order = await createOrder({ status: OrderStatus.delivering, deliveryPersonId: busy.id });

		const all = await api().get('/api/delivery-persons').set(header);
		const available = await api()
			.get('/api/delivery-persons')
			.query({ isActive: 'true', available: 'true' })
			.set(header);

		expect(all.body.data.find((person: { id: string }) => person.id === busy.id).currentOrderId).toBe(order.id);
		expect(available.body.data.map((person: { name: string }) => person.name)).toEqual(['Livre']);
	});

	it('refuses to delete a courier with an ongoing delivery and soft-deletes otherwise', async () => {
		const { header } = await authHeaderFor();
		const busy = await createDeliveryPerson();
		const free = await createDeliveryPerson();
		await createOrder({ status: OrderStatus.delivering, deliveryPersonId: busy.id });
		const reserved = await createOrder({ status: OrderStatus.ready, deliveryPersonId: free.id });

		const blocked = await api().delete(`/api/delivery-persons/${busy.id}`).set(header);
		const removed = await api().delete(`/api/delivery-persons/${free.id}`).set(header);

		expect(blocked.status).toBe(409);
		expect(blocked.body.error.code).toBe('DELIVERY_PERSON_IN_USE');
		expect(removed.status).toBe(204);
		expect((await api().get(`/api/delivery-persons/${free.id}`).set(header)).status).toBe(404);
		expect((await prisma.order.findUniqueOrThrow({ where: { id: reserved.id } })).deliveryPersonId).toBeNull();
	});
});
