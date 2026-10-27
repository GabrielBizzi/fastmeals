import type { Product } from '@prisma/client';
import { toNumber } from '../../utils/money';

export type ProductResponse = {
	id: string;
	name: string;
	description: string;
	price: number;
	category: Product['category'];
	imageUrl: string | null;
	isAvailable: boolean;
	preparationTime: number;
	createdAt: string;
	updatedAt: string;
};

export function toProductResponse(product: Product): ProductResponse {
	return {
		id: product.id,
		name: product.name,
		description: product.description,
		price: toNumber(product.price),
		category: product.category,
		imageUrl: product.imageUrl,
		isAvailable: product.isAvailable,
		preparationTime: product.preparationTime,
		createdAt: product.createdAt.toISOString(),
		updatedAt: product.updatedAt.toISOString(),
	};
}
