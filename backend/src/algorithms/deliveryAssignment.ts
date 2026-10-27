import { roundTo } from '../utils/money';
import { haversineDistanceKm, type Coordinates } from './haversine';
import { solveMinimumCostAssignment, UNASSIGNED } from './hungarian';

export const NO_AVAILABLE_DELIVERY_PERSON = 'No available delivery person';

export type AssignableOrder = Coordinates & { id: string };
export type AssignableDeliveryPerson = Coordinates & { id: string };

export type PlannedAssignment = {
	orderId: string;
	deliveryPersonId: string;
	estimatedDistanceKm: number;
};

export type UnassignedOrder = {
	orderId: string;
	reason: typeof NO_AVAILABLE_DELIVERY_PERSON;
};

export type AssignmentPlan = {
	assignments: PlannedAssignment[];
	unassigned: UnassignedOrder[];
	totalDistanceKm: number;
};

export function planDeliveryAssignments(
	orders: readonly AssignableOrder[],
	deliveryPersons: readonly AssignableDeliveryPerson[],
): AssignmentPlan {
	const distances = orders.map((order) =>
		deliveryPersons.map((person) => haversineDistanceKm(person, order)),
	);
	const personIndexByOrder = solveMinimumCostAssignment(distances);

	const assignments: PlannedAssignment[] = [];
	const unassigned: UnassignedOrder[] = [];
	let totalDistanceKm = 0;

	orders.forEach((order, orderIndex) => {
		const personIndex = personIndexByOrder[orderIndex] ?? UNASSIGNED;
		if (personIndex === UNASSIGNED) {
			unassigned.push({
				orderId: order.id,
				reason: NO_AVAILABLE_DELIVERY_PERSON,
			});
			return;
		}

		const distance = distances[orderIndex][personIndex];
		totalDistanceKm += distance;
		assignments.push({
			orderId: order.id,
			deliveryPersonId: deliveryPersons[personIndex].id,
			estimatedDistanceKm: roundTo(distance, 2),
		});
	});

	return {
		assignments,
		unassigned,
		totalDistanceKm: roundTo(totalDistanceKm, 2),
	};
}
