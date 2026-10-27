import { VehicleType } from '@prisma/client';
import { z } from 'zod';
import {
	booleanQuerySchema,
	latitudeSchema,
	longitudeSchema,
	phoneSchema,
} from '../../utils/validators';

const deliveryPersonFields = z.object({
	name: z
		.string({ required_error: 'O nome é obrigatório' })
		.trim()
		.min(3, 'O nome deve ter entre 3 e 100 caracteres')
		.max(100, 'O nome deve ter entre 3 e 100 caracteres'),
	phone: phoneSchema,
	vehicleType: z.nativeEnum(VehicleType, {
		errorMap: () => ({
			message: 'O veículo deve ser bicycle, motorcycle ou car',
		}),
	}),
	isActive: z.boolean({
		invalid_type_error: 'O status deve ser verdadeiro ou falso',
	}),
	currentLatitude: latitudeSchema.nullable(),
	currentLongitude: longitudeSchema.nullable(),
});

type CoordinatesPair = {
	currentLatitude?: number | null;
	currentLongitude?: number | null;
};

function hasConsistentCoordinates(value: CoordinatesPair): boolean {
	const { currentLatitude, currentLongitude } = value;
	if (currentLatitude === undefined || currentLongitude === undefined) {
		return currentLatitude === currentLongitude;
	}
	return (currentLatitude === null) === (currentLongitude === null);
}

const coordinatesPairIssue = {
	message: 'Informe latitude e longitude juntas ou deixe ambas em branco',
	path: ['currentLongitude'],
};

export const createDeliveryPersonSchema = deliveryPersonFields
	.extend({
		isActive: deliveryPersonFields.shape.isActive.default(true),
		currentLatitude: deliveryPersonFields.shape.currentLatitude.default(null),
		currentLongitude: deliveryPersonFields.shape.currentLongitude.default(null),
	})
	.refine(hasConsistentCoordinates, coordinatesPairIssue);

export const updateDeliveryPersonSchema = deliveryPersonFields
	.partial()
	.refine((value) => Object.keys(value).length > 0, {
		message: 'Informe ao menos um campo para atualizar',
	})
	.refine(hasConsistentCoordinates, coordinatesPairIssue);

export const listDeliveryPersonsQuerySchema = z.object({
	isActive: booleanQuerySchema.optional(),
	available: booleanQuerySchema.optional(),
});

export type CreateDeliveryPersonInput = z.infer<typeof createDeliveryPersonSchema>;
export type UpdateDeliveryPersonInput = z.infer<typeof updateDeliveryPersonSchema>;
export type ListDeliveryPersonsQuery = z.infer<
	typeof listDeliveryPersonsQuerySchema
>;
