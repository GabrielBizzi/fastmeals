import {
	OrderStatus,
	Prisma,
	ProductCategory,
	UserRole,
	VehicleType,
	type Product,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { buildOrderTimeline } from '../../prisma/orderTimeline';
import { prisma } from '../../src/lib/prisma';

let sequence = 0;
const nextSequence = () => ++sequence;

export const TEST_PASSWORD = 'Senha@123';
const TEST_PASSWORD_HASH = bcrypt.hashSync(TEST_PASSWORD, 10);

export function createUser(role: UserRole = UserRole.admin) {
	return prisma.user.create({
		data: {
			email: `${role}-${nextSequence()}@fastmeals.test`,
			passwordHash: TEST_PASSWORD_HASH,
			role,
		},
	});
}

export function createProduct(overrides: Partial<Prisma.ProductCreateInput> = {}) {
	return prisma.product.create({
		data: {
			name: `Produto ${nextSequence()}`,
			description: 'Descrição suficientemente longa',
			price: 20,
			category: ProductCategory.meal,
			preparationTime: 15,
			...overrides,
		},
	});
}

export function createDeliveryPerson(
	overrides: Partial<Prisma.DeliveryPersonCreateInput> = {},
) {
	return prisma.deliveryPerson.create({
		data: {
			name: `Entregador ${nextSequence()}`,
			phone: '(11) 91234-5678',
			vehicleType: VehicleType.motorcycle,
			currentLatitude: -23.55,
			currentLongitude: -46.63,
			...overrides,
		},
	});
}

type OrderFactoryInput = {
	status?: OrderStatus;
	items?: { product: Product; quantity: number }[];
	deliveryPersonId?: string | null;
	createdAt?: Date;
	latitude?: number;
	longitude?: number;
	travelMinutes?: number;
};

export async function createOrder({
	status = OrderStatus.pending,
	items,
	deliveryPersonId = null,
	createdAt = new Date(),
	latitude = -23.56,
	longitude = -46.65,
	travelMinutes = 20,
}: OrderFactoryInput = {}) {
	const orderItems = items ?? [{ product: await createProduct(), quantity: 1 }];
	const totalAmount = orderItems.reduce(
		(sum, item) => sum.plus(item.product.price.times(item.quantity)),
		new Prisma.Decimal(0),
	);
	const timeline = buildOrderTimeline(createdAt, status, {
		acceptMinutes: 5,
		preparationMinutes: 15,
		pickupMinutes: 5,
		travelMinutes,
	});

	return prisma.order.create({
		data: {
			customerName: 'Cliente Teste',
			customerPhone: '(11) 99999-0000',
			deliveryAddress: 'Rua de Teste, 100, São Paulo - SP',
			latitude,
			longitude,
			status,
			totalAmount,
			deliveryPersonId,
			createdAt,
			items: {
				create: orderItems.map((item) => ({
					productId: item.product.id,
					quantity: item.quantity,
					unitPrice: item.product.price,
				})),
			},
			statusHistory: { create: timeline },
		},
	});
}
