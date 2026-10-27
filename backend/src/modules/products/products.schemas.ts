import { ProductCategory } from '@prisma/client';
import { z } from 'zod';
import { paginationQuerySchema } from '../../utils/pagination';
import { booleanQuerySchema, sortOrderSchema } from '../../utils/validators';

const MAX_PRICE = 99_999_999.99;

function hasAtMostTwoDecimals(value: number): boolean {
	return Math.abs(Math.round(value * 100) - value * 100) < 1e-6;
}

const productFields = {
	name: z
		.string({ required_error: 'O nome é obrigatório' })
		.trim()
		.min(3, 'O nome deve ter entre 3 e 120 caracteres')
		.max(120, 'O nome deve ter entre 3 e 120 caracteres'),
	description: z
		.string({ required_error: 'A descrição é obrigatória' })
		.trim()
		.min(10, 'A descrição deve ter entre 10 e 500 caracteres')
		.max(500, 'A descrição deve ter entre 10 e 500 caracteres'),
	price: z
		.number({
			required_error: 'O preço é obrigatório',
			invalid_type_error: 'O preço deve ser um número',
		})
		.positive('O preço deve ser maior que zero')
		.max(MAX_PRICE, 'O preço informado é muito alto')
		.refine(hasAtMostTwoDecimals, 'O preço deve ter no máximo 2 casas decimais'),
	category: z.nativeEnum(ProductCategory, {
		errorMap: () => ({
			message: 'A categoria deve ser meal, drink, dessert ou side',
		}),
	}),
	imageUrl: z
		.string()
		.trim()
		.max(500, 'A URL da imagem deve ter no máximo 500 caracteres')
		.url('Informe uma URL válida')
		.refine(
			(value) => /^https?:\/\//i.test(value),
			'A URL da imagem deve começar com http:// ou https://',
		)
		.nullable()
		.optional(),
	isAvailable: z.boolean({
		invalid_type_error: 'A disponibilidade deve ser verdadeiro ou falso',
	}),
	preparationTime: z
		.number({
			required_error: 'O tempo de preparo é obrigatório',
			invalid_type_error: 'O tempo de preparo deve ser um número',
		})
		.int('O tempo de preparo deve ser um número inteiro de minutos')
		.min(1, 'O tempo de preparo deve estar entre 1 e 120 minutos')
		.max(120, 'O tempo de preparo deve estar entre 1 e 120 minutos'),
};

export const createProductSchema = z.object({
	...productFields,
	isAvailable: productFields.isAvailable.default(true),
});

export const updateProductSchema = z
	.object(productFields)
	.partial()
	.refine((value) => Object.keys(value).length > 0, {
		message: 'Informe ao menos um campo para atualizar',
	});

export const listProductsQuerySchema = paginationQuerySchema.extend({
	search: z.string().trim().max(120).optional(),
	category: z
		.nativeEnum(ProductCategory, {
			errorMap: () => ({ message: 'Categoria inválida' }),
		})
		.optional(),
	isAvailable: booleanQuerySchema.optional(),
	sortBy: z
		.enum(['name', 'price', 'createdAt'], {
			errorMap: () => ({ message: 'Use name, price ou createdAt' }),
		})
		.default('createdAt'),
	sortOrder: sortOrderSchema(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
