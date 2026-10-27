import styled from '@emotion/styled';
import { colors, radii } from '@/styles/tokens';

export const ProductCell = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	min-width: 240px;
`;

export const Thumbnail = styled.span`
	flex-shrink: 0;
	width: 40px;
	height: 40px;
	border-radius: ${radii.md}px;
	background-color: ${colors.plate};
	overflow: hidden;

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
`;

export const Description = styled.span`
	display: -webkit-box;
	-webkit-line-clamp: 1;
	-webkit-box-orient: vertical;
	overflow: hidden;
	max-width: 380px;
	font-size: 0.8125rem;
	color: ${colors.textMuted};
`;
