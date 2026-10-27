import { z } from 'zod';
import { isoDateSchema } from './validators';

type DateRangeShape = { startDate?: string; endDate?: string };

export const dateRangeOrderIssue = {
	message: 'A data inicial deve ser anterior ou igual à data final',
	path: ['endDate'],
};

export function isOrderedRange({ startDate, endDate }: DateRangeShape): boolean {
	return !startDate || !endDate || startDate <= endDate;
}

export const optionalDateRangeShape = {
	startDate: isoDateSchema.optional(),
	endDate: isoDateSchema.optional(),
};

export const optionalDateRangeSchema = z
	.object(optionalDateRangeShape)
	.refine(isOrderedRange, dateRangeOrderIssue);
