import styled from '@emotion/styled';
import { colors, radii } from '@/styles/tokens';

export const Rows = styled.ul`
	margin: 0;
	padding: 0;
	list-style: none;
	border: 1px solid ${colors.line};
	border-radius: ${radii.md}px;
	overflow: hidden;
`;

export const Row = styled.li`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 10px 16px;
	padding: 12px 14px;
	border-bottom: 1px solid ${colors.line};
	background-color: ${colors.surface};
	transition: background-color 160ms ease, opacity 160ms ease;

	&:last-of-type {
		border-bottom: 0;
	}

	&[data-decision='accepted'] {
		background-color: ${colors.basilTint};
	}

	&[data-decision='rejected'] {
		opacity: 0.6;
	}

	&[data-decision='unassigned'] {
		background-color: ${colors.warningTint};
	}

	.pair {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.address {
		font-weight: 500;
		font-size: 0.9375rem;
	}

	.courier {
		font-size: 0.8125rem;
		color: ${colors.textMuted};
	}

	.actions {
		display: flex;
		gap: 8px;
	}
`;
