import { useCallback, useState } from 'react';
import { useNotifier } from '@/hooks/useNotifier';
import { useRemoteData } from '@/hooks/useRemoteData';
import { listDeliveryPersons } from '@/services/deliveryPersons';
import {
	dispatchOrder,
	listOrders,
	suggestAssignments,
	type AssignmentPlan,
	type SuggestedAssignment,
} from '@/services/orders';
import { ENV } from '@/utils/env';

export type SuggestionDecision = 'accepting' | 'accepted' | 'rejected';

export function useDispatchBoard() {
	const notifier = useNotifier();
	const [plan, setPlan] = useState<AssignmentPlan | null>(null);
	const [suggesting, setSuggesting] = useState(false);
	const [customerNames, setCustomerNames] = useState<ReadonlyMap<string, string>>(new Map());
	const [decisions, setDecisions] = useState<Record<string, SuggestionDecision>>({});

	const board = useRemoteData(
		async (signal) => {
			const [readyOrders, couriers] = await Promise.all([
				listOrders({ page: 1, limit: 100, status: 'ready', sortBy: 'createdAt', sortOrder: 'asc' }, signal),
				listDeliveryPersons({ isActive: true, available: true }, signal),
			]);
			return { readyOrders: readyOrders.data, couriers };
		},
		'dispatch-board',
		{ pollIntervalMs: ENV.ORDERS_POLLING_MS },
	);
	const reloadBoard = board.reload;
	const readyOrders = board.data?.readyOrders;

	const suggest = useCallback(async () => {
		setSuggesting(true);
		try {
			const result = await suggestAssignments();
			setCustomerNames(new Map((readyOrders ?? []).map((order) => [order.id, order.customerName])));
			setPlan(result);
			setDecisions({});
			if (result.assignments.length === 0 && result.unassigned.length === 0) {
				notifier.success('Nenhum pedido aguardando entregador agora.');
			}
		} catch (error) {
			notifier.failure(error, 'Não foi possível calcular a sugestão. Tente novamente.');
		} finally {
			setSuggesting(false);
		}
	}, [notifier, readyOrders]);

	const decide = (orderId: string, decision: SuggestionDecision | null) =>
		setDecisions(({ [orderId]: _, ...rest }) => (decision ? { ...rest, [orderId]: decision } : rest));

	const accept = useCallback(
		async (assignment: SuggestedAssignment) => {
			decide(assignment.orderId, 'accepting');
			try {
				await dispatchOrder(assignment.orderId, assignment.deliveryPersonId);
				decide(assignment.orderId, 'accepted');
				notifier.success(`Pedido enviado com ${assignment.deliveryPersonName}.`);
			} catch (error) {
				decide(assignment.orderId, null);
				notifier.failure(error, 'Não foi possível despachar o pedido. Tente novamente.');
			} finally {
				await reloadBoard();
			}
		},
		[notifier, reloadBoard],
	);

	const reject = useCallback((assignment: SuggestedAssignment) => {
		decide(assignment.orderId, 'rejected');
	}, []);

	const acceptAll = useCallback(async () => {
		if (!plan) return;
		for (const assignment of plan.assignments) {
			if (!decisions[assignment.orderId]) {
				await accept(assignment);
			}
		}
	}, [plan, decisions, accept]);

	return { board, plan, customerNames, suggesting, decisions, suggest, accept, reject, acceptAll };
}
