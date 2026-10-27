import { describe, expect, it } from 'vitest';
import {
	NO_AVAILABLE_DELIVERY_PERSON,
	planDeliveryAssignments,
} from '../../src/algorithms/deliveryAssignment';

const orders = [
	{ id: 'order-paulista', latitude: -23.5632, longitude: -46.6542 },
	{ id: 'order-vila-mariana', latitude: -23.5891, longitude: -46.6378 },
];

const couriers = [
	{ id: 'courier-near-vila-mariana', latitude: -23.588, longitude: -46.637 },
	{ id: 'courier-near-paulista', latitude: -23.5635, longitude: -46.6545 },
	{ id: 'courier-far', latitude: -23.45, longitude: -46.5 },
];

describe('planDeliveryAssignments', () => {
	it('pairs each order with the courier that minimizes the total distance', () => {
		const plan = planDeliveryAssignments(orders, couriers);

		expect(plan.assignments.map(({ orderId, deliveryPersonId }) => [orderId, deliveryPersonId])).toEqual([
			['order-paulista', 'courier-near-paulista'],
			['order-vila-mariana', 'courier-near-vila-mariana'],
		]);
		expect(plan.unassigned).toEqual([]);
		expect(plan.totalDistanceKm).toBeCloseTo(
			plan.assignments.reduce((sum, assignment) => sum + assignment.estimatedDistanceKm, 0),
			1,
		);
	});

	it('returns every order as unassigned when no courier is available', () => {
		const plan = planDeliveryAssignments(orders, []);

		expect(plan).toEqual({
			assignments: [],
			unassigned: orders.map((order) => ({
				orderId: order.id,
				reason: NO_AVAILABLE_DELIVERY_PERSON,
			})),
			totalDistanceKm: 0,
		});
	});

	it('assigns the closest subset and reports the surplus orders', () => {
		const plan = planDeliveryAssignments(orders, [couriers[0]]);

		expect(plan.assignments).toEqual([
			expect.objectContaining({
				orderId: 'order-vila-mariana',
				deliveryPersonId: 'courier-near-vila-mariana',
			}),
		]);
		expect(plan.unassigned.map((entry) => entry.orderId)).toEqual(['order-paulista']);
	});

	it('returns an empty plan when there are no ready orders', () => {
		expect(planDeliveryAssignments([], couriers)).toEqual({
			assignments: [],
			unassigned: [],
			totalDistanceKm: 0,
		});
	});
});
