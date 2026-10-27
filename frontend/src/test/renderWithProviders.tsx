import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '@/providers';

export function renderWithProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
	return render(
		<MemoryRouter
			initialEntries={[route]}
			future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
		>
			<AppProviders>{ui}</AppProviders>
		</MemoryRouter>,
	);
}
