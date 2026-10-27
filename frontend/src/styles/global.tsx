import { Global, css } from '@emotion/react';
import { colors } from './tokens';

export function GlobalStyles() {
	return (
		<Global
			styles={css`
				html,
				body,
				#root {
					height: 100%;
				}

				body {
					background-color: ${colors.plate};
					color: ${colors.text};
					-webkit-font-smoothing: antialiased;
				}

				:focus-visible {
					outline: 2px solid ${colors.focus};
					outline-offset: 2px;
				}

				.MuiButtonBase-root:focus-visible,
				.MuiInputBase-input:focus-visible {
					outline: none;
				}

				@media (prefers-reduced-motion: reduce) {
					*,
					*::before,
					*::after {
						animation-duration: 0.01ms !important;
						transition-duration: 0.01ms !important;
					}
				}
			`}
		/>
	);
}
