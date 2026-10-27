import { OrderStatus } from '@prisma/client';

export const ORDER_TRANSITIONS: Readonly<
	Record<OrderStatus, readonly OrderStatus[]>
> = {
	pending: [OrderStatus.preparing, OrderStatus.cancelled],
	preparing: [OrderStatus.ready, OrderStatus.cancelled],
	ready: [OrderStatus.delivering, OrderStatus.cancelled],
	delivering: [OrderStatus.delivered],
	delivered: [],
	cancelled: [],
};

export const ASSIGNABLE_STATUSES: readonly OrderStatus[] = [
	OrderStatus.pending,
	OrderStatus.preparing,
	OrderStatus.ready,
];

type TransitionSubject = {
	status: OrderStatus;
	deliveryPersonId: string | null;
};

export type TransitionCheck =
	| { allowed: true }
	| { allowed: false; reason: 'NOT_ALLOWED' | 'MISSING_DELIVERY_PERSON' };

export function checkTransition(
	order: TransitionSubject,
	target: OrderStatus,
): TransitionCheck {
	if (!ORDER_TRANSITIONS[order.status].includes(target)) {
		return { allowed: false, reason: 'NOT_ALLOWED' };
	}
	if (target === OrderStatus.delivering && !order.deliveryPersonId) {
		return { allowed: false, reason: 'MISSING_DELIVERY_PERSON' };
	}
	return { allowed: true };
}

export function getAvailableTransitions(
	order: TransitionSubject,
): OrderStatus[] {
	return ORDER_TRANSITIONS[order.status].filter(
		(target) => checkTransition(order, target).allowed,
	);
}
