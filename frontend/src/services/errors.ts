import { AxiosError } from 'axios';
import { z } from 'zod';

const apiErrorBodySchema = z.object({
	error: z.object({
		code: z.string(),
		message: z.string(),
		details: z.array(z.record(z.unknown())).optional(),
	}),
});

export type ApiErrorCode =
	| 'VALIDATION_ERROR'
	| 'INVALID_CREDENTIALS'
	| 'TOKEN_EXPIRED'
	| 'INVALID_TOKEN'
	| 'INVALID_REFRESH_TOKEN'
	| 'FORBIDDEN'
	| 'NOT_FOUND'
	| 'PRODUCT_NOT_FOUND'
	| 'ORDER_NOT_FOUND'
	| 'DELIVERY_PERSON_NOT_FOUND'
	| 'PRODUCT_IN_USE'
	| 'DELIVERY_PERSON_IN_USE'
	| 'INVALID_STATUS_TRANSITION'
	| 'UNAVAILABLE_PRODUCT'
	| 'DELIVERY_PERSON_UNAVAILABLE'
	| 'ORDER_NOT_ASSIGNABLE'
	| 'RATE_LIMIT_EXCEEDED'
	| 'INTERNAL_ERROR';

export type ApiFailure =
	| {
			kind: 'response';
			status: number;
			code: string;
			fieldErrors: Record<string, string>;
			details: Record<string, unknown>[];
	  }
	| { kind: 'network' }
	| { kind: 'unexpected' };

const USER_MESSAGES: Partial<Record<ApiErrorCode, string>> = {
	VALIDATION_ERROR: 'Revise os campos destacados e tente novamente.',
	INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
	TOKEN_EXPIRED: 'Sua sessão expirou. Entre novamente para continuar.',
	INVALID_TOKEN: 'Sua sessão expirou. Entre novamente para continuar.',
	INVALID_REFRESH_TOKEN: 'Sua sessão expirou. Entre novamente para continuar.',
	FORBIDDEN: 'Seu perfil não tem permissão para esta ação.',
	PRODUCT_NOT_FOUND: 'Este produto não existe mais. Atualize a lista.',
	ORDER_NOT_FOUND: 'Este pedido não foi encontrado. Atualize a lista.',
	DELIVERY_PERSON_NOT_FOUND:
		'Este entregador não existe mais. Atualize a lista.',
	PRODUCT_IN_USE:
		'Este produto está em pedidos pendentes ou em preparo. Conclua ou cancele esses pedidos antes de excluí-lo.',
	DELIVERY_PERSON_IN_USE:
		'Este entregador está com uma entrega em andamento. Aguarde a conclusão para continuar.',
	INVALID_STATUS_TRANSITION:
		'O status deste pedido não permite essa mudança. Atualize a lista e tente novamente.',
	UNAVAILABLE_PRODUCT: 'Um ou mais produtos do pedido estão indisponíveis.',
	DELIVERY_PERSON_UNAVAILABLE:
		'Este entregador não está disponível. Escolha outro entregador.',
	ORDER_NOT_ASSIGNABLE: 'Este pedido não aceita mais atribuição de entregador.',
	RATE_LIMIT_EXCEEDED:
		'Muitas ações em sequência. Aguarde um minuto e tente novamente.',
};

const NETWORK_MESSAGE =
	'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';

function isKnownCode(code: string): code is ApiErrorCode {
	return code in USER_MESSAGES;
}

function collectFieldErrors(details: Record<string, unknown>[] | undefined) {
	const fieldErrors: Record<string, string> = {};
	for (const detail of details ?? []) {
		const { field, message } = detail;
		if (
			typeof field === 'string' &&
			typeof message === 'string' &&
			!fieldErrors[field]
		) {
			fieldErrors[field] = message;
		}
	}
	return fieldErrors;
}

export function toApiFailure(error: unknown): ApiFailure {
	if (!(error instanceof AxiosError)) return { kind: 'unexpected' };
	if (!error.response) return { kind: 'network' };

	const body = apiErrorBodySchema.safeParse(error.response.data);
	if (!body.success) {
		return {
			kind: 'response',
			status: error.response.status,
			code: 'INTERNAL_ERROR',
			fieldErrors: {},
			details: [],
		};
	}

	return {
		kind: 'response',
		status: error.response.status,
		code: body.data.error.code,
		fieldErrors: collectFieldErrors(body.data.error.details),
		details: body.data.error.details ?? [],
	};
}

export function getErrorCode(error: unknown): string | null {
	const failure = toApiFailure(error);
	return failure.kind === 'response' ? failure.code : null;
}

export function getUserMessage(error: unknown, fallback: string): string {
	const failure = toApiFailure(error);
	if (failure.kind === 'network') return NETWORK_MESSAGE;
	if (failure.kind !== 'response') return fallback;

	if (failure.code === 'UNAVAILABLE_PRODUCT') {
		const names = failure.details
			.map((detail) => detail.productName)
			.filter(
				(name): name is string => typeof name === 'string' && name.length > 0,
			);
		if (names.length > 0) {
			return `Produtos indisponíveis no momento: ${names.join(', ')}.`;
		}
	}

	return isKnownCode(failure.code)
		? (USER_MESSAGES[failure.code] ?? fallback)
		: fallback;
}

export function getFieldErrors(error: unknown): Record<string, string> {
	const failure = toApiFailure(error);
	return failure.kind === 'response' ? failure.fieldErrors : {};
}
