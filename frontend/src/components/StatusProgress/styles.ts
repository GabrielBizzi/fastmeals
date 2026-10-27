import styled from '@emotion/styled';
import type { OrderStatus } from '@/services/orders';
import { colors, statusColors } from '@/styles/tokens';

export const Track = styled.span`
	display: inline-grid;
	grid-template-columns: repeat(5, 1fr);
	gap: 3px;
	width: 92px;
`;

type SegmentState = 'done' | 'todo' | 'cancelled';

export const Segment = styled('span', {
	shouldForwardProp: (prop) => prop !== 'state' && prop !== 'status',
})<{ state: SegmentState; status: OrderStatus }>`
	height: 6px;
	border-radius: 3px;
	background-color: ${({ state, status }) => {
		if (state === 'done') return statusColors[status].accent;
		if (state === 'cancelled') return statusColors.cancelled.bg;
		return colors.line;
	}};
	transition: background-color 200ms ease;
`;
