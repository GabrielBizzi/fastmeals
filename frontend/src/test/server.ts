import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const anonymousSession = http.post('*/api/auth/refresh', () =>
	HttpResponse.json(
		{ error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token inválido ou expirado' } },
		{ status: 401 },
	),
);

export const server = setupServer(anonymousSession);
