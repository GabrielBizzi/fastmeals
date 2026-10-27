import { z } from 'zod';
import type { Product, ProductCategory, ProductInput } from '@/services/products';
import { formatDecimalInput, hasAtMostDecimals, isDecimalString, parseDecimal } from '@/utils/numbers';

export const productFormSchema = z.object({
	name: z
		.string()
		.trim()
		.min(3, 'O nome deve ter entre 3 e 120 caracteres')
		.max(120, 'O nome deve ter entre 3 e 120 caracteres'),
	description: z
		.string()
		.trim()
		.min(10, 'A descrição deve ter entre 10 e 500 caracteres')
		.max(500, 'A descrição deve ter entre 10 e 500 caracteres'),
	price: z
		.string()
		.trim()
		.min(1, 'Informe o preço')
		.refine(isDecimalString, 'Use apenas números, como 32,90')
		.refine((value) => parseDecimal(value) > 0, 'O preço deve ser maior que zero')
		.refine((value) => hasAtMostDecimals(value, 2), 'Use no máximo 2 casas decimais'),
	category: z.enum(['meal', 'drink', 'dessert', 'side'], {
		errorMap: () => ({ message: 'Escolha uma categoria' }),
	}),
	preparationTime: z
		.string()
		.trim()
		.regex(/^\d+$/, 'Informe os minutos com um número inteiro')
		.refine(
			(value) => Number(value) >= 1 && Number(value) <= 120,
			'O tempo de preparo deve estar entre 1 e 120 minutos',
		),
	imageUrl: z
		.string()
		.trim()
		.max(500, 'A URL deve ter no máximo 500 caracteres')
		.refine(
			(value) => value === '' || /^https?:\/\/[^\s]+\.[^\s]+/i.test(value),
			'Informe uma URL que comece com http:// ou https://',
		),
	isAvailable: z.boolean(),
});

export type ProductFormValues = z.input<typeof productFormSchema>;

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
	name: '',
	description: '',
	price: '',
	category: 'meal',
	preparationTime: '',
	imageUrl: '',
	isAvailable: true,
};

export function toProductFormValues(product: Product): ProductFormValues {
	return {
		name: product.name,
		description: product.description,
		price: formatDecimalInput(product.price),
		category: product.category,
		preparationTime: String(product.preparationTime),
		imageUrl: product.imageUrl ?? '',
		isAvailable: product.isAvailable,
	};
}

export function toProductInput(values: ProductFormValues): ProductInput {
	return {
		name: values.name.trim(),
		description: values.description.trim(),
		price: parseDecimal(values.price),
		category: values.category,
		preparationTime: Number(values.preparationTime),
		imageUrl: values.imageUrl.trim() === '' ? null : values.imageUrl.trim(),
		isAvailable: values.isAvailable,
	};
}

export type CatalogFilters = {
	search: string;
	category?: ProductCategory;
	isAvailable?: boolean;
	sortBy: 'name' | 'price' | 'createdAt';
	sortOrder: 'asc' | 'desc';
	page: number;
	limit: number;
};
