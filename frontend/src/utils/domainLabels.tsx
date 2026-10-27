import BlockOutlined from '@mui/icons-material/BlockOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import DeliveryDiningOutlined from '@mui/icons-material/DeliveryDiningOutlined';
import DirectionsCarOutlined from '@mui/icons-material/DirectionsCarOutlined';
import PedalBikeOutlined from '@mui/icons-material/PedalBikeOutlined';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import SoupKitchenOutlined from '@mui/icons-material/SoupKitchenOutlined';
import TakeoutDiningOutlined from '@mui/icons-material/TakeoutDiningOutlined';
import TwoWheelerOutlined from '@mui/icons-material/TwoWheelerOutlined';
import type { SvgIconComponent } from '@mui/icons-material';
import { vehicleTypeSchema, type OrderStatus, type VehicleType } from '@/services/orders';
import { productCategorySchema, type ProductCategory } from '@/services/products';

type StatusPresentation = {
	label: string;
	Icon: SvgIconComponent;
};

export const ORDER_STATUS_PRESENTATION: Record<OrderStatus, StatusPresentation> = {
	pending: { label: 'Pendente', Icon: ScheduleOutlined },
	preparing: { label: 'Em preparo', Icon: SoupKitchenOutlined },
	ready: { label: 'Pronto', Icon: TakeoutDiningOutlined },
	delivering: { label: 'Em entrega', Icon: DeliveryDiningOutlined },
	delivered: { label: 'Entregue', Icon: CheckCircleOutline },
	cancelled: { label: 'Cancelado', Icon: BlockOutlined },
};

export const ORDER_STATUS_ORDER: OrderStatus[] = [
	'pending',
	'preparing',
	'ready',
	'delivering',
	'delivered',
	'cancelled',
];

export const ORDER_LIFECYCLE: OrderStatus[] = [
	'pending',
	'preparing',
	'ready',
	'delivering',
	'delivered',
];

export const TRANSITION_ACTION_LABELS: Record<OrderStatus, string> = {
	pending: 'Voltar para pendente',
	preparing: 'Iniciar preparo',
	ready: 'Marcar como pronto',
	delivering: 'Saiu para entrega',
	delivered: 'Confirmar entrega',
	cancelled: 'Cancelar pedido',
};

export const TRANSITION_SUCCESS_MESSAGES: Record<OrderStatus, string> = {
	pending: 'Pedido voltou para pendente.',
	preparing: 'Preparo iniciado.',
	ready: 'Pedido marcado como pronto.',
	delivering: 'Pedido saiu para entrega.',
	delivered: 'Entrega confirmada.',
	cancelled: 'Pedido cancelado.',
};

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
	meal: 'Prato',
	drink: 'Bebida',
	dessert: 'Sobremesa',
	side: 'Acompanhamento',
};

export const CATEGORY_OPTIONS = productCategorySchema.options.map(
	(value) => ({ value, label: CATEGORY_LABELS[value] }),
);

export const VEHICLE_PRESENTATION: Record<VehicleType, StatusPresentation> = {
	bicycle: { label: 'Bicicleta', Icon: PedalBikeOutlined },
	motorcycle: { label: 'Moto', Icon: TwoWheelerOutlined },
	car: { label: 'Carro', Icon: DirectionsCarOutlined },
};

export const VEHICLE_OPTIONS = vehicleTypeSchema.options.map(
	(value) => ({ value, label: VEHICLE_PRESENTATION[value].label }),
);
