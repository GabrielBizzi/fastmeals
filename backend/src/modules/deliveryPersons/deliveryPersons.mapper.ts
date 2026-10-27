import type { DeliveryPerson } from '@prisma/client';
import { toNullableNumber } from '../../utils/money';

export type DeliveryPersonWithCurrentOrder = DeliveryPerson & {
	orders: { id: string }[];
};

export type DeliveryPersonResponse = {
	id: string;
	name: string;
	phone: string;
	vehicleType: DeliveryPerson['vehicleType'];
	isActive: boolean;
	currentLatitude: number | null;
	currentLongitude: number | null;
	currentOrderId: string | null;
	createdAt: string;
};

export function toDeliveryPersonResponse(
	person: DeliveryPersonWithCurrentOrder,
): DeliveryPersonResponse {
	return {
		id: person.id,
		name: person.name,
		phone: person.phone,
		vehicleType: person.vehicleType,
		isActive: person.isActive,
		currentLatitude: toNullableNumber(person.currentLatitude),
		currentLongitude: toNullableNumber(person.currentLongitude),
		currentOrderId: person.orders[0]?.id ?? null,
		createdAt: person.createdAt.toISOString(),
	};
}
