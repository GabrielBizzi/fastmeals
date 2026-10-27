import { useCallback, useState } from 'react';
import { useNotifier } from '@/hooks/useNotifier';
import { useRemoteData } from '@/hooks/useRemoteData';
import { listOrders, updateOrderStatus, type Order, type OrderStatus } from '@/services/orders';
import { getOrdersByStatus } from '@/services/reports';
import { ENV } from '@/utils/env';
import { TRANSITION_SUCCESS_MESSAGES } from '@/utils/domainLabels';

export type OrdersPanelFilters = {
	status?: OrderStatus;
	startDate?: string;
	endDate?: string;
	sortOrder: 'asc' | 'desc';
	page: number;
	limit: number;
};

const INITIAL_FILTERS: OrdersPanelFilters = { sortOrder: 'desc', page: 1, limit: 20 };

export function useOrdersPanel() {
	const notifier = useNotifier();
	const [filters, setFilters] = useState<OrdersPanelFilters>(INITIAL_FILTERS);
	const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

	const orders = useRemoteData(
		async (signal) => {
			const period = { startDate: filters.startDate, endDate: filters.endDate };
			const [page, counts] = await Promise.all([
				listOrders({ ...filters, sortBy: 'createdAt' }, signal),
				getOrdersByStatus(period, signal),
			]);
			return { page, counts };
		},
		JSON.stringify(filters),
		{ pollIntervalMs: ENV.ORDERS_POLLING_MS },
	);

	const reloadOrders = orders.reload;

	const updateFilters = useCallback((patch: Partial<OrdersPanelFilters>) => {
		setFilters((current) => ({ ...current, page: 1, ...patch }));
	}, []);

	const goToPage = useCallback((page: number) => {
		setFilters((current) => ({ ...current, page }));
	}, []);

	const changeStatus = useCallback(
		async (order: Order, status: OrderStatus) => {
			setPendingOrderId(order.id);
			try {
				await updateOrderStatus(order.id, status);
				notifier.success(TRANSITION_SUCCESS_MESSAGES[status]);
				await reloadOrders();
				return true;
			} catch (error) {
				notifier.failure(error, 'Não foi possível atualizar o pedido. Tente novamente.');
				await reloadOrders();
				return false;
			} finally {
				setPendingOrderId(null);
			}
		},
		[notifier, reloadOrders],
	);

	return {
		filters,
		updateFilters,
		goToPage,
		orders,
		pendingOrderId,
		changeStatus,
	};
}
