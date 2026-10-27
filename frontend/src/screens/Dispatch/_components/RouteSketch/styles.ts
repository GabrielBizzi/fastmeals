import styled from '@emotion/styled';
import { colors, radii } from '@/styles/tokens';

export const Sketch = styled.figure`
	margin: 0;

	svg {
		display: block;
		width: 100%;
		height: auto;
		border-radius: ${radii.md}px;
		background-color: ${colors.plate};
		background-image: linear-gradient(${colors.line} 1px, transparent 1px),
			linear-gradient(90deg, ${colors.line} 1px, transparent 1px);
		background-size: 40px 40px;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 6px 16px;
		margin: 10px 0 0;
		padding: 0;
		list-style: none;
		font-size: 0.75rem;
		color: ${colors.textMuted};
	}

	.legend li {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.order {
		width: 10px;
		height: 10px;
		border: 2px solid ${colors.asphalt};
		border-radius: 2px;
	}

	.courier {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background-color: ${colors.basil};
	}

	.link {
		width: 18px;
		border-top: 2px dashed ${colors.route};
	}
`;
