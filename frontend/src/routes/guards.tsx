import { Box, CircularProgress } from '@mui/material';
import type { PropsWithChildren } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/context/auth.context';
import { ROUTES } from './paths';

function SessionCheck() {
	return (
		<Box
			role="status"
			aria-label="Verificando sua sessão"
			sx={{ display: 'grid', placeItems: 'center', height: '100vh' }}
		>
			<CircularProgress size={28} />
		</Box>
	);
}

export function RequireAuth() {
	const { status } = useAuth();
	const location = useLocation();

	if (status === 'checking') return <SessionCheck />;
	if (status === 'anonymous') {
		return (
			<Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />
		);
	}
	return <Outlet />;
}

export function RedirectIfAuthenticated({ children }: PropsWithChildren) {
	const { status } = useAuth();

	if (status === 'checking') return <SessionCheck />;
	if (status === 'authenticated')
		return <Navigate to={ROUTES.orders} replace />;
	return children;
}

export function RequireAdmin({ children }: PropsWithChildren) {
	const { isAdmin } = useAuth();

	if (!isAdmin) {
		return (
			<EmptyState
				title="Área restrita a administradores"
				description="Seu perfil permite consultar pedidos, produtos e relatórios. Peça a um administrador para fazer o despacho."
			/>
		);
	}
	return children;
}
