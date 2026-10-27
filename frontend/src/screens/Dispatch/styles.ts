import styled from '@emotion/styled';
import { colors, radii } from '@/styles/tokens';

export const Section = styled.section`
	margin-bottom: 20px;
	padding: 18px 20px 20px;
	border: 1px solid ${colors.line};
	border-radius: ${radii.lg}px;
	background-color: ${colors.surface};

	> header {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 14px;
	}
`;

export const Columns = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 16px;

	@media (max-width: 1199px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	@media (max-width: 799px) {
		grid-template-columns: minmax(0, 1fr);
	}
`;

export const Column = styled.section`
	padding: 18px 20px 20px;
	border: 1px solid ${colors.line};
	border-radius: ${radii.lg}px;
	background-color: ${colors.surface};
	min-width: 0;

	> header {
		margin-bottom: 12px;
	}
`;

export const Entries = styled.ul`
	margin: 0;
	padding: 0;
	list-style: none;

	li {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 10px 0;
		border-bottom: 1px solid ${colors.line};
	}

	li:last-of-type {
		border-bottom: 0;
	}

	.title {
		display: flex;
		align-items: center;
		gap: 6px;
		font-weight: 600;
		font-size: 0.9375rem;
	}

	.title svg {
		color: ${colors.textMuted};
	}

	.meta {
		font-size: 0.8125rem;
		color: ${colors.textMuted};
	}
`;
