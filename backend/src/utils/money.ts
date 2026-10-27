import type { Prisma } from '@prisma/client';

export function toNumber(value: Prisma.Decimal): number {
	return value.toNumber();
}

export function toNullableNumber(value: Prisma.Decimal | null): number | null {
	return value === null ? null : value.toNumber();
}

export function roundTo(value: number, decimals: number): number {
	const factor = 10 ** decimals;
	return Math.round((value + Number.EPSILON) * factor) / factor;
}
