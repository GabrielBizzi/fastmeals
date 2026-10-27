import AddOutlined from '@mui/icons-material/AddOutlined';
import { Alert, Box, Button, MenuItem, Paper, TextField } from '@mui/material';
import { useState } from 'react';
import { ErrorState } from '@/components/ErrorState';
import { DatePicker } from '@/components/Form/DatePicker';
import { PageHeader } from '@/components/PageHeader';
import { TablePager } from '@/components/TablePager';
import { useAuth } from '@/context/auth.context';
import { formatTime } from '@/utils/formatters';
import { CreateOrderDialog } from './_components/CreateOrderDialog';
import { OrderDetailsDialog } from './_components/OrderDetailsDialog';
import { OrdersTable } from './_components/OrdersTable';
import { StatusFilter } from './_components/StatusFilter';
import { useOrdersPanel } from './_hooks/useOrdersPanel';
import { Toolbar } from './styles';

export default function Orders() {
	const { isAdmin } = useAuth();
	const { filters, updateFilters, goToPage, orders, pendingOrderId, changeStatus } = useOrdersPanel();
	const [openOrderId, setOpenOrderId] = useState<string | null>(null);
	const [creating, setCreating] = useState(false);

	const page = orders.data?.page ?? null;
	const hasFilters = Boolean(filters.status || filters.startDate || filters.endDate);
	const showBlockingError = orders.status === 'error' && !orders.data;

	return (
		<>
			<PageHeader
				title="Pedidos"
				description={
					orders.lastUpdatedAt
						? `Atualiza sozinho a cada poucos segundos. Última atualização às ${formatTime(orders.lastUpdatedAt.toISOString())}.`
						: 'Carregando pedidos…'
				}
				actions={
					isAdmin ? (
						<Button variant="contained" startIcon={<AddOutlined />} onClick={() => setCreating(true)}>
							Novo pedido
						</Button>
					) : null
				}
			/>

			<Toolbar>
				<StatusFilter
					value={filters.status}
					counts={orders.data?.counts ?? null}
					onChange={(status) => updateFilters({ status })}
				/>
				<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
					<DatePicker
						label="De"
						value={filters.startDate}
						maxDate={filters.endDate}
						onChange={(startDate) => updateFilters({ startDate })}
					/>
					<DatePicker
						label="Até"
						value={filters.endDate}
						minDate={filters.startDate}
						onChange={(endDate) => updateFilters({ endDate })}
					/>
					<TextField
						select
						label="Ordem"
						value={filters.sortOrder}
						onChange={(event) =>
							updateFilters({ sortOrder: event.target.value === 'asc' ? 'asc' : 'desc' })
						}
						sx={{ width: 170 }}
					>
						<MenuItem value="desc">Mais recentes</MenuItem>
						<MenuItem value="asc">Mais antigos</MenuItem>
					</TextField>
				</Box>
			</Toolbar>

			{orders.status === 'error' && orders.data ? (
				<Alert severity="warning" sx={{ mb: 2 }}>
					Não foi possível atualizar a lista agora. Os dados exibidos podem estar desatualizados.
				</Alert>
			) : null}

			<Paper variant="outlined">
				{showBlockingError ? (
					<ErrorState
						error={orders.error}
						fallbackMessage="Não foi possível carregar os pedidos. Tente novamente."
						onRetry={() => void orders.reload()}
					/>
				) : (
					<>
						<OrdersTable
							orders={page?.data ?? null}
							loading={orders.status === 'loading'}
							canManage={isAdmin}
							pendingOrderId={pendingOrderId}
							hasFilters={hasFilters}
							onOpen={(order) => setOpenOrderId(order.id)}
							onChangeStatus={changeStatus}
						/>
						{page ? (
							<TablePager
								pagination={page.pagination}
								onPageChange={goToPage}
								onLimitChange={(limit) => updateFilters({ limit })}
							/>
						) : null}
					</>
				)}
			</Paper>

			<OrderDetailsDialog
				orderId={openOrderId}
				canManage={isAdmin}
				pendingOrderId={pendingOrderId}
				onClose={() => setOpenOrderId(null)}
				onChangeStatus={changeStatus}
			/>
			{isAdmin ? (
				<CreateOrderDialog
					open={creating}
					onClose={() => setCreating(false)}
					onCreated={() => void orders.reload()}
				/>
			) : null}
		</>
	);
}
