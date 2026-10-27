import type { OrderStatus } from '@/services/orders';
import {
	ORDER_LIFECYCLE,
	ORDER_STATUS_PRESENTATION,
} from '@/utils/domainLabels';
import { Segment, Track } from './styles';

type StatusProgressProps = {
	status: OrderStatus;
};

export function StatusProgress({ status }: StatusProgressProps) {
	const cancelled = status === 'cancelled';
	const reached = cancelled ? 0 : ORDER_LIFECYCLE.indexOf(status) + 1;
	const description = cancelled
		? 'Pedido cancelado'
		: `Etapa ${reached} de ${ORDER_LIFECYCLE.length}: ${ORDER_STATUS_PRESENTATION[status].label}`;

	return (
		<Track role="img" aria-label={description} title={description}>
			{ORDER_LIFECYCLE.map((step, index) => (
				<Segment
					key={step}
					state={cancelled ? 'cancelled' : index < reached ? 'done' : 'todo'}
					status={status}
				/>
			))}
		</Track>
	);
}
