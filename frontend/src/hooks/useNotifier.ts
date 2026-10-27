import { useSnackbar } from 'notistack';
import { useCallback, useMemo } from 'react';
import { getUserMessage } from '@/services/errors';

export function useNotifier() {
	const { enqueueSnackbar } = useSnackbar();

	const success = useCallback(
		(message: string) => enqueueSnackbar(message, { variant: 'success' }),
		[enqueueSnackbar],
	);

	const failure = useCallback(
		(error: unknown, fallback: string) =>
			enqueueSnackbar(getUserMessage(error, fallback), { variant: 'error' }),
		[enqueueSnackbar],
	);

	return useMemo(() => ({ success, failure }), [success, failure]);
}
