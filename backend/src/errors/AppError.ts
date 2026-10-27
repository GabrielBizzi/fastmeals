import { ERROR_STATUS, type ErrorCode } from './errorCodes';

export type FieldErrorDetail = {
	field: string;
	message: string;
};

export type ErrorDetail = FieldErrorDetail | Record<string, string>;

export class AppError extends Error {
	readonly statusCode: number;

	constructor(
		readonly code: ErrorCode,
		message: string,
		readonly details?: ErrorDetail[],
	) {
		super(message);
		this.name = 'AppError';
		this.statusCode = ERROR_STATUS[code];
	}
}
