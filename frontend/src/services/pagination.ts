import { z } from 'zod';

export const paginationSchema = z.object({
	page: z.number(),
	limit: z.number(),
	total: z.number(),
	totalPages: z.number(),
});

export type Pagination = z.infer<typeof paginationSchema>;

export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
	return z.object({ data: z.array(item), pagination: paginationSchema });
}

export type Paginated<T> = { data: T[]; pagination: Pagination };

export type SortOrder = 'asc' | 'desc';

export function compactParams<T extends Record<string, unknown>>(params: T) {
	return Object.fromEntries(
		Object.entries(params).filter(
			([, value]) => value !== undefined && value !== '',
		),
	);
}
