const DEFAULT_POLLING_MS = 15_000;

function parsePositiveInteger(value: string | undefined, fallback: number) {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const ENV = {
	API_URL: import.meta.env.VITE_API_URL || '/api',
	ORDERS_POLLING_MS: parsePositiveInteger(
		import.meta.env.VITE_ORDERS_POLLING_MS,
		DEFAULT_POLLING_MS,
	),
};
