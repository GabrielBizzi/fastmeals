const UNIT_IN_SECONDS = {
	s: 1,
	m: 60,
	h: 3600,
	d: 86_400,
} as const;

type DurationUnit = keyof typeof UNIT_IN_SECONDS;

function isDurationUnit(value: string): value is DurationUnit {
	return value in UNIT_IN_SECONDS;
}

export function durationToSeconds(duration: string): number {
	const match = /^(\d+)([smhd])$/.exec(duration.trim());
	if (!match || !isDurationUnit(match[2])) {
		throw new Error(`Invalid duration "${duration}". Use formats like 15m or 7d.`);
	}
	return Number(match[1]) * UNIT_IN_SECONDS[match[2]];
}
