import { TextField, type TextFieldProps } from '@mui/material';
import {
	Controller,
	type Control,
	type FieldValues,
	type Path,
} from 'react-hook-form';

type FormTextFieldProps<T extends FieldValues> = Omit<
	TextFieldProps,
	'name' | 'value' | 'onChange' | 'error'
> & {
	control: Control<T>;
	name: Path<T>;
	transform?: (value: string) => string;
};

export function FormTextField<T extends FieldValues>({
	control,
	name,
	helperText,
	transform,
	...props
}: FormTextFieldProps<T>) {
	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<TextField
					{...props}
					name={field.name}
					inputRef={field.ref}
					value={field.value ?? ''}
					onBlur={field.onBlur}
					onChange={(event) =>
						field.onChange(
							transform ? transform(event.target.value) : event.target.value,
						)
					}
					error={Boolean(fieldState.error)}
					helperText={fieldState.error?.message ?? helperText}
				/>
			)}
		/>
	);
}
