import { useCallback, useEffect, useRef, useState } from 'react';

type RemoteDataState<T> =
	| { status: 'loading'; data: T | null; error: null }
	| { status: 'success'; data: T; error: null }
	| { status: 'error'; data: T | null; error: unknown };

export type RemoteData<T> = RemoteDataState<T> & {
	isRefreshing: boolean;
	lastUpdatedAt: Date | null;
	reload(): Promise<void>;
};

type Options = {
	pollIntervalMs?: number;
	enabled?: boolean;
};

export function useRemoteData<T>(
	fetcher: (signal: AbortSignal) => Promise<T>,
	key: string,
	{ pollIntervalMs, enabled = true }: Options = {},
): RemoteData<T> {
	const [state, setState] = useState<RemoteDataState<T>>({
		status: 'loading',
		data: null,
		error: null,
	});
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
	const fetcherRef = useRef(fetcher);
	const controllerRef = useRef<AbortController | null>(null);

	useEffect(() => {
		fetcherRef.current = fetcher;
	});

	const run = useCallback(async (mode: 'initial' | 'background') => {
		controllerRef.current?.abort();
		const controller = new AbortController();
		controllerRef.current = controller;

		if (mode === 'initial') {
			setState((previous) => ({
				status: 'loading',
				data: previous.data,
				error: null,
			}));
		} else {
			setIsRefreshing(true);
		}

		try {
			const data = await fetcherRef.current(controller.signal);
			if (controller.signal.aborted) return;
			setState({ status: 'success', data, error: null });
			setLastUpdatedAt(new Date());
		} catch (error) {
			if (controller.signal.aborted) return;
			setState((previous) => ({ status: 'error', data: previous.data, error }));
		} finally {
			if (!controller.signal.aborted) setIsRefreshing(false);
		}
	}, []);

	useEffect(() => {
		if (!enabled) return;
		void run('initial');
		return () => controllerRef.current?.abort();
	}, [key, enabled, run]);

	useEffect(() => {
		if (!enabled || !pollIntervalMs) return;

		const tick = () => {
			if (document.visibilityState === 'visible') void run('background');
		};
		const onVisibilityChange = () => {
			if (document.visibilityState === 'visible') void run('background');
		};

		const interval = window.setInterval(tick, pollIntervalMs);
		document.addEventListener('visibilitychange', onVisibilityChange);
		return () => {
			window.clearInterval(interval);
			document.removeEventListener('visibilitychange', onVisibilityChange);
		};
	}, [enabled, pollIntervalMs, run, key]);

	const reload = useCallback(() => run('background'), [run]);

	return { ...state, isRefreshing, lastUpdatedAt, reload };
}
