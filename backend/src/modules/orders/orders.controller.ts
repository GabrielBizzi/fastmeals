import type { Request, Response } from 'express';
import { getAuth } from '../../middlewares/authenticate';
import { uuidParamSchema } from '../../utils/validators';
import {
	assignDeliveryPersonSchema,
	createOrderSchema,
	listOrdersQuerySchema,
	updateOrderStatusSchema,
} from './orders.schemas';
import * as ordersService from './orders.service';

export async function list(req: Request, res: Response) {
	const query = listOrdersQuerySchema.parse(req.query);
	res.status(200).json(await ordersService.listOrders(query));
}

export async function show(req: Request, res: Response) {
	const { id } = uuidParamSchema.parse(req.params);
	res.status(200).json(await ordersService.getOrder(id));
}

export async function create(req: Request, res: Response) {
	const input = createOrderSchema.parse(req.body);
	res
		.status(201)
		.json(await ordersService.createOrder(input, getAuth(req).userId));
}

export async function updateStatus(req: Request, res: Response) {
	const { id } = uuidParamSchema.parse(req.params);
	const { status } = updateOrderStatusSchema.parse(req.body);
	res
		.status(200)
		.json(
			await ordersService.updateOrderStatus(id, status, getAuth(req).userId),
		);
}

export async function assign(req: Request, res: Response) {
	const { id } = uuidParamSchema.parse(req.params);
	const { deliveryPersonId } = assignDeliveryPersonSchema.parse(req.body);
	res
		.status(200)
		.json(await ordersService.assignDeliveryPerson(id, deliveryPersonId));
}

export async function optimizeAssignment(_req: Request, res: Response) {
	res.status(200).json(await ordersService.optimizeAssignment());
}
