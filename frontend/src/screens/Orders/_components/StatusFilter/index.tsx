import type { OrderStatus } from '@/services/orders';
import type { OrdersByStatusReport } from '@/services/reports';
import { colors, statusColors } from '@/styles/tokens';
import { ORDER_STATUS_ORDER, ORDER_STATUS_PRESENTATION } from '@/utils/domainLabels';
import { Count, FilterButton, FilterGroup } from './styles';

type StatusFilterProps = {
	value: OrderStatus | undefined;
	counts: OrdersByStatusReport | null;
	onChange(status: OrderStatus | undefined): void;
};

export function StatusFilter({ value, counts, onChange }: StatusFilterProps) {
	const countFor = (status: OrderStatus) =>
		counts?.data.find((entry) => entry.status === status)?.count;

	const options: { key: string; status: OrderStatus | undefined; label: string; count?: number }[] = [
		{ key: 'all', status: undefined, label: 'Todos', count: counts?.total },
		...ORDER_STATUS_ORDER.map((status) => ({
			key: status,
			status,
			label: ORDER_STATUS_PRESENTATION[status].label,
			count: countFor(status),
		})),
	];

	return (
		<FilterGroup role="group" aria-label="Filtrar por status">
			{options.map((option) => {
				const selected = option.status === value;
				return (
					<FilterButton
						key={option.key}
						type="button"
						aria-pressed={selected}
						accent={option.status ? statusColors[option.status].accent : colors.asphalt}
						onClick={() => onChange(option.status)}
					>
						{option.label}
						{option.count !== undefined ? <Count>{option.count}</Count> : null}
					</FilterButton>
				);
			})}
		</FilterGroup>
	);
}
