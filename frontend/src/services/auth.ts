import { z } from 'zod';
import { api, refreshAccessToken } from './api';

export const userRoleSchema = z.enum(['admin', 'viewer']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const sessionUserSchema = z.object({
	id: z.string(),
	email: z.string(),
	role: userRoleSchema,
});
export type SessionUser = z.infer<typeof sessionUserSchema>;

const loginResponseSchema = z.object({
	accessToken: z.string().min(1),
	user: sessionUserSchema,
});

const meResponseSchema = z.object({ user: sessionUserSchema });

export type Credentials = {
	email: string;
	password: string;
};

export async function login(credentials: Credentials) {
	const { data } = await api.post<unknown>('/auth/login', credentials, {
		skipAuthRefresh: true,
	});
	return loginResponseSchema.parse(data);
}

export async function restoreSession() {
	const accessToken = await refreshAccessToken();
	const { data } = await api.get<unknown>('/auth/me');
	return { accessToken, user: meResponseSchema.parse(data).user };
}

export async function logout() {
	await api.post('/auth/logout', undefined, { skipAuthRefresh: true });
}
