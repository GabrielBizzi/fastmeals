import { alpha } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import type { RevenueReport } from '@/services/reports';
import { colors } from '@/styles/tokens';
import { formatCurrency, formatShortDate } from '@/utils/formatters';
import { ChartBox } from '../../styles';

type RevenueChartProps = {
	report: RevenueReport;
};

export function RevenueChart({ report }: RevenueChartProps) {
	const bestDay = report.dailyRevenue.reduce(
		(best, day) => (day.revenue > best.revenue ? day : best),
		report.dailyRevenue[0] ?? { date: report.startDate, revenue: 0, orders: 0 },
	);
	const summary =
		report.totalOrders === 0
			? 'Nenhuma entrega no período.'
			: `Receita diária no período. Melhor dia: ${formatShortDate(bestDay.date)}, com ${formatCurrency(bestDay.revenue)}.`;

	return (
		<ChartBox role="img" aria-label={summary}>
			<Bar
				data={{
					labels: report.dailyRevenue.map((day) => formatShortDate(day.date)),
					datasets: [
						{
							data: report.dailyRevenue.map((day) => day.revenue),
							backgroundColor: alpha(colors.basil, 0.85),
							hoverBackgroundColor: colors.basilDark,
							borderRadius: 3,
							maxBarThickness: 28,
						},
					],
				}}
				options={{
					plugins: {
						tooltip: {
							callbacks: {
								label: (item) => {
									const day = report.dailyRevenue[item.dataIndex];
									return `${formatCurrency(day.revenue)} em ${day.orders} ${day.orders === 1 ? 'pedido' : 'pedidos'}`;
								},
							},
						},
					},
					scales: {
						x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkipPadding: 12 } },
						y: {
							beginAtZero: true,
							border: { display: false },
							ticks: { callback: (value) => formatCurrency(Number(value)), maxTicksLimit: 5 },
						},
					},
				}}
			/>
		</ChartBox>
	);
}
