import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { z } from 'zod';
import { useAuthStore } from '@/stores/auth';
import { ENV } from '@/utils/env';

declare module 'axios' {
	interface AxiosRequestConfig {
		skipAuthRefresh?: boolean;
		retriedAfterRefresh?: boolean;
	}
}

const REFRESHABLE_ERROR_CODES = new Set(['TOKEN_EXPIRED', 'INVALID_TOKEN']);

const refreshResponseSchema = z.object({ accessToken: z.string().min(1) });

const errorCodeSchema = z.object({ error: z.object({ code: z.string() }) });

export const api = axios.create({
	baseURL: ENV.API_URL,
	withCredentials: true,
	headers: {
		'Content-Type': 'application/json',
		Accept: 'application/json',
	},
});

let refreshInFlight: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
	refreshInFlight ??= api
		.post<unknown>('/auth/refresh', undefined, { skipAuthRefresh: true })
		.then(({ data }) => {
			const { accessToken } = refreshResponseSchema.parse(data);
			useAuthStore.getState().setAccessToken(accessToken);
			return accessToken;
		})
		.finally(() => {
			refreshInFlight = null;
		});
	return refreshInFlight;
}

function shouldRefresh(error: AxiosError): boolean {
	const config = error.config;
	if (!config || config.skipAuthRefresh || config.retriedAfterRefresh) return false;
	if (error.response?.status !== 401) return false;
	const body = errorCodeSchema.safeParse(error.response.data);
	return body.success && REFRESHABLE_ERROR_CODES.has(body.data.error.code);
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
	const token = useAuthStore.getState().accessToken;
	if (token && !config.skipAuthRefresh) {
		config.headers.set('Authorization', `Bearer ${token}`);
	}
	return config;
});

api.interceptors.response.use(undefined, async (error: unknown) => {
	if (!(error instanceof AxiosError) || !shouldRefresh(error) || !error.config) {
		throw error;
	}

	const originalRequest = error.config;
	try {
		const token = await refreshAccessToken();
		originalRequest.retriedAfterRefresh = true;
		originalRequest.headers.set('Authorization', `Bearer ${token}`);
		return await api.request(originalRequest);
	} catch (refreshError) {
		if (refreshError instanceof AxiosError && refreshError.config?.skipAuthRefresh) {
			useAuthStore.getState().expireSession();
		}
		throw refreshError;
	}
});
