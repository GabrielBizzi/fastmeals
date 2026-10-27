import { z } from 'zod';
import { api } from './api';
import { vehicleTypeSchema, type VehicleType } from './orders';
import { compactParams } from './pagination';

export const deliveryPersonSchema = z.object({
	id: z.string(),
	name: z.string(),
	phone: z.string(),
	vehicleType: vehicleTypeSchema,
	isActive: z.boolean(),
	currentLatitude: z.number().nullable(),
	currentLongitude: z.number().nullable(),
	currentOrderId: z.string().nullable(),
	createdAt: z.string(),
});
export type DeliveryPerson = z.infer<typeof deliveryPersonSchema>;

const deliveryPersonListSchema = z.object({
	data: z.array(deliveryPersonSchema),
});

export type DeliveryPersonFilters = {
	isActive?: boolean;
	available?: boolean;
};

export type DeliveryPersonInput = {
	name: string;
	phone: string;
	vehicleType: VehicleType;
	isActive: boolean;
	currentLatitude: number | null;
	currentLongitude: number | null;
};

export async function listDeliveryPersons(
	filters: DeliveryPersonFilters = {},
	signal?: AbortSignal,
) {
	const { data } = await api.get<unknown>('/delivery-persons', {
		params: compactParams(filters),
		signal,
	});
	return deliveryPersonListSchema.parse(data).data;
}

export async function createDeliveryPerson(input: DeliveryPersonInput) {
	const { data } = await api.post<unknown>('/delivery-persons', input);
	return deliveryPersonSchema.parse(data);
}

export async function updateDeliveryPerson(
	id: string,
	input: Partial<DeliveryPersonInput>,
) {
	const { data } = await api.put<unknown>(`/delivery-persons/${id}`, input);
	return deliveryPersonSchema.parse(data);
}

export async function deleteDeliveryPerson(id: string) {
	await api.delete(`/delivery-persons/${id}`);
}
