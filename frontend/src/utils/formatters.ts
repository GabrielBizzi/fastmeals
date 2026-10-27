import dayjs from 'dayjs';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
	style: 'currency',
	currency: 'BRL',
});

const decimalFormatter = new Intl.NumberFormat('pt-BR', {
	minimumFractionDigits: 0,
	maximumFractionDigits: 1,
});

const distanceFormatter = new Intl.NumberFormat('pt-BR', {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

export function formatCurrency(value: number) {
	return currencyFormatter.format(value);
}

export function formatDateTime(isoDate: string) {
	return dayjs(isoDate).format('DD/MM/YYYY HH:mm');
}

export function formatTime(isoDate: string) {
	return dayjs(isoDate).format('HH:mm');
}

export function formatShortDate(isoDate: string) {
	return dayjs(isoDate).format('DD/MM');
}

export function formatMinutes(minutes: number) {
	if (minutes < 60) return `${decimalFormatter.format(minutes)} min`;
	const hours = Math.floor(minutes / 60);
	const rest = Math.round(minutes % 60);
	return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function formatDistance(km: number) {
	return `${distanceFormatter.format(km)} km`;
}

export function formatRelativeMinutes(isoDate: string, now: Date = new Date()) {
	const minutes = Math.max(0, Math.round((now.getTime() - Date.parse(isoDate)) / 60_000));
	if (minutes < 1) return 'agora';
	if (minutes < 60) return `há ${minutes} min`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `há ${hours} h`;
	return formatDateTime(isoDate);
}

export function summarizeItems(items: { quantity: number; product: { name: string } }[]) {
	return items.map((item) => `${item.quantity}× ${item.product.name}`).join(', ');
}
