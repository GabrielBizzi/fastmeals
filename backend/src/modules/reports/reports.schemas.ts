import { z } from 'zod';
import {
	dateRangeOrderIssue,
	isOrderedRange,
	optionalDateRangeShape,
} from '../../utils/dateRange';
import { daysBetween } from '../../utils/timeZone';
import { isoDateSchema } from '../../utils/validators';

export const MAX_REVENUE_RANGE_DAYS = 366;

export const revenueQuerySchema = z
	.object({
		startDate: isoDateSchema,
		endDate: isoDateSchema,
	})
	.refine(isOrderedRange, dateRangeOrderIssue)
	.refine(
		({ startDate, endDate }) =>
			daysBetween(startDate, endDate) < MAX_REVENUE_RANGE_DAYS,
		{
			message: `O período pode ter no máximo ${MAX_REVENUE_RANGE_DAYS} dias`,
			path: ['endDate'],
		},
	);

export const periodQuerySchema = z
	.object(optionalDateRangeShape)
	.refine(isOrderedRange, dateRangeOrderIssue);

export const topProductsQuerySchema = z
	.object({
		...optionalDateRangeShape,
		limit: z.coerce
			.number({ invalid_type_error: 'O limite deve ser um número' })
			.int('O limite deve ser um número inteiro')
			.min(1, 'O limite deve ser maior ou igual a 1')
			.max(50, 'O limite máximo é 50')
			.default(10),
	})
	.refine(isOrderedRange, dateRangeOrderIssue);

export type RevenueQuery = z.infer<typeof revenueQuerySchema>;
export type PeriodQuery = z.infer<typeof periodQuerySchema>;
export type TopProductsQuery = z.infer<typeof topProductsQuerySchema>;
