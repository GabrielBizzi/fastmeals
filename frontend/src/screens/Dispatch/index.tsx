import AltRouteOutlined from '@mui/icons-material/AltRouteOutlined';
import { Box, Button, Skeleton, Typography } from '@mui/material';
import { useMemo } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { VEHICLE_PRESENTATION } from '@/utils/domainLabels';
import { formatDistance, formatRelativeMinutes, summarizeItems } from '@/utils/formatters';
import { RouteSketch } from './_components/RouteSketch';
import { SuggestionList } from './_components/SuggestionList';
import { useDispatchBoard } from './_hooks/useDispatchBoard';
import { Column, Columns, Entries, Section } from './styles';

export default function Dispatch() {
	const { board, plan, customerNames, suggesting, decisions, suggest, accept, reject, acceptAll } = useDispatchBoard();

	const waitingOrders = useMemo(
		() => board.data?.readyOrders.filter((order) => !order.deliveryPersonId) ?? [],
		[board.data],
	);
	const hiddenOrderIds = useMemo(
		() => new Set(Object.keys(decisions).filter((orderId) => decisions[orderId] === 'rejected')),
		[decisions],
	);
	const openSuggestions = plan?.assignments.filter((assignment) => !decisions[assignment.orderId]).length ?? 0;

	if (board.status === 'error' && !board.data) {
		return (
			<>
				<PageHeader title="Despacho" />
				<ErrorState
					error={board.error}
					fallbackMessage="Não foi possível carregar os pedidos prontos. Tente novamente."
					onRetry={() => void board.reload()}
				/>
			</>
		);
	}

	return (
		<>
			<PageHeader
				title="Despacho"
				description="Combine os pedidos prontos com os entregadores livres pela menor distância total."
				actions={
					<Button
						variant="contained"
						startIcon={<AltRouteOutlined />}
						onClick={() => void suggest()}
						disabled={suggesting || board.status === 'loading'}
					>
						{suggesting ? 'Calculando…' : 'Sugerir atribuição otimizada'}
					</Button>
				}
			/>

			{plan ? (
				<Section aria-labelledby="suggestion-title">
					<header>
						<div>
							<Typography id="suggestion-title" variant="h2">
								Sugestão
							</Typography>
							<Typography variant="caption">
								{plan.assignments.length > 0
									? `Distância total de ${formatDistance(plan.totalDistanceKm)}, calculada em ${plan.executionTimeMs.toLocaleString('pt-BR')} ms.`
									: 'Nenhuma combinação possível agora.'}
							</Typography>
						</div>
						{openSuggestions > 1 ? (
							<Button variant="outlined" onClick={() => void acceptAll()}>
								Aceitar todas ({openSuggestions})
							</Button>
						) : null}
					</header>
					{plan.assignments.length === 0 && plan.unassigned.length === 0 ? (
						<Typography variant="body2" color="text.secondary">
							Não há pedidos prontos aguardando entregador.
						</Typography>
					) : (
						<SuggestionList
							plan={plan}
							decisions={decisions}
							customerNames={customerNames}
							onAccept={(assignment) => void accept(assignment)} onReject={reject} />
					)}
				</Section>
			) : null}

			<Columns>
				<Column aria-labelledby="ready-title">
					<header>
						<Typography id="ready-title" variant="h2">
							Prontos para sair
						</Typography>
						<Typography variant="caption">
							{board.data ? `${waitingOrders.length} aguardando entregador` : 'Carregando…'}
						</Typography>
					</header>
					{!board.data ? (
						<Skeleton variant="rounded" height={160} />
					) : waitingOrders.length === 0 ? (
						<EmptyState title="Nenhum pedido pronto aguardando entregador." />
					) : (
						<Entries>
							{waitingOrders.map((order) => (
								<li key={order.id}>
									<span className="title">{order.customerName}</span>
									<span className="meta">{order.deliveryAddress}</span>
									<span className="meta">
										{summarizeItems(order.items)}. Pronto {formatRelativeMinutes(order.updatedAt)}.
									</span>
								</li>
							))}
						</Entries>
					)}
				</Column>

				<Column aria-labelledby="couriers-title">
					<header>
						<Typography id="couriers-title" variant="h2">
							Entregadores livres
						</Typography>
						<Typography variant="caption">
							{board.data ? `${board.data.couriers.length} sem entrega em andamento` : 'Carregando…'}
						</Typography>
					</header>
					{!board.data ? (
						<Skeleton variant="rounded" height={160} />
					) : board.data.couriers.length === 0 ? (
						<EmptyState title="Nenhum entregador livre agora." />
					) : (
						<Entries>
							{board.data.couriers.map((courier) => {
								const vehicle = VEHICLE_PRESENTATION[courier.vehicleType];
								return (
									<li key={courier.id}>
										<span className="title">
											<vehicle.Icon fontSize="small" aria-hidden />
											{courier.name}
										</span>
										<span className="meta">
											{courier.currentLatitude === null
												? 'Sem localização, não entra na sugestão'
												: `${vehicle.label}, ${courier.phone}`}
										</span>
									</li>
								);
							})}
						</Entries>
					)}
				</Column>

				<Column aria-labelledby="sketch-title">
					<header>
						<Typography id="sketch-title" variant="h2">
							Mapa esquemático
						</Typography>
						<Typography variant="caption">Posições relativas, sem escala de ruas.</Typography>
					</header>
					{board.data ? (
						<RouteSketch
							orders={waitingOrders}
							couriers={board.data.couriers}
							plan={plan}
							hiddenOrderIds={hiddenOrderIds}
						/>
					) : (
						<Skeleton variant="rounded" height={200} />
					)}
					{board.data && waitingOrders.length === 0 && board.data.couriers.length === 0 ? (
						<Box sx={{ py: 2 }}>
							<Typography variant="body2" color="text.secondary">
								Nada para mostrar no momento.
							</Typography>
						</Box>
					) : null}
				</Column>
			</Columns>
		</>
	);
}
