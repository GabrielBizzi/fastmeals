import type { OrderStatus } from '@/services/orders';
import { ORDER_STATUS_PRESENTATION } from '@/utils/domainLabels';
import { Badge } from './styles';

type StatusBadgeProps = {
	status: OrderStatus;
	size?: 'small' | 'medium';
};

export function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
	const { label, Icon } = ORDER_STATUS_PRESENTATION[status];
	return (
		<Badge status={status} size={size}>
			<Icon aria-hidden fontSize="inherit" />
			{label}
		</Badge>
	);
}
