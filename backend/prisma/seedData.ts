import {
	OrderStatus,
	ProductCategory,
	UserRole,
	VehicleType,
} from '@prisma/client';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

const seedFileSchema = z.object({
	users: z.array(
		z.object({
			email: z.string().email(),
			password: z.string().min(1),
			role: z.nativeEnum(UserRole),
		}),
	),
	products: z.array(
		z.object({
			name: z.string(),
			description: z.string(),
			price: z.number().positive(),
			category: z.nativeEnum(ProductCategory),
			imageUrl: z.string().url().nullable().optional(),
			isAvailable: z.boolean(),
			preparationTime: z.number().int(),
		}),
	),
	deliveryPersons: z.array(
		z.object({
			name: z.string(),
			phone: z.string(),
			vehicleType: z.nativeEnum(VehicleType),
			isActive: z.boolean(),
			currentLatitude: z.number().nullable(),
			currentLongitude: z.number().nullable(),
		}),
	),
	orders: z.array(
		z.object({
			customerName: z.string(),
			customerPhone: z.string(),
			deliveryAddress: z.string(),
			latitude: z.number(),
			longitude: z.number(),
			status: z.nativeEnum(OrderStatus),
			deliveryPersonIndex: z.number().int().nonnegative().optional(),
			items: z.array(
				z.object({
					productIndex: z.number().int().nonnegative(),
					quantity: z.number().int().positive(),
				}),
			),
		}),
	),
});

export type SeedFile = z.infer<typeof seedFileSchema>;

export const DEFAULT_SEED_FILE = path.resolve(__dirname, '../../seed/data.json');

export function readSeedFile(filePath = process.env.SEED_FILE ?? DEFAULT_SEED_FILE): SeedFile {
	const raw: unknown = JSON.parse(readFileSync(filePath, 'utf-8'));
	return seedFileSchema.parse(raw);
}
