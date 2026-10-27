import { OrderStatus, UserRole } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { useTestDatabase } from '../helpers/database';
import { createOrder, createProduct } from '../helpers/factories';
import { api, authHeaderFor } from '../helpers/http';

useTestDatabase();

const validProduct = {
	name: 'Suco de Uva Integral',
	description: 'Suco de uva integral, sem açúcar, 500ml',
	price: 12.5,
	category: 'drink',
	imageUrl: 'https://example.com/suco.jpg',
	preparationTime: 5,
};

describe('POST /api/products', () => {
	it('creates a product with defaults and returns 201', async () => {
		const { header } = await authHeaderFor(UserRole.admin);

		const response = await api().post('/api/products').set(header).send(validProduct);

		expect(response.status).toBe(201);
		expect(response.body).toMatchObject({
			...validProduct,
			id: expect.any(String),
			isAvailable: true,
		});
		expect(await prisma.product.count()).toBe(1);
	});

	it.each([
		['name', { name: 'ab' }, 'O nome deve ter entre 3 e 120 caracteres'],
		['name', { name: 'a'.repeat(121) }, 'O nome deve ter entre 3 e 120 caracteres'],
		['description', { description: 'curta' }, 'A descrição deve ter entre 10 e 500 caracteres'],
		['price', { price: 0 }, 'O preço deve ser maior que zero'],
		['price', { price: 10.555 }, 'O preço deve ter no máximo 2 casas decimais'],
		['price', { price: '10' }, 'O preço deve ser um número'],
		['category', { category: 'pizza' }, 'A categoria deve ser meal, drink, dessert ou side'],
		['imageUrl', { imageUrl: 'nao-e-url' }, 'Informe uma URL válida'],
		['preparationTime', { preparationTime: 121 }, 'O tempo de preparo deve estar entre 1 e 120 minutos'],
		['preparationTime', { preparationTime: 1.5 }, 'O tempo de preparo deve ser um número inteiro de minutos'],
	])('rejects an invalid %s (%j)', async (field, override, message) => {
		const { header } = await authHeaderFor(UserRole.admin);

		const response = await api()
			.post('/api/products')
			.set(header)
			.send({ ...validProduct, ...override });

		expect(response.status).toBe(400);
		expect(response.body.error.code).toBe('VALIDATION_ERROR');
		expect(response.body.error.details).toContainEqual({ field, message });
		expect(await prisma.product.count()).toBe(0);
	});
});

describe('GET /api/products', () => {
	it('paginates, searches case-insensitively and filters by category and availability', async () => {
		const { header } = await authHeaderFor(UserRole.viewer);
		await createProduct({ name: 'X-Burger Especial', category: 'meal' });
		await createProduct({ name: 'Burger Vegano', category: 'meal', isAvailable: false });
		await createProduct({ name: 'Refrigerante', category: 'drink' });

		const searched = await api()
			.get('/api/products')
			.query({ search: 'BURGER', sortBy: 'name', sortOrder: 'asc', limit: 1 })
			.set(header);

		expect(searched.status).toBe(200);
		expect(searched.body.data.map((product: { name: string }) => product.name)).toEqual([
			'Burger Vegano',
		]);
		expect(searched.body.pagination).toEqual({ page: 1, limit: 1, total: 2, totalPages: 2 });

		const filtered = await api()
			.get('/api/products')
			.query({ category: 'meal', isAvailable: 'true' })
			.set(header);
		expect(filtered.body.data).toHaveLength(1);
		expect(filtered.body.data[0].name).toBe('X-Burger Especial');
	});

	it('rejects invalid query parameters', async () => {
		const { header } = await authHeaderFor();

		const response = await api()
			.get('/api/products')
			.query({ limit: 500, sortBy: 'password' })
			.set(header);

		expect(response.status).toBe(400);
		expect(response.body.error.details.map((detail: { field: string }) => detail.field)).toEqual(
			expect.arrayContaining(['limit', 'sortBy']),
		);
	});

	it('hides unavailable products from the public menu but keeps them in the admin listing', async () => {
		const { header } = await authHeaderFor();
		await createProduct({ name: 'Disponível' });
		await createProduct({ name: 'Desativado', isAvailable: false });

		const menu = await api().get('/api/menu');
		const admin = await api().get('/api/products').set(header);

		expect(menu.status).toBe(200);
		expect(menu.body.data.map((product: { name: string }) => product.name)).toEqual(['Disponível']);
		expect(admin.body.pagination.total).toBe(2);
	});
});

describe('PUT /api/products/:id', () => {
	it('updates only the provided fields', async () => {
		const { header } = await authHeaderFor();
		const product = await createProduct({ price: 10 });

		const response = await api()
			.put(`/api/products/${product.id}`)
			.set(header)
			.send({ price: 14.9, isAvailable: false });

		expect(response.status).toBe(200);
		expect(response.body).toMatchObject({ name: product.name, price: 14.9, isAvailable: false });
	});

	it('returns 404 PRODUCT_NOT_FOUND for an unknown id', async () => {
		const { header } = await authHeaderFor();

		const response = await api()
			.put('/api/products/7d0f3a0e-4b8e-4f4a-9d76-1f9d7c1e0b11')
			.set(header)
			.send({ price: 10 });

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
	});
});

describe('DELETE /api/products/:id', () => {
	it.each([OrderStatus.pending, OrderStatus.preparing])(
		'refuses to delete a product linked to a %s order',
		async (status) => {
			const { header } = await authHeaderFor();
			const product = await createProduct();
			await createOrder({ status, items: [{ product, quantity: 1 }] });

			const response = await api().delete(`/api/products/${product.id}`).set(header);

			expect(response.status).toBe(409);
			expect(response.body.error.code).toBe('PRODUCT_IN_USE');
		},
	);

	it('deletes a product whose orders are already delivered and keeps the order history intact', async () => {
		const { header } = await authHeaderFor();
		const product = await createProduct();
		const deliveryPersonId = (
			await prisma.deliveryPerson.create({
				data: { name: 'Entregador', phone: '(11) 91234-5678', vehicleType: 'car' },
			})
		).id;
		const order = await createOrder({
			status: OrderStatus.delivered,
			deliveryPersonId,
			items: [{ product, quantity: 2 }],
		});

		const response = await api().delete(`/api/products/${product.id}`).set(header);
		const afterDelete = await api().get(`/api/products/${product.id}`).set(header);
		const orderDetail = await api().get(`/api/orders/${order.id}`).set(header);

		expect(response.status).toBe(204);
		expect(afterDelete.status).toBe(404);
		expect(orderDetail.body.items[0].product.name).toBe(product.name);
	});
});
