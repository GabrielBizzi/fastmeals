import { Prisma } from '@prisma/client';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, type FieldErrorDetail } from '../errors/AppError';

type ErrorBody = {
	error: {
		code: string;
		message: string;
		details?: AppError['details'];
	};
};

function toFieldErrors(error: ZodError): FieldErrorDetail[] {
	return error.issues.map((issue) => ({
		field: issue.path.join('.') || 'body',
		message: issue.message,
	}));
}

function isMalformedJson(error: unknown): boolean {
	return (
		error instanceof SyntaxError &&
		'type' in error &&
		error.type === 'entity.parse.failed'
	);
}

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
	next(new AppError('NOT_FOUND', 'Recurso não encontrado'));
};

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
	let appError: AppError;

	if (error instanceof AppError) {
		appError = error;
	} else if (error instanceof ZodError) {
		appError = new AppError(
			'VALIDATION_ERROR',
			'Dados inválidos',
			toFieldErrors(error),
		);
	} else if (isMalformedJson(error)) {
		appError = new AppError(
			'VALIDATION_ERROR',
			'O corpo da requisição não é um JSON válido',
		);
	} else {
		const context =
			error instanceof Prisma.PrismaClientKnownRequestError
				? { prismaCode: error.code, meta: error.meta }
				: {};
		req.log.error({ err: error, ...context }, 'Unhandled request error');
		appError = new AppError(
			'INTERNAL_ERROR',
			'Ocorreu um erro inesperado. Tente novamente mais tarde.',
		);
	}

	const body: ErrorBody = {
		error: {
			code: appError.code,
			message: appError.message,
			...(appError.details ? { details: appError.details } : {}),
		},
	};

	res.status(appError.statusCode).json(body);
};
