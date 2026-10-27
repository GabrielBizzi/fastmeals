import AltRouteOutlined from '@mui/icons-material/AltRouteOutlined';
import { Button, Stack } from '@mui/material';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ROUTES } from '@/routes/paths';
import type { Order, OrderStatus } from '@/services/orders';
import { TRANSITION_ACTION_LABELS } from '@/utils/domainLabels';

type OrderActionsProps = {
	order: Order;
	busy: boolean;
	onChangeStatus(order: Order, status: OrderStatus): Promise<boolean>;
	layout?: 'row' | 'dialog';
};

export function OrderActions({ order, busy, onChangeStatus, layout = 'row' }: OrderActionsProps) {
	const [confirmingCancel, setConfirmingCancel] = useState(false);
	const forward = order.availableTransitions.filter((status) => status !== 'cancelled');
	const canCancel = order.availableTransitions.includes('cancelled');
	const needsCourier = order.status === 'ready' && !order.deliveryPersonId;
	const size = layout === 'row' ? 'small' : 'medium';

	if (forward.length === 0 && !canCancel) return null;

	return (
		<Stack direction="row" spacing={1} justifyContent={layout === 'row' ? 'flex-end' : 'flex-start'}>
			{forward.map((status) => (
				<Button
					key={status}
					size={size}
					variant="contained"
					disabled={busy}
					onClick={() => void onChangeStatus(order, status)}
				>
					{TRANSITION_ACTION_LABELS[status]}
				</Button>
			))}
			{needsCourier ? (
				<Button
					size={size}
					variant="outlined"
					component={RouterLink}
					to={ROUTES.dispatch}
					startIcon={<AltRouteOutlined />}
				>
					Despachar
				</Button>
			) : null}
			{canCancel ? (
				<Button
					size={size}
					color="error"
					disabled={busy}
					onClick={() => setConfirmingCancel(true)}
				>
					Cancelar
				</Button>
			) : null}
			<ConfirmDialog
				open={confirmingCancel}
				title="Cancelar este pedido?"
				description={`O pedido de ${order.customerName} será cancelado e não poderá voltar para a fila.`}
				confirmLabel="Cancelar pedido"
				tone="danger"
				busy={busy}
				onCancel={() => setConfirmingCancel(false)}
				onConfirm={async () => {
					const succeeded = await onChangeStatus(order, 'cancelled');
					if (succeeded) setConfirmingCancel(false);
				}}
			/>
		</Stack>
	);
}
