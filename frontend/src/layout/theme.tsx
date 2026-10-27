import { CssBaseline, ThemeProvider, alpha, createTheme } from '@mui/material';
import type { PropsWithChildren } from 'react';
import { colors, fontFamily, radii } from '@/styles/tokens';

const focusRing = `0 0 0 3px ${alpha(colors.focus, 0.35)}`;

const raisedShadow = `0 8px 24px ${alpha(colors.asphalt, 0.14)}, 0 2px 6px ${alpha(colors.asphalt, 0.08)}`;

export const theme = createTheme({
	palette: {
		mode: 'light',
		primary: {
			main: colors.basil,
			dark: colors.basilDark,
			light: colors.mint,
			contrastText: '#FFFFFF',
		},
		secondary: { main: colors.route, contrastText: '#FFFFFF' },
		error: { main: colors.danger },
		warning: { main: colors.warning },
		success: { main: colors.basil },
		info: { main: colors.route },
		background: { default: colors.plate, paper: colors.surface },
		text: { primary: colors.text, secondary: colors.textMuted },
		divider: colors.line,
	},
	shape: { borderRadius: radii.md },
	typography: {
		fontFamily,
		fontSize: 14,
		htmlFontSize: 16,
		h1: {
			fontSize: '1.5rem',
			fontWeight: 600,
			lineHeight: 1.25,
			letterSpacing: '-0.01em',
		},
		h2: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.35 },
		h3: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
		subtitle1: { fontSize: '0.9375rem', fontWeight: 500 },
		subtitle2: {
			fontSize: '0.8125rem',
			fontWeight: 600,
			color: colors.textMuted,
		},
		body1: { fontSize: '0.9375rem', lineHeight: 1.5 },
		body2: { fontSize: '0.875rem', lineHeight: 1.45 },
		caption: { fontSize: '0.75rem', lineHeight: 1.4, color: colors.textSubtle },
		button: { textTransform: 'none', fontWeight: 500, letterSpacing: 0 },
		overline: { textTransform: 'none', letterSpacing: 0, fontWeight: 600 },
	},
	components: {
		MuiCssBaseline: {
			styleOverrides: {
				body: { fontVariantNumeric: 'tabular-nums' },
			},
		},
		MuiButtonBase: {
			defaultProps: { disableRipple: true },
		},
		MuiButton: {
			defaultProps: { disableElevation: true },
			styleOverrides: {
				root: {
					borderRadius: radii.md,
					padding: '7px 14px',
					minHeight: 36,
					transition:
						'background-color 120ms ease, border-color 120ms ease, color 120ms ease',
					'&.Mui-focusVisible': { boxShadow: focusRing },
				},
				sizeSmall: {
					padding: '4px 10px',
					minHeight: 30,
					fontSize: '0.8125rem',
				},
				outlined: {
					borderColor: colors.lineStrong,
					color: colors.text,
					'&:hover': {
						borderColor: colors.asphaltMuted,
						backgroundColor: colors.plate,
					},
				},
				text: { '&:hover': { backgroundColor: alpha(colors.basil, 0.08) } },
			},
		},
		MuiIconButton: {
			styleOverrides: {
				root: {
					borderRadius: radii.md,
					'&.Mui-focusVisible': { boxShadow: focusRing },
				},
			},
		},
		MuiPaper: {
			defaultProps: { elevation: 0 },
			styleOverrides: {
				outlined: { borderColor: colors.line },
				rounded: { borderRadius: radii.lg },
			},
		},
		MuiOutlinedInput: {
			styleOverrides: {
				root: {
					backgroundColor: colors.surface,
					borderRadius: radii.md,
					'& .MuiOutlinedInput-notchedOutline': {
						borderColor: colors.lineStrong,
					},
					'&:hover:not(.Mui-disabled) .MuiOutlinedInput-notchedOutline': {
						borderColor: colors.asphaltMuted,
					},
					'&.Mui-focused': { boxShadow: focusRing },
					'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
						borderColor: colors.focus,
						borderWidth: 1,
					},
				},
			},
		},
		MuiInputLabel: {
			styleOverrides: {
				root: {
					color: colors.textMuted,
					'&.Mui-focused': { color: colors.focus },
				},
			},
		},
		MuiFormHelperText: {
			styleOverrides: { root: { marginLeft: 2, marginTop: 4 } },
		},
		MuiTextField: {
			defaultProps: { size: 'small', fullWidth: true },
		},
		MuiSelect: {
			defaultProps: { size: 'small' },
		},
		MuiTableCell: {
			styleOverrides: {
				root: {
					borderBottom: `1px solid ${colors.line}`,
					padding: '10px 14px',
					fontSize: '0.875rem',
				},
				head: {
					backgroundColor: colors.plate,
					color: colors.textMuted,
					fontWeight: 600,
					fontSize: '0.8125rem',
					whiteSpace: 'nowrap',
				},
				sizeSmall: { padding: '7px 12px' },
			},
		},
		MuiTableRow: {
			styleOverrides: {
				root: {
					'&.MuiTableRow-hover:hover': {
						backgroundColor: alpha(colors.basil, 0.035),
					},
					'&:last-of-type td': { borderBottom: 0 },
				},
			},
		},
		MuiTablePagination: {
			styleOverrides: {
				root: { borderTop: `1px solid ${colors.line}` },
				toolbar: { minHeight: 48 },
				selectLabel: { fontSize: '0.8125rem', color: colors.textMuted },
				displayedRows: { fontSize: '0.8125rem', color: colors.textMuted },
			},
		},
		MuiChip: {
			styleOverrides: {
				root: { borderRadius: radii.sm, fontWeight: 500, height: 26 },
				sizeSmall: { height: 22, fontSize: '0.75rem' },
			},
		},
		MuiDialog: {
			styleOverrides: {
				paper: { borderRadius: radii.lg, boxShadow: raisedShadow },
			},
		},
		MuiDialogTitle: {
			styleOverrides: {
				root: {
					fontSize: '1.0625rem',
					fontWeight: 600,
					padding: '18px 24px 8px',
				},
			},
		},
		MuiDialogContent: {
			styleOverrides: { root: { padding: '8px 24px 16px' } },
		},
		MuiDialogActions: {
			styleOverrides: {
				root: {
					padding: '12px 24px 18px',
					gap: 8,
					borderTop: `1px solid ${colors.line}`,
				},
			},
		},
		MuiTooltip: {
			defaultProps: { arrow: true },
			styleOverrides: {
				tooltip: {
					backgroundColor: colors.asphalt,
					fontSize: '0.75rem',
					padding: '6px 10px',
					borderRadius: radii.sm,
				},
				arrow: { color: colors.asphalt },
			},
		},
		MuiSwitch: {
			styleOverrides: {
				root: { width: 40, height: 24, padding: 0 },
				switchBase: {
					padding: 3,
					'&.Mui-checked': {
						transform: 'translateX(16px)',
						color: '#FFFFFF',
						'& + .MuiSwitch-track': {
							backgroundColor: colors.basil,
							opacity: 1,
						},
					},
					'&.Mui-focusVisible + .MuiSwitch-track': { boxShadow: focusRing },
				},
				thumb: { width: 18, height: 18, boxShadow: 'none' },
				track: {
					borderRadius: 12,
					backgroundColor: colors.lineStrong,
					opacity: 1,
				},
			},
		},
		MuiAlert: {
			styleOverrides: {
				root: { borderRadius: radii.md, alignItems: 'center' },
				standardError: {
					backgroundColor: colors.dangerTint,
					color: colors.danger,
				},
				standardInfo: {
					backgroundColor: colors.routeTint,
					color: colors.route,
				},
			},
		},
		MuiSkeleton: {
			defaultProps: { animation: 'wave' },
			styleOverrides: {
				root: { backgroundColor: alpha(colors.asphalt, 0.07) },
			},
		},
		MuiToggleButton: {
			styleOverrides: {
				root: {
					textTransform: 'none',
					padding: '5px 12px',
					color: colors.textMuted,
					borderColor: colors.lineStrong,
					'&.Mui-selected': {
						backgroundColor: colors.asphalt,
						color: '#FFFFFF',
						'&:hover': { backgroundColor: colors.asphaltSoft },
					},
				},
			},
		},
		MuiMenu: {
			styleOverrides: {
				paper: { border: `1px solid ${colors.line}`, boxShadow: raisedShadow },
			},
		},
		MuiLink: {
			defaultProps: { underline: 'hover' },
		},
	},
});

export default function Theme({ children }: PropsWithChildren) {
	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			{children}
		</ThemeProvider>
	);
}
