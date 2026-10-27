import { OrderStatus } from '@prisma/client';

const MINUTE_MS = 60_000;

const LIFECYCLE: readonly OrderStatus[] = [
	OrderStatus.pending,
	OrderStatus.preparing,
	OrderStatus.ready,
	OrderStatus.delivering,
	OrderStatus.delivered,
];

export type TimelineEntry = {
	fromStatus: OrderStatus | null;
	toStatus: OrderStatus;
	changedAt: Date;
};

export type TimelineDurations = {
	acceptMinutes: number;
	preparationMinutes: number;
	pickupMinutes: number;
	travelMinutes: number;
};

export function buildOrderTimeline(
	createdAt: Date,
	finalStatus: OrderStatus,
	durations: TimelineDurations,
): TimelineEntry[] {
	const stepMinutes: Record<OrderStatus, number> = {
		pending: 0,
		preparing: durations.acceptMinutes,
		ready: durations.preparationMinutes,
		delivering: durations.pickupMinutes,
		delivered: durations.travelMinutes,
		cancelled: durations.acceptMinutes,
	};

	const path =
		finalStatus === OrderStatus.cancelled
			? [OrderStatus.pending, OrderStatus.cancelled]
			: LIFECYCLE.slice(0, LIFECYCLE.indexOf(finalStatus) + 1);

	let elapsedMs = 0;
	return path.map((status, index) => {
		elapsedMs += stepMinutes[status] * MINUTE_MS;
		return {
			fromStatus: index === 0 ? null : path[index - 1],
			toStatus: status,
			changedAt: new Date(createdAt.getTime() + elapsedMs),
		};
	});
}

export function timelineEnd(timeline: TimelineEntry[]): Date {
	return timeline[timeline.length - 1].changedAt;
}
