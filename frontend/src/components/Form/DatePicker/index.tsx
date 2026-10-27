import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';

const ISO_DATE = 'YYYY-MM-DD';
const WEEKDAY_INITIALS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

type DatePickerProps = {
	label: string;
	value: string | undefined;
	onChange(value: string | undefined): void;
	minDate?: string;
	maxDate?: string;
	clearable?: boolean;
	width?: number;
};

function toDayjs(value: string | undefined): Dayjs | null {
	return value ? dayjs(value) : null;
}

export function DatePicker({
	label,
	value,
	onChange,
	minDate,
	maxDate,
	clearable = true,
	width = 190,
}: DatePickerProps) {
	const [draft, setDraft] = useState<Dayjs | null>(() => toDayjs(value));

	useEffect(() => {
		setDraft((current) => {
			const currentIso = current?.isValid()
				? current.format(ISO_DATE)
				: undefined;
			return currentIso === value ? current : toDayjs(value);
		});
	}, [value]);

	const handleChange = (next: Dayjs | null) => {
		setDraft(next);
		if (next === null) {
			onChange(undefined);
		} else if (next.isValid()) {
			onChange(next.format(ISO_DATE));
		}
	};

	return (
		<MuiDatePicker
			label={label}
			value={draft}
			onChange={handleChange}
			format="DD/MM/YYYY"
			dayOfWeekFormatter={(day) => WEEKDAY_INITIALS[day.day()]}
			minDate={toDayjs(minDate) ?? undefined}
			maxDate={toDayjs(maxDate) ?? undefined}
			slotProps={{
				textField: { size: 'small', sx: { width } },
				field: { clearable },
			}}
		/>
	);
}
