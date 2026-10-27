import { z } from 'zod';
import type { CreateOrderInput } from '@/services/orders';
import { isDecimalString, parseDecimal } from '@/utils/numbers';

const PHONE_PATTERN = /^\(\d{2}\) \d{5}-\d{4}$/;

function coordinate(label: string, limit: number) {
	return z
		.string()
		.trim()
		.min(1, `Informe a ${label}`)
		.refine(isDecimalString, `A ${label} deve ser um número`)
		.refine(
			(value) => Math.abs(parseDecimal(value)) <= limit,
			`A ${label} deve estar entre -${limit} e ${limit}`,
		);
}

export const createOrderFormSchema = z.object({
	customerName: z
		.string()
		.trim()
		.min(3, 'O nome deve ter entre 3 e 100 caracteres')
		.max(100, 'O nome deve ter entre 3 e 100 caracteres'),
	customerPhone: z.string().regex(PHONE_PATTERN, 'Use o formato (11) 98765-4321'),
	deliveryAddress: z
		.string()
		.trim()
		.min(10, 'O endereço deve ter entre 10 e 300 caracteres')
		.max(300, 'O endereço deve ter entre 10 e 300 caracteres'),
	latitude: coordinate('latitude', 90),
	longitude: coordinate('longitude', 180),
	items: z
		.array(
			z.object({
				productId: z.string().min(1, 'Escolha um produto'),
				quantity: z
					.string()
					.regex(/^\d+$/, 'Use um número inteiro')
					.refine((value) => Number(value) >= 1 && Number(value) <= 99, 'Entre 1 e 99'),
			}),
		)
		.min(1, 'Adicione ao menos um item'),
});

export type CreateOrderFormValues = z.infer<typeof createOrderFormSchema>;

export const EMPTY_ORDER_FORM: CreateOrderFormValues = {
	customerName: '',
	customerPhone: '',
	deliveryAddress: '',
	latitude: '',
	longitude: '',
	items: [{ productId: '', quantity: '1' }],
};

export function toCreateOrderInput(values: CreateOrderFormValues): CreateOrderInput {
	return {
		customerName: values.customerName.trim(),
		customerPhone: values.customerPhone,
		deliveryAddress: values.deliveryAddress.trim(),
		latitude: parseDecimal(values.latitude),
		longitude: parseDecimal(values.longitude),
		items: values.items.map((item) => ({
			productId: item.productId,
			quantity: Number(item.quantity),
		})),
	};
}
