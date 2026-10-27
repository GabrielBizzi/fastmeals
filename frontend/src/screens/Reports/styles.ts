import styled from '@emotion/styled';
import { colors, radii } from '@/styles/tokens';

export const PeriodBar = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12px;
	margin-bottom: 20px;
`;

export const Kpis = styled.dl`
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	margin: 0 0 20px;
	border: 1px solid ${colors.line};
	border-radius: ${radii.lg}px;
	background-color: ${colors.surface};

	> div {
		padding: 16px 20px;
		border-left: 1px solid ${colors.line};
	}

	> div:first-of-type {
		border-left: 0;
	}

	dt {
		font-size: 0.8125rem;
		color: ${colors.textMuted};
	}

	dd {
		margin: 4px 0 0;
		font-size: 1.5rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	@media (max-width: 899px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));

		> div:nth-of-type(3) {
			border-left: 0;
		}

		> div:nth-of-type(n + 3) {
			border-top: 1px solid ${colors.line};
		}
	}
`;

export const Panels = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
	gap: 16px;

	@media (max-width: 1099px) {
		grid-template-columns: minmax(0, 1fr);
	}
`;

export const Panel = styled.section`
	padding: 18px 20px 20px;
	border: 1px solid ${colors.line};
	border-radius: ${radii.lg}px;
	background-color: ${colors.surface};
	min-width: 0;

	h2 {
		margin: 0 0 2px;
	}

	header {
		margin-bottom: 14px;
	}
`;

export const ChartBox = styled('div', {
	shouldForwardProp: (prop) => prop !== 'height',
})<{ height?: number }>`
	position: relative;
	height: ${({ height = 280 }) => height}px;
`;

export const VehicleList = styled.ul`
	margin: 16px 0 0;
	padding: 0;
	list-style: none;
	border-top: 1px solid ${colors.line};

	li {
		display: grid;
		grid-template-columns: 24px 1fr auto auto;
		align-items: center;
		gap: 10px;
		padding: 10px 0;
		border-bottom: 1px solid ${colors.line};
		font-size: 0.875rem;
	}

	li:last-of-type {
		border-bottom: 0;
	}

	svg {
		color: ${colors.textMuted};
	}

	.count {
		color: ${colors.textMuted};
		font-size: 0.8125rem;
	}

	.minutes {
		font-weight: 600;
		min-width: 64px;
		text-align: right;
	}
`;
