import { z } from 'zod';
import { api } from './api';
import { orderStatusSchema, vehicleTypeSchema } from './orders';
import { compactParams } from './pagination';

export type ReportPeriod = {
	startDate: string;
	endDate: string;
};

const revenueReportSchema = z.object({
	startDate: z.string(),
	endDate: z.string(),
	totalRevenue: z.number(),
	totalOrders: z.number(),
	averageOrderValue: z.number(),
	dailyRevenue: z.array(
		z.object({ date: z.string(), revenue: z.number(), orders: z.number() }),
	),
});
export type RevenueReport = z.infer<typeof revenueReportSchema>;

const ordersByStatusReportSchema = z.object({
	data: z.array(z.object({ status: orderStatusSchema, count: z.number() })),
	total: z.number(),
});
export type OrdersByStatusReport = z.infer<typeof ordersByStatusReportSchema>;

const topProductsReportSchema = z.object({
	data: z.array(
		z.object({
			productId: z.string(),
			productName: z.string(),
			totalQuantity: z.number(),
			totalRevenue: z.number(),
		}),
	),
});
export type TopProductsReport = z.infer<typeof topProductsReportSchema>;

const deliveryTimeReportSchema = z.object({
	averageMinutes: z.number(),
	fastestMinutes: z.number(),
	slowestMinutes: z.number(),
	totalDelivered: z.number(),
	byVehicleType: z.array(
		z.object({
			vehicleType: vehicleTypeSchema,
			averageMinutes: z.number(),
			count: z.number(),
		}),
	),
});
export type DeliveryTimeReport = z.infer<typeof deliveryTimeReportSchema>;

export type ReportsBundle = {
	revenue: RevenueReport;
	ordersByStatus: OrdersByStatusReport;
	topProducts: TopProductsReport;
	deliveryTime: DeliveryTimeReport;
};

async function getReport<T extends z.ZodTypeAny>(
	path: string,
	schema: T,
	params: Record<string, unknown>,
	signal?: AbortSignal,
): Promise<z.infer<T>> {
	const { data } = await api.get<unknown>(`/reports/${path}`, {
		params,
		signal,
	});
	return schema.parse(data);
}

export function getOrdersByStatus(
	period: Partial<ReportPeriod>,
	signal?: AbortSignal,
): Promise<OrdersByStatusReport> {
	return getReport(
		'orders-by-status',
		ordersByStatusReportSchema,
		compactParams(period),
		signal,
	);
}

export async function getReportsBundle(
	period: ReportPeriod,
	signal?: AbortSignal,
): Promise<ReportsBundle> {
	const [revenue, ordersByStatus, topProducts, deliveryTime] =
		await Promise.all([
			getReport('revenue', revenueReportSchema, period, signal),
			getReport('orders-by-status', ordersByStatusReportSchema, period, signal),
			getReport(
				'top-products',
				topProductsReportSchema,
				{ ...period, limit: 10 },
				signal,
			),
			getReport(
				'average-delivery-time',
				deliveryTimeReportSchema,
				period,
				signal,
			),
		]);
	return { revenue, ordersByStatus, topProducts, deliveryTime };
}
