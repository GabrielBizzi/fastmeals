export function parseDecimal(value: string): number {
	const normalized = value.trim().replace(/\s/g, '').replace(',', '.');
	return normalized === '' ? Number.NaN : Number(normalized);
}

export function isDecimalString(value: string) {
	return Number.isFinite(parseDecimal(value));
}

export function hasAtMostDecimals(value: string, decimals: number) {
	const [, fraction = ''] = value.trim().replace(',', '.').split('.');
	return fraction.length <= decimals;
}

export function formatDecimalInput(value: number | null | undefined) {
	return value === null || value === undefined ? '' : String(value).replace('.', ',');
}
