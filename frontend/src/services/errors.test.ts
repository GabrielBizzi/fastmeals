import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';
import { getFieldErrors, getUserMessage } from './errors';

function responseError(status: number, data: unknown) {
	return new AxiosError(
		'Request failed',
		'ERR_BAD_RESPONSE',
		undefined,
		undefined,
		{
			status,
			statusText: '',
			headers: {},
			config: { headers: new AxiosHeaders() },
			data,
		},
	);
}

const FALLBACK = 'Não foi possível concluir a ação. Tente novamente.';

describe('getUserMessage', () => {
	it.each([
		[
			'PRODUCT_IN_USE',
			409,
			'Este produto está em pedidos pendentes ou em preparo',
		],
		['RATE_LIMIT_EXCEEDED', 429, 'Aguarde um minuto'],
		['FORBIDDEN', 403, 'Seu perfil não tem permissão'],
	])(
		'translates %s into an operator-facing message',
		(code, status, expected) => {
			const message = getUserMessage(
				responseError(status, { error: { code, message: 'internal' } }),
				FALLBACK,
			);

			expect(message).toContain(expected);
			expect(message).not.toContain('internal');
		},
	);

	it('never leaks unknown server messages or technical details', () => {
		const error = responseError(500, {
			error: {
				code: 'INTERNAL_ERROR',
				message: 'PrismaClientKnownRequestError: P2002',
			},
		});

		expect(getUserMessage(error, FALLBACK)).toBe(FALLBACK);
		expect(
			getUserMessage(
				new TypeError('Cannot read properties of undefined'),
				FALLBACK,
			),
		).toBe(FALLBACK);
		expect(
			getUserMessage(responseError(502, '<html>Bad gateway</html>'), FALLBACK),
		).toBe(FALLBACK);
	});

	it('explains connectivity problems', () => {
		const offline = new AxiosError('Network Error', 'ERR_NETWORK');

		expect(getUserMessage(offline, FALLBACK)).toContain(
			'Verifique sua conexão',
		);
	});

	it('names the unavailable products', () => {
		const error = responseError(422, {
			error: {
				code: 'UNAVAILABLE_PRODUCT',
				message: 'internal',
				details: [
					{
						productId: '1',
						productName: 'Pudim de Leite',
						reason: 'Produto indisponível',
					},
				],
			},
		});

		expect(getUserMessage(error, FALLBACK)).toBe(
			'Produtos indisponíveis no momento: Pudim de Leite.',
		);
	});
});

describe('getFieldErrors', () => {
	it('keeps the first message per field', () => {
		const error = responseError(400, {
			error: {
				code: 'VALIDATION_ERROR',
				message: 'Dados inválidos',
				details: [
					{ field: 'price', message: 'O preço deve ser maior que zero' },
					{ field: 'price', message: 'outra' },
					{
						field: 'name',
						message: 'O nome deve ter entre 3 e 120 caracteres',
					},
				],
			},
		});

		expect(getFieldErrors(error)).toEqual({
			price: 'O preço deve ser maior que zero',
			name: 'O nome deve ter entre 3 e 120 caracteres',
		});
	});
});
