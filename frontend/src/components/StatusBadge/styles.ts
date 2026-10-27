import styled from '@emotion/styled';
import type { OrderStatus } from '@/services/orders';
import { radii, statusColors } from '@/styles/tokens';

export const Badge = styled('span', {
	shouldForwardProp: (prop) => prop !== 'status' && prop !== 'size',
})<{ status: OrderStatus; size: 'small' | 'medium' }>`
	display: inline-flex;
	align-items: center;
	gap: 5px;
	padding: ${({ size }) => (size === 'small' ? '2px 7px' : '3px 9px')};
	border-radius: ${radii.sm}px;
	font-size: ${({ size }) => (size === 'small' ? '0.75rem' : '0.8125rem')};
	font-weight: 500;
	line-height: 1.4;
	white-space: nowrap;
	color: ${({ status }) => statusColors[status].fg};
	background-color: ${({ status }) => statusColors[status].bg};

	svg {
		font-size: 1.05em;
	}
`;
