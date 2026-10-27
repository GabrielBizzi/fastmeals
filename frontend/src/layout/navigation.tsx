import AltRouteOutlined from '@mui/icons-material/AltRouteOutlined';
import InsightsOutlined from '@mui/icons-material/InsightsOutlined';
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';
import RestaurantMenuOutlined from '@mui/icons-material/RestaurantMenuOutlined';
import TwoWheelerOutlined from '@mui/icons-material/TwoWheelerOutlined';
import type { SvgIconComponent } from '@mui/icons-material';
import { ROUTES } from '@/routes/paths';

export type NavigationItem = {
	label: string;
	path: string;
	Icon: SvgIconComponent;
	adminOnly?: boolean;
};

export const NAVIGATION: NavigationItem[] = [
	{ label: 'Pedidos', path: ROUTES.orders, Icon: ReceiptLongOutlined },
	{
		label: 'Despacho',
		path: ROUTES.dispatch,
		Icon: AltRouteOutlined,
		adminOnly: true,
	},
	{ label: 'Cardápio', path: ROUTES.products, Icon: RestaurantMenuOutlined },
	{
		label: 'Entregadores',
		path: ROUTES.deliveryPersons,
		Icon: TwoWheelerOutlined,
	},
	{ label: 'Relatórios', path: ROUTES.reports, Icon: InsightsOutlined },
];
