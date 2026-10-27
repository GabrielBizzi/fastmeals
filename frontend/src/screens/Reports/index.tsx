import '@/components/Charts/setup';
import { Alert, Box, Skeleton, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { ErrorState } from '@/components/ErrorState';
import { DatePicker } from '@/components/Form/DatePicker';
import { PageHeader } from '@/components/PageHeader';
import type { ReportsBundle } from '@/services/reports';
import { VEHICLE_PRESENTATION } from '@/utils/domainLabels';
import { formatCurrency, formatMinutes } from '@/utils/formatters';
import { RevenueChart } from './_components/RevenueChart';
import { StatusChart } from './_components/StatusChart';
import { TopProductsList } from './_components/TopProductsList';
import { PERIOD_PRESETS, useReports, type PeriodPresetKey } from './_hooks/useReports';
import { Kpis, Panel, Panels, PeriodBar, VehicleList } from './styles';

function ReportPanels({ data }: { data: ReportsBundle }) {
	const { revenue, ordersByStatus, topProducts, deliveryTime } = data;

	return (
		<>
			<Kpis>
				<div>
					<dt>Receita entregue</dt>
					<dd>{formatCurrency(revenue.totalRevenue)}</dd>
				</div>
				<div>
					<dt>Pedidos entregues</dt>
					<dd>{revenue.totalOrders}</dd>
				</div>
				<div>
					<dt>Ticket médio</dt>
					<dd>{formatCurrency(revenue.averageOrderValue)}</dd>
				</div>
				<div>
					<dt>Tempo médio de entrega</dt>
					<dd>{deliveryTime.totalDelivered > 0 ? formatMinutes(deliveryTime.averageMinutes) : 'Sem entregas'}</dd>
				</div>
			</Kpis>

			<Panels>
				<Panel aria-labelledby="revenue-title">
					<header>
						<Typography id="revenue-title" variant="h2">
							Receita por dia
						</Typography>
						<Typography variant="caption">Soma dos pedidos entregues, pela data em que foram feitos.</Typography>
					</header>
					<RevenueChart report={revenue} />
				</Panel>

				<Panel aria-labelledby="status-title">
					<header>
						<Typography id="status-title" variant="h2">
							Pedidos por status
						</Typography>
						<Typography variant="caption">{ordersByStatus.total} pedidos feitos no período.</Typography>
					</header>
					<StatusChart report={ordersByStatus} />
				</Panel>

				<Panel aria-labelledby="top-products-title">
					<header>
						<Typography id="top-products-title" variant="h2">
							Mais vendidos
						</Typography>
						<Typography variant="caption">Os 10 produtos com mais unidades entregues.</Typography>
					</header>
					<TopProductsList report={topProducts} />
				</Panel>

				<Panel aria-labelledby="delivery-time-title">
					<header>
						<Typography id="delivery-time-title" variant="h2">
							Tempo de entrega
						</Typography>
						<Typography variant="caption">Do recebimento do pedido até a confirmação da entrega.</Typography>
					</header>
					{deliveryTime.totalDelivered === 0 ? (
						<Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
							Nenhuma entrega concluída no período.
						</Typography>
					) : (
						<>
							<Box sx={{ display: 'flex', gap: 4 }}>
								<div>
									<Typography variant="caption">Mais rápida</Typography>
									<Typography variant="h3" component="p">
										{formatMinutes(deliveryTime.fastestMinutes)}
									</Typography>
								</div>
								<div>
									<Typography variant="caption">Mais lenta</Typography>
									<Typography variant="h3" component="p">
										{formatMinutes(deliveryTime.slowestMinutes)}
									</Typography>
								</div>
							</Box>
							<VehicleList aria-label="Tempo médio por veículo">
								{deliveryTime.byVehicleType.map((entry) => {
									const vehicle = VEHICLE_PRESENTATION[entry.vehicleType];
									return (
										<li key={entry.vehicleType}>
											<vehicle.Icon fontSize="small" aria-hidden />
											<span>{vehicle.label}</span>
											<span className="count">
												{entry.count} {entry.count === 1 ? 'entrega' : 'entregas'}
											</span>
											<span className="minutes">{formatMinutes(entry.averageMinutes)}</span>
										</li>
									);
								})}
							</VehicleList>
						</>
					)}
				</Panel>
			</Panels>
		</>
	);
}

function ReportsSkeleton() {
	return (
		<Box aria-busy aria-label="Carregando relatórios" sx={{ display: 'grid', gap: 2 }}>
			<Skeleton variant="rounded" height={84} />
			<Panels>
				<Skeleton variant="rounded" height={340} />
				<Skeleton variant="rounded" height={340} />
			</Panels>
		</Box>
	);
}

export default function Reports() {
	const { preset, period, valid, reports, selectPreset, updatePeriod } = useReports();

	return (
		<>
			<PageHeader title="Relatórios" description="Indicadores calculados a partir dos pedidos do período." />

			<PeriodBar>
				<ToggleButtonGroup
					exclusive
					size="small"
					value={preset}
					onChange={(_, value: PeriodPresetKey | null) => value && selectPreset(value)}
					aria-label="Período"
				>
					{PERIOD_PRESETS.map((option) => (
						<ToggleButton key={option.key} value={option.key}>
							{option.label}
						</ToggleButton>
					))}
					<ToggleButton value="custom" disabled={preset !== 'custom'}>
						Personalizado
					</ToggleButton>
				</ToggleButtonGroup>
				<DatePicker
					label="De"
					value={period.startDate}
					maxDate={period.endDate}
					clearable={false}
					onChange={(startDate) => startDate && updatePeriod({ startDate })}
				/>
				<DatePicker
					label="Até"
					value={period.endDate}
					minDate={period.startDate}
					clearable={false}
					onChange={(endDate) => endDate && updatePeriod({ endDate })}
				/>
			</PeriodBar>

			{!valid ? (
				<Alert severity="info">Escolha uma data inicial anterior ou igual à data final.</Alert>
			) : reports.status === 'error' && !reports.data ? (
				<ErrorState
					error={reports.error}
					fallbackMessage="Não foi possível carregar os relatórios. Tente novamente."
					onRetry={() => void reports.reload()}
				/>
			) : reports.data ? (
				<Box sx={{ opacity: reports.status === 'loading' ? 0.6 : 1, transition: 'opacity 150ms ease' }}>
					<ReportPanels data={reports.data} />
				</Box>
			) : (
				<ReportsSkeleton />
			)}
		</>
	);
}
