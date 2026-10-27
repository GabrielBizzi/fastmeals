import { z } from 'zod';
import { api } from './api';
import { compactParams, paginatedSchema, type SortOrder } from './pagination';

export const productCategorySchema = z.enum([
	'meal',
	'drink',
	'dessert',
	'side',
]);
export type ProductCategory = z.infer<typeof productCategorySchema>;

export const productSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string(),
	price: z.number(),
	category: productCategorySchema,
	imageUrl: z.string().nullable(),
	isAvailable: z.boolean(),
	preparationTime: z.number(),
	createdAt: z.string(),
	updatedAt: z.string(),
});
export type Product = z.infer<typeof productSchema>;

const productPageSchema = paginatedSchema(productSchema);

export type ProductFilters = {
	page: number;
	limit: number;
	search?: string;
	category?: ProductCategory;
	isAvailable?: boolean;
	sortBy?: 'name' | 'price' | 'createdAt';
	sortOrder?: SortOrder;
};

export type ProductInput = {
	name: string;
	description: string;
	price: number;
	category: ProductCategory;
	imageUrl: string | null;
	preparationTime: number;
	isAvailable: boolean;
};

export async function listProducts(
	filters: ProductFilters,
	signal?: AbortSignal,
) {
	const { data } = await api.get<unknown>('/products', {
		params: compactParams(filters),
		signal,
	});
	return productPageSchema.parse(data);
}

export async function createProduct(input: ProductInput) {
	const { data } = await api.post<unknown>('/products', input);
	return productSchema.parse(data);
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
	const { data } = await api.put<unknown>(`/products/${id}`, input);
	return productSchema.parse(data);
}

export async function deleteProduct(id: string) {
	await api.delete(`/products/${id}`);
}
