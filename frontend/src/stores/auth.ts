import { create } from 'zustand';
import type { SessionUser } from '@/services/auth';

export type SessionStatus = 'checking' | 'authenticated' | 'anonymous';

export type AuthStore = {
	status: SessionStatus;
	accessToken: string | null;
	user: SessionUser | null;
	sessionExpired: boolean;
	setSession(accessToken: string, user: SessionUser): void;
	setAccessToken(accessToken: string): void;
	clearSession(): void;
	expireSession(): void;
};

export const useAuthStore = create<AuthStore>((set) => ({
	status: 'checking',
	accessToken: null,
	user: null,
	sessionExpired: false,
	setSession: (accessToken, user) =>
		set({ status: 'authenticated', accessToken, user, sessionExpired: false }),
	setAccessToken: (accessToken) => set({ accessToken }),
	clearSession: () =>
		set({ status: 'anonymous', accessToken: null, user: null, sessionExpired: false }),
	expireSession: () =>
		set((state) => ({
			status: 'anonymous',
			accessToken: null,
			user: null,
			sessionExpired: state.status === 'authenticated',
		})),
}));
