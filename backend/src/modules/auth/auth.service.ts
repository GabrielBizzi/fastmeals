import type { User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AppError } from '../../errors/AppError';
import { prisma } from '../../lib/prisma';
import type { LoginInput } from './auth.schemas';
import {
	invalidRefreshToken,
	signAccessToken,
	signRefreshToken,
	verifyRefreshToken,
} from './token.service';

export const PASSWORD_SALT_ROUNDS = 12;

const TIMING_SAFE_PLACEHOLDER_HASH =
	'$2a$12$l4joHlwCYekoIch2.0qK4O/ZprFKTpK4dt927j8OaFyRjjbVzjrMG';

export type SessionUser = Pick<User, 'id' | 'email' | 'role'>;

export type IssuedTokens = {
	accessToken: string;
	refreshToken: string;
	refreshTokenExpiresAt: Date;
};

function toSessionUser(user: User): SessionUser {
	return { id: user.id, email: user.email, role: user.role };
}

export function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

async function issueTokens(user: SessionUser): Promise<IssuedTokens> {
	const refresh = signRefreshToken(user.id);
	await prisma.refreshToken.create({
		data: {
			id: refresh.tokenId,
			userId: user.id,
			expiresAt: refresh.expiresAt,
		},
	});
	return {
		accessToken: signAccessToken(user.id, user.role),
		refreshToken: refresh.token,
		refreshTokenExpiresAt: refresh.expiresAt,
	};
}

export async function login({ email, password }: LoginInput) {
	const user = await prisma.user.findUnique({ where: { email } });
	const passwordMatches = await bcrypt.compare(
		password,
		user?.passwordHash ?? TIMING_SAFE_PLACEHOLDER_HASH,
	);

	if (!user || !passwordMatches) {
		throw new AppError('INVALID_CREDENTIALS', 'E-mail ou senha inválidos');
	}

	const sessionUser = toSessionUser(user);
	const tokens = await issueTokens(sessionUser);
	return { ...tokens, user: sessionUser };
}

export async function rotateRefreshToken(token: string): Promise<IssuedTokens> {
	const payload = verifyRefreshToken(token);
	const stored = await prisma.refreshToken.findUnique({
		where: { id: payload.jti },
		include: { user: true },
	});

	if (!stored || stored.userId !== payload.sub) {
		throw invalidRefreshToken();
	}

	if (stored.revokedAt) {
		await prisma.refreshToken.updateMany({
			where: { userId: stored.userId, revokedAt: null },
			data: { revokedAt: new Date() },
		});
		throw invalidRefreshToken();
	}

	if (stored.expiresAt.getTime() <= Date.now()) {
		throw invalidRefreshToken();
	}

	const { count } = await prisma.refreshToken.updateMany({
		where: { id: stored.id, revokedAt: null },
		data: { revokedAt: new Date() },
	});
	if (count === 0) {
		throw invalidRefreshToken();
	}

	return issueTokens(toSessionUser(stored.user));
}

export async function revokeRefreshToken(token: string): Promise<void> {
	let tokenId: string;
	try {
		tokenId = verifyRefreshToken(token).jti;
	} catch {
		return;
	}
	await prisma.refreshToken.updateMany({
		where: { id: tokenId, revokedAt: null },
		data: { revokedAt: new Date() },
	});
}

export async function getSessionUser(userId: string): Promise<SessionUser> {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) {
		throw new AppError('INVALID_TOKEN', 'Token de acesso inválido');
	}
	return toSessionUser(user);
}
