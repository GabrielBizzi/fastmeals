import styled from '@emotion/styled';
import { colors, layout } from '@/styles/tokens';

export const Shell = styled.div`
	display: flex;
	min-height: 100vh;
`;

export const Rail = styled.nav`
	display: flex;
	flex-direction: column;
	width: ${layout.sidebarWidth}px;
	height: 100%;
	padding: 18px 12px;
	background-color: ${colors.asphalt};
	color: #ffffff;
`;

export const DesktopRail = styled.div`
	position: sticky;
	top: 0;
	height: 100vh;
	flex-shrink: 0;

	@media (max-width: 899px) {
		display: none;
	}
`;

export const Brand = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 4px 10px 22px;
	font-size: 1.0625rem;
	font-weight: 600;
	letter-spacing: -0.01em;

	small {
		display: block;
		font-size: 0.75rem;
		font-weight: 400;
		color: ${colors.asphaltMuted};
	}
`;

export const BrandMark = styled.span`
	display: grid;
	place-items: center;
	width: 30px;
	height: 30px;
	border-radius: 7px;
	background-color: ${colors.basil};
	color: ${colors.mint};
	font-weight: 700;
`;

export const NavList = styled.ul`
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 2px;

	a {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 9px 10px;
		border-radius: 6px;
		color: #c9d2dc;
		text-decoration: none;
		font-size: 0.9375rem;
		transition:
			background-color 120ms ease,
			color 120ms ease;

		svg {
			font-size: 20px;
			color: ${colors.asphaltMuted};
		}

		&:hover {
			background-color: ${colors.asphaltSoft};
			color: #ffffff;
		}

		&.active {
			background-color: ${colors.asphaltSoft};
			color: #ffffff;

			svg {
				color: ${colors.mint};
			}
		}

		&:focus-visible {
			outline: 2px solid ${colors.mint};
			outline-offset: 1px;
		}
	}
`;

export const RailFooter = styled.div`
	margin-top: auto;
	padding-top: 16px;
	border-top: 1px solid ${colors.asphaltSoft};
`;

export const Main = styled.div`
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
`;

export const MobileBar = styled.header`
	display: none;
	align-items: center;
	gap: 8px;
	height: ${layout.topbarHeight}px;
	padding: 0 12px;
	background-color: ${colors.asphalt};
	color: #ffffff;
	position: sticky;
	top: 0;
	z-index: 10;

	@media (max-width: 899px) {
		display: flex;
	}
`;

export const Content = styled.main`
	width: 100%;
	max-width: ${layout.contentMaxWidth}px;
	margin: 0 auto;
	padding: 28px 32px 48px;

	@media (max-width: 899px) {
		padding: 20px 16px 40px;
	}
`;
