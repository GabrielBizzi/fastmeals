import { MenuItem, TextField, type TextFieldProps } from '@mui/material';
import {
	Controller,
	type Control,
	type FieldValues,
	type Path,
} from 'react-hook-form';

export type SelectOption<V extends string> = {
	value: V;
	label: string;
};

type FormSelectFieldProps<T extends FieldValues, V extends string> = Omit<
	TextFieldProps,
	'name' | 'value' | 'onChange' | 'error' | 'select'
> & {
	control: Control<T>;
	name: Path<T>;
	options: SelectOption<V>[];
};

export function FormSelectField<T extends FieldValues, V extends string>({
	control,
	name,
	options,
	helperText,
	...props
}: FormSelectFieldProps<T, V>) {
	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<TextField
					{...props}
					select
					name={field.name}
					inputRef={field.ref}
					value={field.value ?? ''}
					onBlur={field.onBlur}
					onChange={field.onChange}
					error={Boolean(fieldState.error)}
					helperText={fieldState.error?.message ?? helperText}
				>
					{options.map((option) => (
						<MenuItem key={option.value} value={option.value}>
							{option.label}
						</MenuItem>
					))}
				</TextField>
			)}
		/>
	);
}
