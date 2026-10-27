import type { DeliveryPerson } from '@/services/deliveryPersons';
import type { AssignmentPlan, Order } from '@/services/orders';
import { colors } from '@/styles/tokens';
import { Sketch } from './styles';

type RouteSketchProps = {
	orders: Order[];
	couriers: DeliveryPerson[];
	plan: AssignmentPlan | null;
	hiddenOrderIds: ReadonlySet<string>;
};

type Point = { id: string; latitude: number; longitude: number };

const WIDTH = 480;
const HEIGHT = 300;
const PADDING = 24;

function createProjection(points: Point[]) {
	const latitudes = points.map((point) => point.latitude);
	const longitudes = points.map((point) => point.longitude);
	const minLat = Math.min(...latitudes);
	const maxLat = Math.max(...latitudes);
	const minLng = Math.min(...longitudes);
	const maxLng = Math.max(...longitudes);
	const midLatRadians = (((minLat + maxLat) / 2) * Math.PI) / 180;
	const spanX = Math.max((maxLng - minLng) * Math.cos(midLatRadians), 0.002);
	const spanY = Math.max(maxLat - minLat, 0.002);
	const scale = Math.min((WIDTH - PADDING * 2) / spanX, (HEIGHT - PADDING * 2) / spanY);
	const offsetX = (WIDTH - spanX * scale) / 2;
	const offsetY = (HEIGHT - spanY * scale) / 2;

	return (point: Point) => ({
		x: offsetX + (point.longitude - minLng) * Math.cos(midLatRadians) * scale,
		y: offsetY + (maxLat - point.latitude) * scale,
	});
}

export function RouteSketch({ orders, couriers, plan, hiddenOrderIds }: RouteSketchProps) {
	const orderPoints = orders.map((order) => ({
		id: order.id,
		latitude: order.latitude,
		longitude: order.longitude,
	}));
	const courierPoints = couriers.flatMap((courier) =>
		courier.currentLatitude !== null && courier.currentLongitude !== null
			? [{ id: courier.id, latitude: courier.currentLatitude, longitude: courier.currentLongitude }]
			: [],
	);
	const allPoints = [...orderPoints, ...courierPoints];

	if (allPoints.length === 0) return null;

	const project = createProjection(allPoints);
	const orderById = new Map(orderPoints.map((point) => [point.id, project(point)]));
	const courierById = new Map(courierPoints.map((point) => [point.id, project(point)]));
	const links = (plan?.assignments ?? []).flatMap((assignment) => {
		const from = courierById.get(assignment.deliveryPersonId);
		const to = orderById.get(assignment.orderId);
		return from && to && !hiddenOrderIds.has(assignment.orderId)
			? [{ key: assignment.orderId, from, to }]
			: [];
	});

	return (
		<Sketch>
			<svg
				viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
				role="img"
				aria-label={`Mapa esquemático com ${orderPoints.length} pedidos prontos e ${courierPoints.length} entregadores livres${links.length ? `, ligados pelas ${links.length} atribuições sugeridas` : ''}.`}
			>
				{links.map((link) => (
					<line
						key={link.key}
						x1={link.from.x}
						y1={link.from.y}
						x2={link.to.x}
						y2={link.to.y}
						stroke={colors.route}
						strokeWidth={2}
						strokeDasharray="5 4"
					/>
				))}
				{[...orderById.entries()].map(([id, point]) => (
					<rect
						key={id}
						x={point.x - 6}
						y={point.y - 6}
						width={12}
						height={12}
						rx={2}
						fill={colors.surface}
						stroke={colors.asphalt}
						strokeWidth={2}
					/>
				))}
				{[...courierById.entries()].map(([id, point]) => (
					<circle key={id} cx={point.x} cy={point.y} r={6} fill={colors.basil} />
				))}
			</svg>
			<ul className="legend">
				<li>
					<span className="order" aria-hidden />
					Pedido pronto
				</li>
				<li>
					<span className="courier" aria-hidden />
					Entregador livre
				</li>
				<li>
					<span className="link" aria-hidden />
					Atribuição sugerida
				</li>
			</ul>
		</Sketch>
	);
}
