import { Bar } from 'react-chartjs-2';
import type { OrdersByStatusReport } from '@/services/reports';
import { statusColors } from '@/styles/tokens';
import { ORDER_STATUS_PRESENTATION } from '@/utils/domainLabels';
import { ChartBox } from '../../styles';

type StatusChartProps = {
	report: OrdersByStatusReport;
};

export function StatusChart({ report }: StatusChartProps) {
	const summary = report.data
		.map((entry) => `${ORDER_STATUS_PRESENTATION[entry.status].label}: ${entry.count}`)
		.join(', ');

	return (
		<ChartBox role="img" aria-label={`Pedidos por status. ${summary}.`} height={240}>
			<Bar
				data={{
					labels: report.data.map((entry) => ORDER_STATUS_PRESENTATION[entry.status].label),
					datasets: [
						{
							data: report.data.map((entry) => entry.count),
							backgroundColor: report.data.map((entry) => statusColors[entry.status].accent),
							borderRadius: 3,
							barThickness: 18,
						},
					],
				}}
				options={{
					indexAxis: 'y',
					plugins: {
						tooltip: {
							callbacks: {
								label: (item) => {
									const count = report.data[item.dataIndex].count;
									const share = report.total === 0 ? 0 : Math.round((count / report.total) * 100);
									return `${count} ${count === 1 ? 'pedido' : 'pedidos'} (${share}%)`;
								},
							},
						},
					},
					scales: {
						x: {
							beginAtZero: true,
							border: { display: false },
							ticks: { precision: 0, maxTicksLimit: 5 },
						},
						y: { grid: { display: false } },
					},
				}}
			/>
		</ChartBox>
	);
}
