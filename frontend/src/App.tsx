import { Box, LinearProgress } from '@mui/material';
import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '@/layout';
import { RedirectIfAuthenticated, RequireAdmin, RequireAuth } from '@/routes/guards';
import { ROUTES } from '@/routes/paths';
import Login from '@/screens/Login';

const Orders = lazy(() => import('@/screens/Orders'));
const Dispatch = lazy(() => import('@/screens/Dispatch'));
const Products = lazy(() => import('@/screens/Products'));
const DeliveryPersons = lazy(() => import('@/screens/DeliveryPersons'));
const Reports = lazy(() => import('@/screens/Reports'));
const NotFound = lazy(() => import('@/screens/NotFound'));

function Screen({ children }: { children: ReactNode }) {
	return (
		<Suspense
			fallback={
				<Box role="status" aria-label="Carregando tela">
					<LinearProgress />
				</Box>
			}
		>
			{children}
		</Suspense>
	);
}

export default function App() {
	return (
		<Routes>
			<Route
				path={ROUTES.login}
				element={
					<RedirectIfAuthenticated>
						<Login />
					</RedirectIfAuthenticated>
				}
			/>
			<Route element={<RequireAuth />}>
				<Route element={<AppLayout />}>
					<Route index element={<Navigate to={ROUTES.orders} replace />} />
					<Route path={ROUTES.orders} element={<Screen><Orders /></Screen>} />
					<Route
						path={ROUTES.dispatch}
						element={
							<RequireAdmin>
								<Screen>
									<Dispatch />
								</Screen>
							</RequireAdmin>
						}
					/>
					<Route path={ROUTES.products} element={<Screen><Products /></Screen>} />
					<Route path={ROUTES.deliveryPersons} element={<Screen><DeliveryPersons /></Screen>} />
					<Route path={ROUTES.reports} element={<Screen><Reports /></Screen>} />
					<Route path="*" element={<Screen><NotFound /></Screen>} />
				</Route>
			</Route>
		</Routes>
	);
}
