import type { OrderStatus, Prisma, VehicleType } from '@prisma/client';
import { toNumber } from '../../utils/money';
import { getAvailableTransitions } from './orderStatus';

export const orderInclude = {
	deliveryPerson: {
		select: { id: true, name: true, phone: true, vehicleType: true },
	},
	items: {
		select: {
			id: true,
			quantity: true,
			unitPrice: true,
			product: { select: { id: true, name: true } },
		},
		orderBy: [{ product: { name: 'asc' } }, { id: 'asc' }],
	},
} satisfies Prisma.OrderInclude;

export const orderDetailInclude = {
	...orderInclude,
	statusHistory: {
		select: { fromStatus: true, toStatus: true, changedAt: true },
		orderBy: { changedAt: 'asc' },
	},
} satisfies Prisma.OrderInclude;

type OrderWithRelations = Prisma.OrderGetPayload<{
	include: typeof orderInclude;
}>;
type OrderWithDetail = Prisma.OrderGetPayload<{
	include: typeof orderDetailInclude;
}>;

export type OrderResponse = {
	id: string;
	customerName: string;
	customerPhone: string;
	deliveryAddress: string;
	latitude: number;
	longitude: number;
	status: OrderStatus;
	totalAmount: number;
	deliveryPersonId: string | null;
	deliveryPerson: {
		id: string;
		name: string;
		phone: string;
		vehicleType: VehicleType;
	} | null;
	items: {
		id: string;
		product: { id: string; name: string };
		quantity: number;
		unitPrice: number;
	}[];
	availableTransitions: OrderStatus[];
	createdAt: string;
	updatedAt: string;
};

export type OrderDetailResponse = OrderResponse & {
	statusHistory: {
		fromStatus: OrderStatus | null;
		toStatus: OrderStatus;
		changedAt: string;
	}[];
};

export function toOrderResponse(order: OrderWithRelations): OrderResponse {
	return {
		id: order.id,
		customerName: order.customerName,
		customerPhone: order.customerPhone,
		deliveryAddress: order.deliveryAddress,
		latitude: toNumber(order.latitude),
		longitude: toNumber(order.longitude),
		status: order.status,
		totalAmount: toNumber(order.totalAmount),
		deliveryPersonId: order.deliveryPersonId,
		deliveryPerson: order.deliveryPerson,
		items: order.items.map((item) => ({
			id: item.id,
			product: item.product,
			quantity: item.quantity,
			unitPrice: toNumber(item.unitPrice),
		})),
		availableTransitions: getAvailableTransitions(order),
		createdAt: order.createdAt.toISOString(),
		updatedAt: order.updatedAt.toISOString(),
	};
}

export function toOrderDetailResponse(
	order: OrderWithDetail,
): OrderDetailResponse {
	return {
		...toOrderResponse(order),
		statusHistory: order.statusHistory.map((entry) => ({
			fromStatus: entry.fromStatus,
			toStatus: entry.toStatus,
			changedAt: entry.changedAt.toISOString(),
		})),
	};
}
