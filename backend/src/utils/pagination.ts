import { z } from 'zod';

export const paginationQuerySchema = z.object({
	page: z.coerce
		.number({ invalid_type_error: 'A página deve ser um número' })
		.int('A página deve ser um número inteiro')
		.min(1, 'A página deve ser maior ou igual a 1')
		.default(1),
	limit: z.coerce
		.number({ invalid_type_error: 'O limite deve ser um número' })
		.int('O limite deve ser um número inteiro')
		.min(1, 'O limite deve ser maior ou igual a 1')
		.max(100, 'O limite máximo é 100')
		.default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export type Paginated<T> = {
	data: T[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
};

export function toPrismaPage({ page, limit }: PaginationQuery) {
	return { skip: (page - 1) * limit, take: limit };
}

export function buildPage<T>(
	data: T[],
	total: number,
	{ page, limit }: PaginationQuery,
): Paginated<T> {
	return {
		data,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
}
