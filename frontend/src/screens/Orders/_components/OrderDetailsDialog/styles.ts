import styled from '@emotion/styled';
import { colors } from '@/styles/tokens';

export const Facts = styled.dl`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 14px 24px;
	margin: 0;

	dt {
		font-size: 0.8125rem;
		color: ${colors.textMuted};
		margin-bottom: 2px;
	}

	dd {
		margin: 0;
		font-size: 0.9375rem;
	}
`;

export const Timeline = styled.ol`
	margin: 0;
	padding: 0;
	list-style: none;
	border-left: 2px solid ${colors.line};

	li {
		position: relative;
		display: flex;
		justify-content: space-between;
		gap: 16px;
		padding: 6px 0 6px 16px;
		font-size: 0.875rem;
	}

	li::before {
		content: '';
		position: absolute;
		left: -6px;
		top: 12px;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background-color: ${colors.surface};
		border: 2px solid ${colors.basil};
	}

	time {
		color: ${colors.textMuted};
		white-space: nowrap;
	}
`;
