import styled from '@emotion/styled';
import { colors } from '@/styles/tokens';

export const Page = styled.div`
	display: grid;
	grid-template-columns: minmax(320px, 5fr) 7fr;
	min-height: 100vh;
	background-color: ${colors.surface};

	@media (max-width: 899px) {
		grid-template-columns: 1fr;
	}
`;

export const Aside = styled.aside`
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	padding: 40px 48px;
	background-color: ${colors.asphalt};
	color: #ffffff;

	@media (max-width: 899px) {
		padding: 24px 20px;
		gap: 24px;
	}
`;

export const Wordmark = styled.p`
	margin: 0;
	display: flex;
	align-items: center;
	gap: 10px;
	font-size: 1.125rem;
	font-weight: 600;
`;

export const Statement = styled.p`
	margin: auto 0;
	max-width: 22ch;
	font-size: clamp(1.5rem, 2.6vw, 2.25rem);
	line-height: 1.2;
	font-weight: 500;
	letter-spacing: -0.015em;
	color: #e6ebf0;

	@media (max-width: 899px) {
		display: none;
	}
`;

export const FormArea = styled.section`
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 40px 24px;
`;

export const Form = styled.form`
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 100%;
	max-width: 380px;
`;
