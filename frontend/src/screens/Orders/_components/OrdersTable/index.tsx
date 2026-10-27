import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';
import {
	Link,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import { StatusProgress } from '@/components/StatusProgress';
import { TableSkeleton } from '@/components/TableSkeleton';
import type { Order, OrderStatus } from '@/services/orders';
import {
	formatCurrency,
	formatDateTime,
	formatRelativeMinutes,
	summarizeItems,
} from '@/utils/formatters';
import { OrderActions } from '../OrderActions';
import { ItemsSummary, StatusCell } from './styles';

const COLUMN_COUNT = 6;

type OrdersTableProps = {
	orders: Order[] | null;
	loading: boolean;
	canManage: boolean;
	pendingOrderId: string | null;
	hasFilters: boolean;
	onOpen(order: Order): void;
	onChangeStatus(order: Order, status: OrderStatus): Promise<boolean>;
};

export function OrdersTable({
	orders,
	loading,
	canManage,
	pendingOrderId,
	hasFilters,
	onOpen,
	onChangeStatus,
}: OrdersTableProps) {
	if (!loading && orders?.length === 0) {
		return (
			<EmptyState
				icon={<ReceiptLongOutlined aria-hidden />}
				title={hasFilters ? 'Não há pedidos para os filtros selecionados.' : 'Nenhum pedido por aqui ainda.'}
				description={
					hasFilters
						? 'Ajuste o status ou o período para ver outros pedidos.'
						: 'Os novos pedidos aparecem nesta lista automaticamente.'
				}
			/>
		);
	}

	return (
		<TableContainer>
			<Table aria-label="Pedidos" aria-busy={loading}>
				<TableHead>
					<TableRow>
						<TableCell>Cliente</TableCell>
						<TableCell>Itens</TableCell>
						<TableCell align="right">Total</TableCell>
						<TableCell>Status</TableCell>
						<TableCell>Entregador</TableCell>
						<TableCell align="right">{canManage ? 'Ações' : ''}</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{loading && !orders ? (
						<TableSkeleton columns={COLUMN_COUNT} />
					) : (
						orders?.map((order) => (
							<TableRow key={order.id} hover>
								<TableCell>
									<Link
										component="button"
										type="button"
										onClick={() => onOpen(order)}
										sx={{ fontWeight: 600, color: 'text.primary', textAlign: 'left' }}
									>
										{order.customerName}
									</Link>
									<Typography variant="caption" component="p" title={formatDateTime(order.createdAt)}>
										{formatRelativeMinutes(order.createdAt)}
									</Typography>
								</TableCell>
								<TableCell>
									<ItemsSummary title={summarizeItems(order.items)}>
										{summarizeItems(order.items)}
									</ItemsSummary>
								</TableCell>
								<TableCell align="right" sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
									{formatCurrency(order.totalAmount)}
								</TableCell>
								<TableCell>
									<StatusCell>
										<StatusBadge status={order.status} size="small" />
										<StatusProgress status={order.status} />
									</StatusCell>
								</TableCell>
								<TableCell>
									{order.deliveryPerson?.name ?? (
										<Typography variant="body2" color="text.secondary" component="span">
											Sem entregador
										</Typography>
									)}
								</TableCell>
								<TableCell align="right">
									{canManage ? (
										<OrderActions
											order={order}
											busy={pendingOrderId === order.id}
											onChangeStatus={onChangeStatus}
										/>
									) : null}
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</TableContainer>
	);
}
