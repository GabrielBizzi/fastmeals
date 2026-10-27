import type { Prisma } from '@prisma/client';
import { OrderStatus } from '@prisma/client';
import { AppError } from '../../errors/AppError';
import { prisma } from '../../lib/prisma';
import { buildPage, toPrismaPage } from '../../utils/pagination';
import { toProductResponse } from './products.mapper';
import type {
	CreateProductInput,
	ListProductsQuery,
	UpdateProductInput,
} from './products.schemas';

const BLOCKING_ORDER_STATUSES: OrderStatus[] = [
	OrderStatus.pending,
	OrderStatus.preparing,
];

function productNotFound() {
	return new AppError('PRODUCT_NOT_FOUND', 'Produto não encontrado');
}

async function findExistingProduct(id: string) {
	const product = await prisma.product.findFirst({
		where: { id, deletedAt: null },
	});
	if (!product) throw productNotFound();
	return product;
}

function buildListFilter(query: ListProductsQuery): Prisma.ProductWhereInput {
	return {
		deletedAt: null,
		...(query.search
			? { name: { contains: query.search, mode: 'insensitive' } }
			: {}),
		...(query.category ? { category: query.category } : {}),
		...(query.isAvailable !== undefined
			? { isAvailable: query.isAvailable }
			: {}),
	};
}

export async function listProducts(query: ListProductsQuery) {
	const where = buildListFilter(query);
	const [products, total] = await prisma.$transaction([
		prisma.product.findMany({
			where,
			orderBy: [{ [query.sortBy]: query.sortOrder }, { id: 'asc' }],
			...toPrismaPage(query),
		}),
		prisma.product.count({ where }),
	]);
	return buildPage(products.map(toProductResponse), total, query);
}

export async function listPublicMenu(query: ListProductsQuery) {
	return listProducts({ ...query, isAvailable: true });
}

export async function getProduct(id: string) {
	return toProductResponse(await findExistingProduct(id));
}

export async function createProduct(input: CreateProductInput) {
	const product = await prisma.product.create({
		data: { ...input, imageUrl: input.imageUrl ?? null },
	});
	return toProductResponse(product);
}

export async function updateProduct(id: string, input: UpdateProductInput) {
	await findExistingProduct(id);
	const product = await prisma.product.update({
		where: { id },
		data: input,
	});
	return toProductResponse(product);
}

export async function deleteProduct(id: string): Promise<void> {
	await findExistingProduct(id);

	const blockingOrders = await prisma.order.count({
		where: {
			status: { in: BLOCKING_ORDER_STATUSES },
			items: { some: { productId: id } },
		},
	});

	if (blockingOrders > 0) {
		throw new AppError(
			'PRODUCT_IN_USE',
			"Não é possível excluir este produto pois ele está vinculado a pedidos com status 'pending' ou 'preparing'",
		);
	}

	await prisma.product.update({
		where: { id },
		data: { deletedAt: new Date(), isAvailable: false },
	});
}
