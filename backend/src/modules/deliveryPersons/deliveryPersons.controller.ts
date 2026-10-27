import type { Request, Response } from 'express';
import { uuidParamSchema } from '../../utils/validators';
import {
	createDeliveryPersonSchema,
	listDeliveryPersonsQuerySchema,
	updateDeliveryPersonSchema,
} from './deliveryPersons.schemas';
import * as deliveryPersonsService from './deliveryPersons.service';

export async function list(req: Request, res: Response) {
	const query = listDeliveryPersonsQuerySchema.parse(req.query);
	res.status(200).json(await deliveryPersonsService.listDeliveryPersons(query));
}

export async function show(req: Request, res: Response) {
	const { id } = uuidParamSchema.parse(req.params);
	res.status(200).json(await deliveryPersonsService.getDeliveryPerson(id));
}

export async function create(req: Request, res: Response) {
	const input = createDeliveryPersonSchema.parse(req.body);
	res
		.status(201)
		.json(await deliveryPersonsService.createDeliveryPerson(input));
}

export async function update(req: Request, res: Response) {
	const { id } = uuidParamSchema.parse(req.params);
	const input = updateDeliveryPersonSchema.parse(req.body);
	res
		.status(200)
		.json(await deliveryPersonsService.updateDeliveryPerson(id, input));
}

export async function remove(req: Request, res: Response) {
	const { id } = uuidParamSchema.parse(req.params);
	await deliveryPersonsService.deleteDeliveryPerson(id);
	res.status(204).send();
}
