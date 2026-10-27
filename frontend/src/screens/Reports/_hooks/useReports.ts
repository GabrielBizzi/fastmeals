import dayjs from 'dayjs';
import { useState } from 'react';
import { useRemoteData } from '@/hooks/useRemoteData';
import { getReportsBundle, type ReportPeriod } from '@/services/reports';

export const PERIOD_PRESETS = [
	{ key: '7d', label: '7 dias', days: 7 },
	{ key: '30d', label: '30 dias', days: 30 },
	{ key: '90d', label: '90 dias', days: 90 },
] as const;

export type PeriodPresetKey = (typeof PERIOD_PRESETS)[number]['key'] | 'custom';

export function periodForLastDays(days: number, today = dayjs()): ReportPeriod {
	return {
		startDate: today.subtract(days - 1, 'day').format('YYYY-MM-DD'),
		endDate: today.format('YYYY-MM-DD'),
	};
}

export function isValidPeriod({ startDate, endDate }: ReportPeriod) {
	return Boolean(startDate && endDate && startDate <= endDate);
}

export function useReports() {
	const [preset, setPreset] = useState<PeriodPresetKey>('30d');
	const [period, setPeriod] = useState<ReportPeriod>(() => periodForLastDays(30));
	const valid = isValidPeriod(period);

	const reports = useRemoteData((signal) => getReportsBundle(period, signal), JSON.stringify(period), {
		enabled: valid,
	});

	const selectPreset = (key: PeriodPresetKey) => {
		setPreset(key);
		const match = PERIOD_PRESETS.find((option) => option.key === key);
		if (match) setPeriod(periodForLastDays(match.days));
	};

	const updatePeriod = (patch: Partial<ReportPeriod>) => {
		setPreset('custom');
		setPeriod((current) => ({ ...current, ...patch }));
	};

	return { preset, period, valid, reports, selectPreset, updatePeriod };
}
