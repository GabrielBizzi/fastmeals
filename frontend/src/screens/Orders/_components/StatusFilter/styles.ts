import styled from '@emotion/styled';
import { colors, radii } from '@/styles/tokens';

export const FilterGroup = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
`;

export const Count = styled.span`
	min-width: 22px;
	padding: 0 6px;
	border-radius: 10px;
	font-size: 0.75rem;
	line-height: 18px;
	text-align: center;
	background-color: ${colors.plate};
	color: ${colors.textMuted};
`;

export const FilterButton = styled('button', {
	shouldForwardProp: (prop) => prop !== 'accent',
})<{ accent: string }>`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 6px 10px 6px 12px;
	border: 1px solid ${colors.line};
	border-radius: ${radii.md}px;
	background-color: ${colors.surface};
	color: ${colors.text};
	font: inherit;
	font-size: 0.875rem;
	cursor: pointer;
	transition: border-color 120ms ease, background-color 120ms ease;

	&:hover {
		border-color: ${colors.lineStrong};
	}

	&[aria-pressed='true'] {
		border-color: ${({ accent }) => accent};
		box-shadow: inset 0 -2px 0 ${({ accent }) => accent};
		font-weight: 600;
	}
`;
