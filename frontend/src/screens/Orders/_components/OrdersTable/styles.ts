import styled from '@emotion/styled';
import { colors } from '@/styles/tokens';

export const ItemsSummary = styled.span`
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
	max-width: 320px;
	color: ${colors.textMuted};
`;

export const StatusCell = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 6px;
`;
