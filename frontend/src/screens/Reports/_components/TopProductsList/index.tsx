import { Typography } from '@mui/material';
import type { TopProductsReport } from '@/services/reports';
import { formatCurrency } from '@/utils/formatters';
import { Bar, BarTrack, Ranking } from './styles';

type TopProductsListProps = {
	report: TopProductsReport;
};

export function TopProductsList({ report }: TopProductsListProps) {
	if (report.data.length === 0) {
		return (
			<Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
				Nenhum produto entregue no período.
			</Typography>
		);
	}

	const highest = Math.max(...report.data.map((product) => product.totalQuantity));

	return (
		<Ranking aria-label="Produtos mais vendidos">
			{report.data.map((product, index) => (
				<li key={product.productId}>
					<span className="position">{index + 1}</span>
					<div className="body">
						<div className="line">
							<span className="name">{product.productName}</span>
							<span className="quantity">{product.totalQuantity} un.</span>
						</div>
						<BarTrack aria-hidden>
							<Bar style={{ width: `${(product.totalQuantity / highest) * 100}%` }} />
						</BarTrack>
						<span className="revenue">{formatCurrency(product.totalRevenue)}</span>
					</div>
				</li>
			))}
		</Ranking>
	);
}
