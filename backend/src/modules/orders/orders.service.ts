import { OrderStatus, Prisma } from '@prisma/client';
import { performance } from 'node:perf_hooks';
import { planDeliveryAssignments } from '../../algorithms/deliveryAssignment';
import { env } from '../../config/env';
import { AppError } from '../../errors/AppError';
import { prisma, type TransactionClient } from '../../lib/prisma';
import { roundTo, toNumber } from '../../utils/money';
import { buildPage, toPrismaPage } from '../../utils/pagination';
import { toInstantRange } from '../../utils/timeZone';
import {
	orderDetailInclude,
	orderInclude,
	toOrderDetailResponse,
	toOrderResponse,
} from './orders.mapper';
import type { CreateOrderInput, ListOrdersQuery } from './orders.schemas';
import { ASSIGNABLE_STATUSES, checkTransition } from './orderStatus';

const ONE_DELIVERING_ORDER_PER_PERSON_INDEX = 'orders_one_delivering_per_person_idx';

function orderNotFound() {
	return new AppError('ORDER_NOT_FOUND', 'Pedido não encontrado');
}

function deliveryPersonBusy() {
	return new AppError(
		'DELIVERY_PERSON_UNAVAILABLE',
		'Este entregador já está atribuído a outro pedido em andamento',
	);
}

function isDeliveringUniquenessViolation(error: unknown): boolean {
	if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
	if (error.code !== 'P2002') return false;
	const target = error.meta?.target;
	return (
		target === ONE_DELIVERING_ORDER_PER_PERSON_INDEX ||
		(Array.isArray(target) && target.includes('delivery_person_id'))
	);
}

async function lockOrder(tx: TransactionClient, id: string) {
	await tx.$queryRaw`SELECT id FROM orders WHERE id = ${id}::uuid FOR UPDATE`;
	const order = await tx.order.findUnique({ where: { id } });
	if (!order) throw orderNotFound();
	return order;
}

async function ensureDeliveryPersonCanTakeOrder(
	tx: TransactionClient,
	deliveryPersonId: string,
	orderId: string,
) {
	const person = await tx.deliveryPerson.findFirst({
		where: { id: deliveryPersonId, deletedAt: null },
	});
	if (!person) {
		throw new AppError(
			'DELIVERY_PERSON_NOT_FOUND',
			'Entregador não encontrado',
		);
	}
	if (!person.isActive) {
		throw new AppError(
			'DELIVERY_PERSON_UNAVAILABLE',
			'Este entregador está inativo',
		);
	}

	const ongoingDelivery = await tx.order.findFirst({
		where: {
			deliveryPersonId,
			status: OrderStatus.delivering,
			id: { not: orderId },
		},
		select: { id: true },
	});
	if (ongoingDelivery) throw deliveryPersonBusy();
}

async function runMappingDeliveryConflicts<T>(operation: () => Promise<T>) {
	try {
		return await operation();
	} catch (error) {
		if (isDeliveringUniquenessViolation(error)) throw deliveryPersonBusy();
		throw error;
	}
}

export async function listOrders(query: ListOrdersQuery) {
	const createdAt = toInstantRange(
		query.startDate,
		query.endDate,
		env.BUSINESS_TIMEZONE,
	);
	const where: Prisma.OrderWhereInput = {
		...(query.status ? { status: query.status } : {}),
		...(createdAt.gte || createdAt.lt ? { createdAt } : {}),
	};

	const [orders, total] = await prisma.$transaction([
		prisma.order.findMany({
			where,
			include: orderInclude,
			orderBy: [{ [query.sortBy]: query.sortOrder }, { id: 'asc' }],
			...toPrismaPage(query),
		}),
		prisma.order.count({ where }),
	]);

	return buildPage(orders.map(toOrderResponse), total, query);
}

export async function getOrder(id: string) {
	const order = await prisma.order.findUnique({
		where: { id },
		include: orderDetailInclude,
	});
	if (!order) throw orderNotFound();
	return toOrderDetailResponse(order);
}

function mergeItems(items: CreateOrderInput['items']) {
	const quantities = new Map<string, number>();
	for (const item of items) {
		quantities.set(
			item.productId,
			(quantities.get(item.productId) ?? 0) + item.quantity,
		);
	}
	return [...quantities].map(([productId, quantity]) => ({
		productId,
		quantity,
	}));
}

export async function createOrder(input: CreateOrderInput, userId: string) {
	const items = mergeItems(input.items);
	const products = await prisma.product.findMany({
		where: { id: { in: items.map((item) => item.productId) } },
	});
	const productsById = new Map(products.map((product) => [product.id, product]));

	const unavailable = items.flatMap(({ productId }) => {
		const product = productsById.get(productId);
		if (!product || product.deletedAt) {
			return [{ productId, productName: '', reason: 'Produto não encontrado' }];
		}
		if (!product.isAvailable) {
			return [
				{ productId, productName: product.name, reason: 'Produto indisponível' },
			];
		}
		return [];
	});

	if (unavailable.length > 0) {
		throw new AppError(
			'UNAVAILABLE_PRODUCT',
			'Um ou mais produtos não estão disponíveis',
			unavailable,
		);
	}

	const pricedItems = items.map((item) => {
		const unitPrice = productsById.get(item.productId)?.price;
		if (!unitPrice) throw new Error(`Missing price for ${item.productId}`);
		return { ...item, unitPrice };
	});
	const totalAmount = pricedItems.reduce(
		(sum, item) => sum.plus(item.unitPrice.times(item.quantity)),
		new Prisma.Decimal(0),
	);

	const order = await prisma.order.create({
		data: {
			customerName: input.customerName,
			customerPhone: input.customerPhone,
			deliveryAddress: input.deliveryAddress,
			latitude: input.latitude,
			longitude: input.longitude,
			totalAmount,
			items: { create: pricedItems },
			statusHistory: {
				create: { toStatus: OrderStatus.pending, changedById: userId },
			},
		},
		include: orderInclude,
	});

	return toOrderResponse(order);
}

export async function updateOrderStatus(
	id: string,
	status: OrderStatus,
	userId: string,
) {
	return runMappingDeliveryConflicts(() =>
		prisma.$transaction(async (tx) => {
			const order = await lockOrder(tx, id);
			const check = checkTransition(order, status);

			if (!check.allowed) {
				throw new AppError(
					'INVALID_STATUS_TRANSITION',
					check.reason === 'MISSING_DELIVERY_PERSON'
						? "Não é possível alterar o status para 'delivering' sem um entregador atribuído"
						: `Não é possível alterar o status de '${order.status}' para '${status}'`,
				);
			}

			if (status === OrderStatus.delivering && order.deliveryPersonId) {
				await ensureDeliveryPersonCanTakeOrder(tx, order.deliveryPersonId, id);
			}

			const updated = await tx.order.update({
				where: { id },
				data: {
					status,
					statusHistory: {
						create: {
							fromStatus: order.status,
							toStatus: status,
							changedById: userId,
						},
					},
				},
				include: orderInclude,
			});
			return toOrderResponse(updated);
		}),
	);
}

export async function assignDeliveryPerson(id: string, deliveryPersonId: string) {
	return runMappingDeliveryConflicts(() =>
		prisma.$transaction(async (tx) => {
			const order = await lockOrder(tx, id);

			if (!ASSIGNABLE_STATUSES.includes(order.status)) {
				throw new AppError(
					'ORDER_NOT_ASSIGNABLE',
					`Não é possível atribuir um entregador a um pedido com status '${order.status}'`,
				);
			}

			await ensureDeliveryPersonCanTakeOrder(tx, deliveryPersonId, id);

			const updated = await tx.order.update({
				where: { id },
				data: { deliveryPersonId },
				include: orderInclude,
			});
			return toOrderResponse(updated);
		}),
	);
}

export async function optimizeAssignment() {
	const [readyOrders, availablePersons] = await prisma.$transaction([
		prisma.order.findMany({
			where: { status: OrderStatus.ready, deliveryPersonId: null },
			select: { id: true, deliveryAddress: true, latitude: true, longitude: true },
			orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
		}),
		prisma.deliveryPerson.findMany({
			where: {
				deletedAt: null,
				isActive: true,
				currentLatitude: { not: null },
				currentLongitude: { not: null },
				orders: {
					none: {
						status: { in: [OrderStatus.ready, OrderStatus.delivering] },
					},
				},
			},
			select: {
				id: true,
				name: true,
				currentLatitude: true,
				currentLongitude: true,
			},
			orderBy: [{ name: 'asc' }, { id: 'asc' }],
		}),
	]);

	const orders = readyOrders.map((order) => ({
		id: order.id,
		latitude: toNumber(order.latitude),
		longitude: toNumber(order.longitude),
	}));
	const persons = availablePersons.flatMap((person) =>
		person.currentLatitude && person.currentLongitude
			? [
					{
						id: person.id,
						latitude: toNumber(person.currentLatitude),
						longitude: toNumber(person.currentLongitude),
					},
				]
			: [],
	);

	const startedAt = performance.now();
	const plan = planDeliveryAssignments(orders, persons);
	const executionTimeMs = roundTo(performance.now() - startedAt, 2);

	const addressByOrderId = new Map(
		readyOrders.map((order) => [order.id, order.deliveryAddress]),
	);
	const nameByPersonId = new Map(
		availablePersons.map((person) => [person.id, person.name]),
	);

	return {
		assignments: plan.assignments.map((assignment) => ({
			...assignment,
			orderAddress: addressByOrderId.get(assignment.orderId) ?? '',
			deliveryPersonName: nameByPersonId.get(assignment.deliveryPersonId) ?? '',
		})),
		unassigned: plan.unassigned.map((entry) => ({
			orderId: entry.orderId,
			orderAddress: addressByOrderId.get(entry.orderId) ?? '',
			reason: entry.reason,
		})),
		totalDistanceKm: plan.totalDistanceKm,
		algorithm: 'hungarian' as const,
		executionTimeMs,
	};
}
