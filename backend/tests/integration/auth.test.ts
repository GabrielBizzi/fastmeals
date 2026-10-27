import { UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { env } from '../../src/config/env';
import { useTestDatabase } from '../helpers/database';
import { createUser, TEST_PASSWORD } from '../helpers/factories';
import { api, authHeaderFor } from '../helpers/http';

useTestDatabase();

function extractRefreshCookie(setCookie: string | string[] | undefined) {
	const cookies = Array.isArray(setCookie) ? setCookie : [setCookie ?? ''];
	return cookies.find((cookie) => cookie.startsWith('fm_refresh_token='));
}

describe('POST /api/auth/login', () => {
	it('returns tokens, the user and an httpOnly refresh cookie for valid credentials', async () => {
		const user = await createUser(UserRole.admin);

		const response = await api()
			.post('/api/auth/login')
			.send({ email: user.email.toUpperCase(), password: TEST_PASSWORD });

		expect(response.status).toBe(200);
		expect(response.body).toMatchObject({
			accessToken: expect.any(String),
			refreshToken: expect.any(String),
			user: { id: user.id, email: user.email, role: 'admin' },
		});
		const cookie = extractRefreshCookie(response.headers['set-cookie']);
		expect(cookie).toContain('HttpOnly');
		expect(cookie).toContain('SameSite=Strict');

		const decoded = jwt.decode(response.body.accessToken, { json: true });
		expect((decoded?.exp ?? 0) - (decoded?.iat ?? 0)).toBe(15 * 60);
	});

	it.each([
		['wrong password', (email: string) => ({ email, password: 'errada' })],
		['unknown email', () => ({ email: 'ninguem@fastmeals.test', password: TEST_PASSWORD })],
	])('rejects %s with INVALID_CREDENTIALS', async (_, buildBody) => {
		const user = await createUser();

		const response = await api().post('/api/auth/login').send(buildBody(user.email));

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
	});

	it('validates the payload before touching credentials', async () => {
		const response = await api()
			.post('/api/auth/login')
			.send({ email: 'nao-e-email' });

		expect(response.status).toBe(400);
		expect(response.body.error.code).toBe('VALIDATION_ERROR');
		expect(response.body.error.details).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ field: 'email' }),
				expect.objectContaining({ field: 'password' }),
			]),
		);
	});
});

describe('protected routes', () => {
	it('accepts a valid access token', async () => {
		const { header } = await authHeaderFor(UserRole.viewer);

		const response = await api().get('/api/products').set(header);

		expect(response.status).toBe(200);
	});

	it.each([
		['missing header', {}],
		['malformed token', { Authorization: 'Bearer nao-e-um-jwt' }],
		[
			'token signed with another secret',
			{ Authorization: `Bearer ${jwt.sign({ role: 'admin', type: 'access' }, 'outra-chave-secreta-qualquer', { subject: '00000000-0000-4000-8000-000000000000' })}` },
		],
	])('returns 401 INVALID_TOKEN for %s', async (_, header) => {
		const response = await api().get('/api/products').set(header);

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe('INVALID_TOKEN');
	});

	it('returns 401 TOKEN_EXPIRED for an expired access token', async () => {
		const user = await createUser();
		const expired = jwt.sign(
			{ role: user.role, type: 'access', exp: Math.floor(Date.now() / 1000) - 10 },
			env.JWT_SECRET,
			{ subject: user.id },
		);

		const response = await api()
			.get('/api/products')
			.set({ Authorization: `Bearer ${expired}` });

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe('TOKEN_EXPIRED');
	});

	it('rejects a refresh token used as an access token', async () => {
		const user = await createUser();
		const login = await api()
			.post('/api/auth/login')
			.send({ email: user.email, password: TEST_PASSWORD });

		const response = await api()
			.get('/api/products')
			.set({ Authorization: `Bearer ${login.body.refreshToken}` });

		expect(response.status).toBe(401);
	});

	it('returns 403 FORBIDDEN when a viewer tries to write', async () => {
		const { header } = await authHeaderFor(UserRole.viewer);

		const response = await api().post('/api/products').set(header).send({});

		expect(response.status).toBe(403);
		expect(response.body.error.code).toBe('FORBIDDEN');
	});
});

describe('POST /api/auth/refresh', () => {
	async function login() {
		const user = await createUser();
		return api()
			.post('/api/auth/login')
			.send({ email: user.email, password: TEST_PASSWORD });
	}

	it('rotates the refresh token and rejects reuse of the previous one', async () => {
		const session = await login();

		const rotated = await api()
			.post('/api/auth/refresh')
			.send({ refreshToken: session.body.refreshToken });
		expect(rotated.status).toBe(200);
		expect(rotated.body.refreshToken).not.toBe(session.body.refreshToken);

		const reused = await api()
			.post('/api/auth/refresh')
			.send({ refreshToken: session.body.refreshToken });
		expect(reused.status).toBe(401);
		expect(reused.body.error.code).toBe('INVALID_REFRESH_TOKEN');

		const familyRevoked = await api()
			.post('/api/auth/refresh')
			.send({ refreshToken: rotated.body.refreshToken });
		expect(familyRevoked.status).toBe(401);
	});

	it('refreshes from the httpOnly cookie without exposing the new refresh token in the body', async () => {
		const session = await login();
		const cookie = extractRefreshCookie(session.headers['set-cookie']) ?? '';

		const response = await api()
			.post('/api/auth/refresh')
			.set('Cookie', cookie.split(';')[0]);

		expect(response.status).toBe(200);
		expect(response.body.accessToken).toEqual(expect.any(String));
		expect(response.body.refreshToken).toBeUndefined();
		expect(extractRefreshCookie(response.headers['set-cookie'])).toBeDefined();
	});

	it('revokes the refresh token on logout', async () => {
		const session = await login();

		const logout = await api()
			.post('/api/auth/logout')
			.send({ refreshToken: session.body.refreshToken });
		expect(logout.status).toBe(204);

		const response = await api()
			.post('/api/auth/refresh')
			.send({ refreshToken: session.body.refreshToken });
		expect(response.status).toBe(401);
	});
});

describe('rate limiting', () => {
	it('returns 429 RATE_LIMIT_EXCEEDED after the per-minute budget is spent', async () => {
		const limitedApp = createApp({ rateLimitPerMinute: 3 });

		for (let attempt = 0; attempt < 3; attempt++) {
			await request(limitedApp).get('/api/products');
		}
		const response = await request(limitedApp).get('/api/products');

		expect(response.status).toBe(429);
		expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
	});
});
