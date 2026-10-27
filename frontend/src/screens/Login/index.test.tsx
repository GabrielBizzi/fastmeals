import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '@/App';
import { useAuthStore } from '@/stores/auth';
import { buildOrder, EMPTY_STATUS_COUNTS } from '@/test/fixtures';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';

const ADMIN = { id: 'user-1', email: 'admin@fastmeals.com', role: 'admin' };

function ordersPanel() {
	return [
		http.get('*/api/orders', ({ request }) => {
			if (request.headers.get('Authorization') !== 'Bearer access-token') {
				return HttpResponse.json({ error: { code: 'INVALID_TOKEN', message: '' } }, { status: 401 });
			}
			return HttpResponse.json({
				data: [buildOrder()],
				pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
			});
		}),
		http.get('*/api/reports/orders-by-status', () => HttpResponse.json(EMPTY_STATUS_COUNTS)),
	];
}

describe('login flow', () => {
	beforeEach(() => {
		server.use(...ordersPanel());
	});

	it('redirects anonymous visitors to the login screen', async () => {
		renderWithProviders(<App />, { route: '/orders' });

		expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
	});

	it('validates the form before calling the API', async () => {
		const user = userEvent.setup();
		renderWithProviders(<App />, { route: '/login' });

		await user.click(await screen.findByRole('button', { name: 'Entrar' }));

		expect(await screen.findByText('Informe seu e-mail')).toBeInTheDocument();
		expect(screen.getByText('Informe sua senha')).toBeInTheDocument();
	});

	it('shows a clear message for wrong credentials', async () => {
		const user = userEvent.setup();
		server.use(
			http.post('*/api/auth/login', () =>
				HttpResponse.json(
					{ error: { code: 'INVALID_CREDENTIALS', message: 'E-mail ou senha inválidos' } },
					{ status: 401 },
				),
			),
		);
		renderWithProviders(<App />, { route: '/login' });

		await user.type(await screen.findByLabelText('E-mail'), 'admin@fastmeals.com');
		await user.type(screen.getByLabelText('Senha'), 'errada');
		await user.click(screen.getByRole('button', { name: 'Entrar' }));

		expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.');
		expect(screen.getByLabelText('Senha')).toHaveValue('');
	});

	it('signs in, keeps the access token only in memory and opens the orders panel', async () => {
		const user = userEvent.setup();
		server.use(
			http.post('*/api/auth/login', async ({ request }) => {
				const body = await request.json();
				expect(body).toEqual({ email: 'admin@fastmeals.com', password: 'Admin@123' });
				return HttpResponse.json({
					accessToken: 'access-token',
					refreshToken: 'refresh-token',
					user: ADMIN,
				});
			}),
		);
		renderWithProviders(<App />, { route: '/orders' });

		await user.type(await screen.findByLabelText('E-mail'), 'admin@fastmeals.com');
		await user.type(screen.getByLabelText('Senha'), 'Admin@123');
		await user.click(screen.getByRole('button', { name: 'Entrar' }));

		expect(await screen.findByRole('heading', { name: 'Pedidos' })).toBeInTheDocument();
		expect(await screen.findByRole('button', { name: 'Joao Silva' })).toBeInTheDocument();
		expect(useAuthStore.getState().accessToken).toBe('access-token');
		expect(JSON.stringify(useAuthStore.getState())).not.toContain('refresh-token');
		expect(document.cookie).not.toContain('token');
	});

	it('refreshes an expired access token once and retries the request', async () => {
		let refreshCalls = 0;
		server.use(
			http.post('*/api/auth/refresh', () => {
				refreshCalls += 1;
				return HttpResponse.json({ accessToken: 'access-token' });
			}),
			http.get('*/api/auth/me', () => HttpResponse.json({ user: ADMIN })),
		);
		useAuthStore.setState({ status: 'authenticated', accessToken: 'stale-token', user: { ...ADMIN, role: 'admin' } });

		renderWithProviders(<App />, { route: '/orders' });

		expect(await screen.findByRole('button', { name: 'Joao Silva' })).toBeInTheDocument();
		expect(refreshCalls).toBe(1);
	});

	it('returns to the login screen with a notice when the session cannot be renewed', async () => {
		useAuthStore.setState({ status: 'authenticated', accessToken: 'stale-token', user: { ...ADMIN, role: 'admin' } });

		renderWithProviders(<App />, { route: '/orders' });

		await waitFor(() =>
			expect(screen.getByText('Sua sessão expirou. Entre novamente para continuar.')).toBeInTheDocument(),
		);
		expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
	});
});
