import { OrderStatus } from '@prisma/client';
import { z } from 'zod';
import {
	dateRangeOrderIssue,
	isOrderedRange,
	optionalDateRangeShape,
} from '../../utils/dateRange';
import { paginationQuerySchema } from '../../utils/pagination';
import {
	latitudeSchema,
	longitudeSchema,
	phoneSchema,
	sortOrderSchema,
} from '../../utils/validators';

const orderStatusSchema = z.nativeEnum(OrderStatus, {
	errorMap: () => ({
		message:
			'O status deve ser pending, preparing, ready, delivering, delivered ou cancelled',
	}),
});

const orderItemSchema = z.object({
	productId: z
		.string({ required_error: 'O produto é obrigatório' })
		.uuid('Identificador de produto inválido'),
	quantity: z
		.number({
			required_error: 'A quantidade é obrigatória',
			invalid_type_error: 'A quantidade deve ser um número',
		})
		.int('A quantidade deve ser um número inteiro')
		.min(1, 'A quantidade mínima é 1')
		.max(99, 'A quantidade máxima por item é 99'),
});

export const createOrderSchema = z.object({
	customerName: z
		.string({ required_error: 'O nome do cliente é obrigatório' })
		.trim()
		.min(3, 'O nome do cliente deve ter entre 3 e 100 caracteres')
		.max(100, 'O nome do cliente deve ter entre 3 e 100 caracteres'),
	customerPhone: phoneSchema,
	deliveryAddress: z
		.string({ required_error: 'O endereço é obrigatório' })
		.trim()
		.min(10, 'O endereço deve ter entre 10 e 300 caracteres')
		.max(300, 'O endereço deve ter entre 10 e 300 caracteres'),
	latitude: latitudeSchema,
	longitude: longitudeSchema,
	items: z
		.array(orderItemSchema, {
			required_error: 'Informe ao menos um item',
			invalid_type_error: 'Os itens devem ser uma lista',
		})
		.min(1, 'Informe ao menos um item')
		.max(50, 'Um pedido pode ter no máximo 50 itens'),
});

export const updateOrderStatusSchema = z.object({
	status: orderStatusSchema,
});

export const assignDeliveryPersonSchema = z.object({
	deliveryPersonId: z
		.string({ required_error: 'O entregador é obrigatório' })
		.uuid('Identificador de entregador inválido'),
});

export const listOrdersQuerySchema = paginationQuerySchema
	.extend({
		status: orderStatusSchema.optional(),
		sortBy: z
			.enum(['createdAt', 'totalAmount'], {
				errorMap: () => ({ message: 'Use createdAt ou totalAmount' }),
			})
			.default('createdAt'),
		sortOrder: sortOrderSchema(),
		...optionalDateRangeShape,
	})
	.refine(isOrderedRange, dateRangeOrderIssue);

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
