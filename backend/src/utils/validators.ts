import { z } from 'zod';

export const BRAZILIAN_PHONE_PATTERN = /^\(\d{2}\) \d{5}-\d{4}$/;

export const uuidParamSchema = z.object({
	id: z.string().uuid('Identificador inválido'),
});

export const booleanQuerySchema = z
	.enum(['true', 'false'], {
		errorMap: () => ({ message: 'Use true ou false' }),
	})
	.transform((value) => value === 'true');

export const isoDateSchema = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD')
	.refine((value) => {
		const date = new Date(`${value}T00:00:00Z`);
		return (
			!Number.isNaN(date.getTime()) &&
			date.toISOString().slice(0, 10) === value
		);
	}, 'Data inexistente');

export const phoneSchema = z
	.string({ required_error: 'O telefone é obrigatório' })
	.regex(BRAZILIAN_PHONE_PATTERN, 'Use o formato (XX) XXXXX-XXXX');

export const latitudeSchema = z
	.number({
		required_error: 'A latitude é obrigatória',
		invalid_type_error: 'A latitude deve ser um número',
	})
	.min(-90, 'A latitude deve estar entre -90 e 90')
	.max(90, 'A latitude deve estar entre -90 e 90');

export const longitudeSchema = z
	.number({
		required_error: 'A longitude é obrigatória',
		invalid_type_error: 'A longitude deve ser um número',
	})
	.min(-180, 'A longitude deve estar entre -180 e 180')
	.max(180, 'A longitude deve estar entre -180 e 180');

export function sortOrderSchema() {
	return z
		.enum(['asc', 'desc'], {
			errorMap: () => ({ message: 'Use asc ou desc' }),
		})
		.default('desc');
}
