import type { Request, Response } from 'express';
import {
	periodQuerySchema,
	revenueQuerySchema,
	topProductsQuerySchema,
} from './reports.schemas';
import * as reportsService from './reports.service';

export async function revenue(req: Request, res: Response) {
	const query = revenueQuerySchema.parse(req.query);
	res.status(200).json(await reportsService.getRevenue(query));
}

export async function ordersByStatus(req: Request, res: Response) {
	const query = periodQuerySchema.parse(req.query);
	res.status(200).json(await reportsService.getOrdersByStatus(query));
}

export async function topProducts(req: Request, res: Response) {
	const query = topProductsQuerySchema.parse(req.query);
	res.status(200).json(await reportsService.getTopProducts(query));
}

export async function averageDeliveryTime(req: Request, res: Response) {
	const query = periodQuerySchema.parse(req.query);
	res.status(200).json(await reportsService.getAverageDeliveryTime(query));
}
