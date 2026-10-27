import type { Order } from '@/services/orders';
import type { Product } from '@/services/products';

export function buildOrder(overrides: Partial<Order> = {}): Order {
	return {
		id: 'order-1',
		customerName: 'Joao Silva',
		customerPhone: '(11) 99999-1234',
		deliveryAddress: 'Rua das Flores, 123, São Paulo - SP',
		latitude: -23.58,
		longitude: -46.63,
		status: 'pending',
		totalAmount: 78.3,
		deliveryPersonId: null,
		deliveryPerson: null,
		items: [
			{
				id: 'item-1',
				product: { id: 'product-1', name: 'X-Burger Especial' },
				quantity: 2,
				unitPrice: 32.9,
			},
		],
		availableTransitions: ['preparing', 'cancelled'],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		...overrides,
	};
}

export function buildProduct(overrides: Partial<Product> = {}): Product {
	return {
		id: 'product-1',
		name: 'X-Burger Especial',
		description: 'Hambúrguer artesanal com queijo cheddar',
		price: 32.9,
		category: 'meal',
		imageUrl: null,
		isAvailable: true,
		preparationTime: 25,
		createdAt: '2025-01-15T10:30:00.000Z',
		updatedAt: '2025-01-15T10:30:00.000Z',
		...overrides,
	};
}

export const EMPTY_STATUS_COUNTS = {
	data: [
		{ status: 'pending', count: 1 },
		{ status: 'preparing', count: 0 },
		{ status: 'ready', count: 0 },
		{ status: 'delivering', count: 0 },
		{ status: 'delivered', count: 0 },
		{ status: 'cancelled', count: 0 },
	],
	total: 1,
};
