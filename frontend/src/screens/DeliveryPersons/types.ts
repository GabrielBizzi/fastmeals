import { z } from 'zod';
import type { DeliveryPerson, DeliveryPersonInput } from '@/services/deliveryPersons';
import { formatDecimalInput, isDecimalString, parseDecimal } from '@/utils/numbers';

function optionalCoordinate(label: string, limit: number) {
	return z
		.string()
		.trim()
		.refine((value) => value === '' || isDecimalString(value), `A ${label} deve ser um número`)
		.refine(
			(value) => value === '' || Math.abs(parseDecimal(value)) <= limit,
			`A ${label} deve estar entre -${limit} e ${limit}`,
		);
}

export const deliveryPersonFormSchema = z
	.object({
		name: z
			.string()
			.trim()
			.min(3, 'O nome deve ter entre 3 e 100 caracteres')
			.max(100, 'O nome deve ter entre 3 e 100 caracteres'),
		phone: z.string().regex(/^\(\d{2}\) \d{5}-\d{4}$/, 'Use o formato (11) 98765-4321'),
		vehicleType: z.enum(['bicycle', 'motorcycle', 'car'], {
			errorMap: () => ({ message: 'Escolha um veículo' }),
		}),
		isActive: z.boolean(),
		currentLatitude: optionalCoordinate('latitude', 90),
		currentLongitude: optionalCoordinate('longitude', 180),
	})
	.refine(
		(values) => (values.currentLatitude.trim() === '') === (values.currentLongitude.trim() === ''),
		{
			message: 'Preencha latitude e longitude juntas ou deixe ambas em branco',
			path: ['currentLongitude'],
		},
	);

export type DeliveryPersonFormValues = z.input<typeof deliveryPersonFormSchema>;

export const EMPTY_DELIVERY_PERSON_FORM: DeliveryPersonFormValues = {
	name: '',
	phone: '',
	vehicleType: 'motorcycle',
	isActive: true,
	currentLatitude: '',
	currentLongitude: '',
};

export function toDeliveryPersonFormValues(person: DeliveryPerson): DeliveryPersonFormValues {
	return {
		name: person.name,
		phone: person.phone,
		vehicleType: person.vehicleType,
		isActive: person.isActive,
		currentLatitude: formatDecimalInput(person.currentLatitude),
		currentLongitude: formatDecimalInput(person.currentLongitude),
	};
}

function toCoordinate(value: string): number | null {
	return value.trim() === '' ? null : parseDecimal(value);
}

export function toDeliveryPersonInput(values: DeliveryPersonFormValues): DeliveryPersonInput {
	return {
		name: values.name.trim(),
		phone: values.phone,
		vehicleType: values.vehicleType,
		isActive: values.isActive,
		currentLatitude: toCoordinate(values.currentLatitude),
		currentLongitude: toCoordinate(values.currentLongitude),
	};
}

export type CourierFilter = 'all' | 'active' | 'available';
