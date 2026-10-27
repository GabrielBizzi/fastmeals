import styled from '@emotion/styled';
import { colors, radii, statusColors } from '@/styles/tokens';

export const Vehicle = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 6px;

	svg {
		color: ${colors.textMuted};
	}
`;

type AvailabilityTone = 'free' | 'busy' | 'inactive';

const TONES: Record<AvailabilityTone, { fg: string; bg: string }> = {
	free: { fg: statusColors.delivered.fg, bg: statusColors.delivered.bg },
	busy: { fg: statusColors.delivering.fg, bg: statusColors.delivering.bg },
	inactive: { fg: statusColors.pending.fg, bg: statusColors.pending.bg },
};

export const Availability = styled('span', {
	shouldForwardProp: (prop) => prop !== 'tone',
})<{ tone: AvailabilityTone }>`
	display: inline-block;
	padding: 2px 8px;
	border-radius: ${radii.sm}px;
	font-size: 0.8125rem;
	font-weight: 500;
	color: ${({ tone }) => TONES[tone].fg};
	background-color: ${({ tone }) => TONES[tone].bg};
`;
