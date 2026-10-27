import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import MenuOutlined from '@mui/icons-material/MenuOutlined';
import { Box, Button, Drawer, IconButton, Typography } from '@mui/material';
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/auth.context';
import { colors } from '@/styles/tokens';
import { NAVIGATION } from './navigation';
import {
	Brand,
	BrandMark,
	Content,
	DesktopRail,
	Main,
	MobileBar,
	NavList,
	Rail,
	RailFooter,
	Shell,
} from './styles';

const ROLE_LABELS = { admin: 'Administrador', viewer: 'Consulta' } as const;

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
	const { user, isAdmin, signOut } = useAuth();
	const items = NAVIGATION.filter((item) => isAdmin || !item.adminOnly);

	return (
		<Rail aria-label="Navegação principal">
			<Brand>
				<BrandMark aria-hidden>F</BrandMark>
				<span>
					FastMeals
					<small>Central de operação</small>
				</span>
			</Brand>
			<NavList>
				{items.map(({ label, path, Icon }) => (
					<li key={path}>
						<NavLink to={path} onClick={onNavigate}>
							<Icon aria-hidden />
							{label}
						</NavLink>
					</li>
				))}
			</NavList>
			<RailFooter>
				{user ? (
					<Box sx={{ px: 1.25, pb: 1 }}>
						<Typography
							variant="body2"
							sx={{
								color: '#FFFFFF',
								overflow: 'hidden',
								textOverflow: 'ellipsis',
							}}
						>
							{user.email}
						</Typography>
						<Typography variant="caption" sx={{ color: colors.asphaltMuted }}>
							{ROLE_LABELS[user.role]}
						</Typography>
					</Box>
				) : null}
				<Button
					fullWidth
					startIcon={<LogoutOutlined />}
					onClick={() => void signOut()}
					sx={{
						justifyContent: 'flex-start',
						color: '#C9D2DC',
						'&:hover': { backgroundColor: colors.asphaltSoft },
					}}
				>
					Sair
				</Button>
			</RailFooter>
		</Rail>
	);
}

export default function AppLayout() {
	const [drawerOpen, setDrawerOpen] = useState(false);
	const location = useLocation();
	const current = NAVIGATION.find((item) =>
		location.pathname.startsWith(item.path),
	);

	return (
		<Shell>
			<DesktopRail>
				<Sidebar />
			</DesktopRail>
			<Drawer
				open={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				PaperProps={{ sx: { backgroundColor: colors.asphalt } }}
			>
				<Sidebar onNavigate={() => setDrawerOpen(false)} />
			</Drawer>
			<Main>
				<MobileBar>
					<IconButton
						aria-label="Abrir menu"
						onClick={() => setDrawerOpen(true)}
						sx={{ color: '#FFFFFF' }}
					>
						<MenuOutlined />
					</IconButton>
					<Typography variant="subtitle1" component="span">
						{current?.label ?? 'FastMeals'}
					</Typography>
				</MobileBar>
				<Content>
					<Outlet />
				</Content>
			</Main>
		</Shell>
	);
}
