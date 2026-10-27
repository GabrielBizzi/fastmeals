import CloseOutlined from '@mui/icons-material/CloseOutlined';
import {
	Box,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import { ErrorState } from '@/components/ErrorState';
import { StatusBadge } from '@/components/StatusBadge';
import { useRemoteData } from '@/hooks/useRemoteData';
import { getOrder, type Order, type OrderStatus } from '@/services/orders';
import { ORDER_STATUS_PRESENTATION, VEHICLE_PRESENTATION } from '@/utils/domainLabels';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { OrderActions } from '../OrderActions';
import { Facts, Timeline } from './styles';

type OrderDetailsDialogProps = {
	orderId: string | null;
	canManage: boolean;
	pendingOrderId: string | null;
	onClose(): void;
	onChangeStatus(order: Order, status: OrderStatus): Promise<boolean>;
};

export function OrderDetailsDialog({
	orderId,
	canManage,
	pendingOrderId,
	onClose,
	onChangeStatus,
}: OrderDetailsDialogProps) {
	const detail = useRemoteData((signal) => getOrder(orderId ?? '', signal), orderId ?? '', {
		enabled: Boolean(orderId),
	});
	const order = detail.data?.id === orderId ? detail.data : null;

	const handleChangeStatus = async (target: Order, status: OrderStatus) => {
		const succeeded = await onChangeStatus(target, status);
		await detail.reload();
		return succeeded;
	};

	return (
		<Dialog open={Boolean(orderId)} onClose={onClose} maxWidth="md" fullWidth aria-labelledby="order-details-title">
			<DialogTitle id="order-details-title" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
				<Box component="span" sx={{ flex: 1 }}>
					{order ? `Pedido de ${order.customerName}` : 'Detalhes do pedido'}
				</Box>
				{order ? <StatusBadge status={order.status} /> : null}
				<IconButton aria-label="Fechar" onClick={onClose} size="small">
					<CloseOutlined />
				</IconButton>
			</DialogTitle>

			<DialogContent>
				{detail.status === 'error' && !order ? (
					<ErrorState
						error={detail.error}
						fallbackMessage="Não foi possível carregar o pedido. Tente novamente."
						onRetry={() => void detail.reload()}
					/>
				) : !order ? (
					<Box sx={{ display: 'grid', gap: 1.5, py: 1 }} aria-busy>
						<Skeleton height={28} width="60%" />
						<Skeleton height={20} />
						<Skeleton height={120} variant="rounded" />
					</Box>
				) : (
					<Box sx={{ display: 'grid', gap: 3 }}>
						<Facts>
							<div>
								<dt>Telefone</dt>
								<dd>{order.customerPhone}</dd>
							</div>
							<div>
								<dt>Endereço de entrega</dt>
								<dd>{order.deliveryAddress}</dd>
							</div>
							<div>
								<dt>Recebido em</dt>
								<dd>{formatDateTime(order.createdAt)}</dd>
							</div>
							<div>
								<dt>Entregador</dt>
								<dd>
									{order.deliveryPerson
										? `${order.deliveryPerson.name} (${VEHICLE_PRESENTATION[order.deliveryPerson.vehicleType].label.toLowerCase()})`
										: 'Ainda não atribuído'}
								</dd>
							</div>
						</Facts>

						<Table size="small" aria-label="Itens do pedido">
							<TableHead>
								<TableRow>
									<TableCell>Item</TableCell>
									<TableCell align="right">Qtd.</TableCell>
									<TableCell align="right">Preço unitário</TableCell>
									<TableCell align="right">Subtotal</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{order.items.map((item) => (
									<TableRow key={item.id}>
										<TableCell>{item.product.name}</TableCell>
										<TableCell align="right">{item.quantity}</TableCell>
										<TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
										<TableCell align="right">
											{formatCurrency(item.unitPrice * item.quantity)}
										</TableCell>
									</TableRow>
								))}
								<TableRow>
									<TableCell colSpan={3} sx={{ fontWeight: 600 }}>
										Total
									</TableCell>
									<TableCell align="right" sx={{ fontWeight: 600 }}>
										{formatCurrency(order.totalAmount)}
									</TableCell>
								</TableRow>
							</TableBody>
						</Table>

						<div>
							<Typography variant="h3" component="h3" sx={{ mb: 1 }}>
								Histórico
							</Typography>
							<Timeline>
								{order.statusHistory.map((entry) => (
									<li key={`${entry.toStatus}-${entry.changedAt}`}>
										<span>{ORDER_STATUS_PRESENTATION[entry.toStatus].label}</span>
										<time dateTime={entry.changedAt}>{formatDateTime(entry.changedAt)}</time>
									</li>
								))}
							</Timeline>
						</div>
					</Box>
				)}
			</DialogContent>

			{order && canManage && order.availableTransitions.length > 0 ? (
				<DialogActions sx={{ justifyContent: 'flex-start' }}>
					<OrderActions
						order={order}
						busy={pendingOrderId === order.id}
						onChangeStatus={handleChangeStatus}
						layout="dialog"
					/>
				</DialogActions>
			) : null}
		</Dialog>
	);
}
