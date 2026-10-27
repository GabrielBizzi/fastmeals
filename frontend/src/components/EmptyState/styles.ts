import styled from '@emotion/styled';
import { colors } from '@/styles/tokens';

export const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	padding: 48px 24px;
	text-align: center;
	max-width: 440px;
	margin: 0 auto;

	> svg {
		font-size: 32px;
		color: ${colors.asphaltMuted};
		margin-bottom: 4px;
	}

	> button {
		margin-top: 8px;
	}
`;
