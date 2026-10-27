import { z } from 'zod';
import { api } from './api';
import { compactParams, paginatedSchema, type SortOrder } from './pagination';

export const orderStatusSchema = z.enum([
	'pending',
	'preparing',
	'ready',
	'delivering',
	'delivered',
	'cancelled',
]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const vehicleTypeSchema = z.enum(['bicycle', 'motorcycle', 'car']);
export type VehicleType = z.infer<typeof vehicleTypeSchema>;

export const orderSchema = z.object({
	id: z.string(),
	customerName: z.string(),
	customerPhone: z.string(),
	deliveryAddress: z.string(),
	latitude: z.number(),
	longitude: z.number(),
	status: orderStatusSchema,
	totalAmount: z.number(),
	deliveryPersonId: z.string().nullable(),
	deliveryPerson: z
		.object({
			id: z.string(),
			name: z.string(),
			phone: z.string(),
			vehicleType: vehicleTypeSchema,
		})
		.nullable(),
	items: z.array(
		z.object({
			id: z.string(),
			product: z.object({ id: z.string(), name: z.string() }),
			quantity: z.number(),
			unitPrice: z.number(),
		}),
	),
	availableTransitions: z.array(orderStatusSchema),
	createdAt: z.string(),
	updatedAt: z.string(),
});
export type Order = z.infer<typeof orderSchema>;

export const orderDetailSchema = orderSchema.extend({
	statusHistory: z.array(
		z.object({
			fromStatus: orderStatusSchema.nullable(),
			toStatus: orderStatusSchema,
			changedAt: z.string(),
		}),
	),
});
export type OrderDetail = z.infer<typeof orderDetailSchema>;

const orderPageSchema = paginatedSchema(orderSchema);

export const assignmentPlanSchema = z.object({
	assignments: z.array(
		z.object({
			orderId: z.string(),
			deliveryPersonId: z.string(),
			estimatedDistanceKm: z.number(),
			orderAddress: z.string(),
			deliveryPersonName: z.string(),
		}),
	),
	unassigned: z.array(
		z.object({
			orderId: z.string(),
			orderAddress: z.string(),
			reason: z.string(),
		}),
	),
	totalDistanceKm: z.number(),
	algorithm: z.string(),
	executionTimeMs: z.number(),
});
export type AssignmentPlan = z.infer<typeof assignmentPlanSchema>;
export type SuggestedAssignment = AssignmentPlan['assignments'][number];

export type OrderFilters = {
	page: number;
	limit: number;
	status?: OrderStatus;
	startDate?: string;
	endDate?: string;
	sortBy?: 'createdAt' | 'totalAmount';
	sortOrder?: SortOrder;
};

export type CreateOrderInput = {
	customerName: string;
	customerPhone: string;
	deliveryAddress: string;
	latitude: number;
	longitude: number;
	items: { productId: string; quantity: number }[];
};

export async function listOrders(filters: OrderFilters, signal?: AbortSignal) {
	const { data } = await api.get<unknown>('/orders', {
		params: compactParams(filters),
		signal,
	});
	return orderPageSchema.parse(data);
}

export async function getOrder(id: string, signal?: AbortSignal) {
	const { data } = await api.get<unknown>(`/orders/${id}`, { signal });
	return orderDetailSchema.parse(data);
}

export async function createOrder(input: CreateOrderInput) {
	const { data } = await api.post<unknown>('/orders', input);
	return orderSchema.parse(data);
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
	const { data } = await api.patch<unknown>(`/orders/${id}/status`, { status });
	return orderSchema.parse(data);
}

export async function assignDeliveryPerson(
	id: string,
	deliveryPersonId: string,
) {
	const { data } = await api.patch<unknown>(`/orders/${id}/assign`, {
		deliveryPersonId,
	});
	return orderSchema.parse(data);
}

export async function suggestAssignments() {
	const { data } = await api.post<unknown>('/orders/optimize-assignment');
	return assignmentPlanSchema.parse(data);
}

export async function dispatchOrder(orderId: string, deliveryPersonId: string) {
	await assignDeliveryPerson(orderId, deliveryPersonId);
	return updateOrderStatus(orderId, 'delivering');
}
