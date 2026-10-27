import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { getFieldErrors } from '@/services/errors';

export function applyServerErrors<T extends FieldValues>(
	error: unknown,
	fields: readonly Path<T>[],
	setError: UseFormSetError<T>,
): boolean {
	const fieldErrors = getFieldErrors(error);
	let applied = false;
	for (const field of fields) {
		const message = fieldErrors[field];
		if (message) {
			setError(field, { type: 'server', message }, { shouldFocus: !applied });
			applied = true;
		}
	}
	return applied;
}
