import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	type PropsWithChildren,
} from 'react';
import * as authService from '@/services/auth';
import type { Credentials, SessionUser } from '@/services/auth';
import { useAuthStore, type SessionStatus } from '@/stores/auth';

type AuthContextValue = {
	status: SessionStatus;
	user: SessionUser | null;
	isAdmin: boolean;
	sessionExpired: boolean;
	signIn(credentials: Credentials): Promise<void>;
	signOut(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
	const status = useAuthStore((state) => state.status);
	const user = useAuthStore((state) => state.user);
	const sessionExpired = useAuthStore((state) => state.sessionExpired);
	const setSession = useAuthStore((state) => state.setSession);
	const clearSession = useAuthStore((state) => state.clearSession);

	useEffect(() => {
		if (useAuthStore.getState().status !== 'checking') return;
		let cancelled = false;
		authService
			.restoreSession()
			.then((session) => {
				if (!cancelled) setSession(session.accessToken, session.user);
			})
			.catch(() => {
				if (!cancelled) clearSession();
			});
		return () => {
			cancelled = true;
		};
	}, [setSession, clearSession]);

	const signIn = useCallback(
		async (credentials: Credentials) => {
			const session = await authService.login(credentials);
			setSession(session.accessToken, session.user);
		},
		[setSession],
	);

	const signOut = useCallback(async () => {
		try {
			await authService.logout();
		} finally {
			clearSession();
		}
	}, [clearSession]);

	const value = useMemo<AuthContextValue>(
		() => ({
			status,
			user,
			isAdmin: user?.role === 'admin',
			sessionExpired,
			signIn,
			signOut,
		}),
		[status, user, sessionExpired, signIn, signOut],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used inside AuthProvider');
	}
	return context;
}
