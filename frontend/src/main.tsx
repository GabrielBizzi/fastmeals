import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import 'dayjs/locale/pt-br';
import dayjs from 'dayjs';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppProviders } from './providers';

dayjs.locale('pt-br');

const container = document.getElementById('root');
if (container) {
	createRoot(container).render(
		<StrictMode>
			<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
				<AppProviders>
					<App />
				</AppProviders>
			</BrowserRouter>
		</StrictMode>,
	);
}
