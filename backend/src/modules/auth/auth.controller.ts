import type { CookieOptions, Request, Response } from 'express';
import { env } from '../../config/env';
import { getAuth } from '../../middlewares/authenticate';
import { loginSchema, refreshSchema } from './auth.schemas';
import * as authService from './auth.service';
import { invalidRefreshToken } from './token.service';

export const REFRESH_COOKIE_NAME = 'fm_refresh_token';

const refreshCookieOptions: CookieOptions = {
	httpOnly: true,
	sameSite: 'strict',
	secure: env.COOKIE_SECURE ?? env.NODE_ENV === 'production',
	path: '/api/auth',
};

function setRefreshCookie(res: Response, token: string, expiresAt: Date) {
	res.cookie(REFRESH_COOKIE_NAME, token, {
		...refreshCookieOptions,
		expires: expiresAt,
	});
}

function readCookieToken(req: Request): string | undefined {
	const cookies: Record<string, unknown> = req.cookies ?? {};
	const value = cookies[REFRESH_COOKIE_NAME];
	return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export async function login(req: Request, res: Response) {
	const input = loginSchema.parse(req.body);
	const session = await authService.login(input);

	setRefreshCookie(res, session.refreshToken, session.refreshTokenExpiresAt);
	res.status(200).json({
		accessToken: session.accessToken,
		refreshToken: session.refreshToken,
		user: session.user,
	});
}

export async function refresh(req: Request, res: Response) {
	const { refreshToken: bodyToken } = refreshSchema.parse(req.body ?? {});
	const token = bodyToken ?? readCookieToken(req);

	if (!token) {
		throw invalidRefreshToken();
	}

	const tokens = await authService.rotateRefreshToken(token);

	if (bodyToken) {
		res.status(200).json({
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
		});
		return;
	}

	setRefreshCookie(res, tokens.refreshToken, tokens.refreshTokenExpiresAt);
	res.status(200).json({ accessToken: tokens.accessToken });
}

export async function logout(req: Request, res: Response) {
	const { refreshToken: bodyToken } = refreshSchema.parse(req.body ?? {});
	const token = bodyToken ?? readCookieToken(req);

	if (token) {
		await authService.revokeRefreshToken(token);
	}

	res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
	res.status(204).send();
}

export async function me(req: Request, res: Response) {
	const user = await authService.getSessionUser(getAuth(req).userId);
	res.status(200).json({ user });
}
