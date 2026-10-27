import styled from '@emotion/styled';
import { ptBR } from '@mui/x-date-pickers/locales';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MaterialDesignContent, SnackbarProvider } from 'notistack';
import type { PropsWithChildren } from 'react';
import { AuthProvider } from '@/context/auth.context';
import Theme from '@/layout/theme';
import { GlobalStyles } from '@/styles/global';
import { colors, fontFamily, radii } from '@/styles/tokens';

const Snackbar = styled(MaterialDesignContent)`
	font-family: ${fontFamily};
	font-size: 0.875rem;
	border-radius: ${radii.md}px;
	box-shadow: 0 8px 24px rgba(27, 36, 48, 0.18);

	&.notistack-MuiContent-success {
		background-color: ${colors.asphalt};
	}

	&.notistack-MuiContent-error {
		background-color: ${colors.danger};
	}

	&.notistack-MuiContent-info {
		background-color: ${colors.route};
	}
`;

export function AppProviders({ children }: PropsWithChildren) {
	return (
		<Theme>
			<GlobalStyles />
			<LocalizationProvider
				dateAdapter={AdapterDayjs}
				adapterLocale="pt-br"
				localeText={
					ptBR.components.MuiLocalizationProvider.defaultProps.localeText
				}
			>
				<SnackbarProvider
					maxSnack={3}
					autoHideDuration={4000}
					anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
					Components={{ success: Snackbar, error: Snackbar, info: Snackbar }}
				>
					<AuthProvider>{children}</AuthProvider>
				</SnackbarProvider>
			</LocalizationProvider>
		</Theme>
	);
}
