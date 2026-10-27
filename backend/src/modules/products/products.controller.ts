import type { Request, Response } from 'express';
import { uuidParamSchema } from '../../utils/validators';
import {
	createProductSchema,
	listProductsQuerySchema,
	updateProductSchema,
} from './products.schemas';
import * as productsService from './products.service';

export async function list(req: Request, res: Response) {
	const query = listProductsQuerySchema.parse(req.query);
	res.status(200).json(await productsService.listProducts(query));
}

export async function listMenu(req: Request, res: Response) {
	const query = listProductsQuerySchema.parse(req.query);
	res.status(200).json(await productsService.listPublicMenu(query));
}

export async function show(req: Request, res: Response) {
	const { id } = uuidParamSchema.parse(req.params);
	res.status(200).json(await productsService.getProduct(id));
}

export async function create(req: Request, res: Response) {
	const input = createProductSchema.parse(req.body);
	res.status(201).json(await productsService.createProduct(input));
}

export async function update(req: Request, res: Response) {
	const { id } = uuidParamSchema.parse(req.params);
	const input = updateProductSchema.parse(req.body);
	res.status(200).json(await productsService.updateProduct(id, input));
}

export async function remove(req: Request, res: Response) {
	const { id } = uuidParamSchema.parse(req.params);
	await productsService.deleteProduct(id);
	res.status(204).send();
}
