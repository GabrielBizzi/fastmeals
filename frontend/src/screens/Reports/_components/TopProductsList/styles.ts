import styled from '@emotion/styled';
import { colors } from '@/styles/tokens';

export const Ranking = styled.ol`
	margin: 0;
	padding: 0;
	list-style: none;
	display: flex;
	flex-direction: column;
	gap: 12px;

	li {
		display: grid;
		grid-template-columns: 24px 1fr;
		gap: 10px;
		align-items: start;
	}

	.position {
		font-size: 0.8125rem;
		font-weight: 600;
		color: ${colors.textSubtle};
		line-height: 20px;
		text-align: right;
	}

	.line {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		font-size: 0.875rem;
	}

	.name {
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.quantity {
		font-weight: 600;
		white-space: nowrap;
	}

	.revenue {
		font-size: 0.75rem;
		color: ${colors.textMuted};
	}
`;

export const BarTrack = styled.div`
	height: 6px;
	margin: 5px 0 3px;
	border-radius: 3px;
	background-color: ${colors.plate};
	overflow: hidden;
`;

export const Bar = styled.div`
	height: 100%;
	border-radius: 3px;
	background-color: ${colors.route};
`;
