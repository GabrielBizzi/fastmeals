import { UserRole } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../../config/env';
import { AppError } from '../../errors/AppError';
import { durationToSeconds } from '../../utils/duration';

export const ACCESS_TOKEN_TTL_SECONDS = durationToSeconds(env.JWT_EXPIRES_IN);
export const REFRESH_TOKEN_TTL_SECONDS = durationToSeconds(
	env.JWT_REFRESH_EXPIRES_IN,
);

const accessPayloadSchema = z.object({
	sub: z.string().uuid(),
	role: z.nativeEnum(UserRole),
	type: z.literal('access'),
});

const refreshPayloadSchema = z.object({
	sub: z.string().uuid(),
	jti: z.string().uuid(),
	type: z.literal('refresh'),
});

export type AccessTokenPayload = z.infer<typeof accessPayloadSchema>;
export type RefreshTokenPayload = z.infer<typeof refreshPayloadSchema>;

export function signAccessToken(userId: string, role: UserRole): string {
	return jwt.sign({ role, type: 'access' }, env.JWT_SECRET, {
		subject: userId,
		expiresIn: ACCESS_TOKEN_TTL_SECONDS,
		algorithm: 'HS256',
	});
}

export function signRefreshToken(userId: string) {
	const tokenId = randomUUID();
	const token = jwt.sign({ type: 'refresh' }, env.JWT_REFRESH_SECRET, {
		subject: userId,
		jwtid: tokenId,
		expiresIn: REFRESH_TOKEN_TTL_SECONDS,
		algorithm: 'HS256',
	});
	const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);
	return { token, tokenId, expiresAt };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
	let decoded: unknown;
	try {
		decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
	} catch (error) {
		if (error instanceof jwt.TokenExpiredError) {
			throw new AppError('TOKEN_EXPIRED', 'Token de acesso expirado');
		}
		throw new AppError('INVALID_TOKEN', 'Token de acesso inválido');
	}

	const payload = accessPayloadSchema.safeParse(decoded);
	if (!payload.success) {
		throw new AppError('INVALID_TOKEN', 'Token de acesso inválido');
	}
	return payload.data;
}

export function invalidRefreshToken() {
	return new AppError(
		'INVALID_REFRESH_TOKEN',
		'Refresh token inválido ou expirado',
	);
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
	let decoded: unknown;
	try {
		decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
			algorithms: ['HS256'],
		});
	} catch {
		throw invalidRefreshToken();
	}

	const payload = refreshPayloadSchema.safeParse(decoded);
	if (!payload.success) {
		throw invalidRefreshToken();
	}
	return payload.data;
}
