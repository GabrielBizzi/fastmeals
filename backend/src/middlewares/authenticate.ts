import { UserRole } from '@prisma/client';
import type { Request, RequestHandler } from 'express';
import { AppError } from '../errors/AppError';
import { verifyAccessToken } from '../modules/auth/token.service';

export const authenticate: RequestHandler = (req, _res, next) => {
	const header = req.headers.authorization;
	const [scheme, token] = header?.split(' ') ?? [];

	if (scheme !== 'Bearer' || !token) {
		throw new AppError('INVALID_TOKEN', 'Token de acesso ausente ou inválido');
	}

	const payload = verifyAccessToken(token);
	req.auth = { userId: payload.sub, role: payload.role };
	next();
};

export function authorize(...roles: UserRole[]): RequestHandler {
	return (req, _res, next) => {
		if (!req.auth || !roles.includes(req.auth.role)) {
			throw new AppError(
				'FORBIDDEN',
				'Você não tem permissão para realizar esta ação',
			);
		}
		next();
	};
}

export const requireAdmin = authorize(UserRole.admin);

export function getAuth(req: Request): NonNullable<Request['auth']> {
	if (!req.auth) {
		throw new AppError('INVALID_TOKEN', 'Token de acesso ausente ou inválido');
	}
	return req.auth;
}
