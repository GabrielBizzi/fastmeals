const MS_PER_DAY = 86_400_000;

function getTimeZoneOffsetMs(instant: Date, timeZone: string): number {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		hourCycle: 'h23',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	}).formatToParts(instant);

	const value = (type: Intl.DateTimeFormatPartTypes) =>
		Number(parts.find((part) => part.type === type)?.value);

	const wallClockAsUtc = Date.UTC(
		value('year'),
		value('month') - 1,
		value('day'),
		value('hour'),
		value('minute'),
		value('second'),
	);
	return wallClockAsUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

export function startOfDayInTimeZone(isoDate: string, timeZone: string): Date {
	const [year, month, day] = isoDate.split('-').map(Number);
	const midnightAsUtc = Date.UTC(year, month - 1, day);
	const firstGuess =
		midnightAsUtc - getTimeZoneOffsetMs(new Date(midnightAsUtc), timeZone);
	const corrected =
		midnightAsUtc - getTimeZoneOffsetMs(new Date(firstGuess), timeZone);
	return new Date(corrected);
}

export function addDays(isoDate: string, days: number): string {
	const date = new Date(`${isoDate}T00:00:00Z`);
	return new Date(date.getTime() + days * MS_PER_DAY)
		.toISOString()
		.slice(0, 10);
}

export function eachDay(startDate: string, endDate: string): string[] {
	const days: string[] = [];
	for (let day = startDate; day <= endDate; day = addDays(day, 1)) {
		days.push(day);
	}
	return days;
}

export function daysBetween(startDate: string, endDate: string): number {
	return Math.round(
		(Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) /
			MS_PER_DAY,
	);
}

export type InstantRange = { gte?: Date; lt?: Date };

export function toInstantRange(
	startDate: string | undefined,
	endDate: string | undefined,
	timeZone: string,
): InstantRange {
	return {
		...(startDate ? { gte: startOfDayInTimeZone(startDate, timeZone) } : {}),
		...(endDate
			? { lt: startOfDayInTimeZone(addDays(endDate, 1), timeZone) }
			: {}),
	};
}
