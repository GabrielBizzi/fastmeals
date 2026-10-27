import { OrderStatus, Prisma, type VehicleType } from '@prisma/client';
import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { roundTo } from '../../utils/money';
import { eachDay, toInstantRange, type InstantRange } from '../../utils/timeZone';
import type {
	PeriodQuery,
	RevenueQuery,
	TopProductsQuery,
} from './reports.schemas';

const ORDER_STATUSES = Object.values(OrderStatus);

function createdAtFilter(range: InstantRange): Prisma.Sql {
	return Prisma.sql`
		${range.gte ? Prisma.sql`AND o.created_at >= ${range.gte}` : Prisma.empty}
		${range.lt ? Prisma.sql`AND o.created_at < ${range.lt}` : Prisma.empty}
	`;
}

function periodRange({ startDate, endDate }: PeriodQuery): InstantRange {
	return toInstantRange(startDate, endDate, env.BUSINESS_TIMEZONE);
}

type DailyRevenueRow = { day: string; revenue: number; orders: number };

export async function getRevenue({ startDate, endDate }: RevenueQuery) {
	const range = periodRange({ startDate, endDate });
	const rows = await prisma.$queryRaw<DailyRevenueRow[]>`
		SELECT
			to_char(o.created_at AT TIME ZONE ${env.BUSINESS_TIMEZONE}, 'YYYY-MM-DD') AS day,
			SUM(o.total_amount)::float8 AS revenue,
			COUNT(*)::int AS orders
		FROM orders o
		WHERE o.status = 'delivered' ${createdAtFilter(range)}
		GROUP BY day
		ORDER BY day
	`;

	const rowsByDay = new Map(rows.map((row) => [row.day, row]));
	const dailyRevenue = eachDay(startDate, endDate).map((date) => ({
		date,
		revenue: roundTo(rowsByDay.get(date)?.revenue ?? 0, 2),
		orders: rowsByDay.get(date)?.orders ?? 0,
	}));

	const totalRevenue = roundTo(
		rows.reduce((sum, row) => sum + row.revenue, 0),
		2,
	);
	const totalOrders = rows.reduce((sum, row) => sum + row.orders, 0);

	return {
		startDate,
		endDate,
		totalRevenue,
		totalOrders,
		averageOrderValue:
			totalOrders === 0 ? 0 : roundTo(totalRevenue / totalOrders, 2),
		dailyRevenue,
	};
}

export async function getOrdersByStatus(query: PeriodQuery) {
	const range = periodRange(query);
	const groups = await prisma.order.groupBy({
		by: ['status'],
		where: range.gte || range.lt ? { createdAt: range } : {},
		_count: { _all: true },
	});

	const countByStatus = new Map(
		groups.map((group) => [group.status, group._count._all]),
	);
	const data = ORDER_STATUSES.map((status) => ({
		status,
		count: countByStatus.get(status) ?? 0,
	}));

	return {
		data,
		total: data.reduce((sum, entry) => sum + entry.count, 0),
	};
}

type TopProductRow = {
	productId: string;
	productName: string;
	totalQuantity: number;
	totalRevenue: number;
};

export async function getTopProducts(query: TopProductsQuery) {
	const rows = await prisma.$queryRaw<TopProductRow[]>`
		SELECT
			p.id AS "productId",
			p.name AS "productName",
			SUM(oi.quantity)::int AS "totalQuantity",
			SUM(oi.quantity * oi.unit_price)::float8 AS "totalRevenue"
		FROM order_items oi
		JOIN orders o ON o.id = oi.order_id
		JOIN products p ON p.id = oi.product_id
		WHERE o.status = 'delivered' ${createdAtFilter(periodRange(query))}
		GROUP BY p.id, p.name
		ORDER BY "totalQuantity" DESC, "totalRevenue" DESC, p.name ASC
		LIMIT ${query.limit}
	`;

	return {
		data: rows.map((row) => ({
			...row,
			totalRevenue: roundTo(row.totalRevenue, 2),
		})),
	};
}

type DeliveryTimeRow = {
	vehicleType: VehicleType | null;
	isOverall: boolean;
	averageMinutes: number | null;
	fastestMinutes: number | null;
	slowestMinutes: number | null;
	count: number;
};

export async function getAverageDeliveryTime(query: PeriodQuery) {
	const rows = await prisma.$queryRaw<DeliveryTimeRow[]>`
		WITH delivered AS (
			SELECT
				dp.vehicle_type,
				EXTRACT(EPOCH FROM (h.changed_at - o.created_at)) / 60 AS minutes
			FROM orders o
			JOIN LATERAL (
				SELECT changed_at
				FROM order_status_history
				WHERE order_id = o.id AND to_status = 'delivered'
				ORDER BY changed_at DESC
				LIMIT 1
			) h ON TRUE
			LEFT JOIN delivery_persons dp ON dp.id = o.delivery_person_id
			WHERE o.status = 'delivered' ${createdAtFilter(periodRange(query))}
		)
		SELECT
			vehicle_type AS "vehicleType",
			GROUPING(vehicle_type) = 1 AS "isOverall",
			AVG(minutes)::float8 AS "averageMinutes",
			MIN(minutes)::float8 AS "fastestMinutes",
			MAX(minutes)::float8 AS "slowestMinutes",
			COUNT(*)::int AS count
		FROM delivered
		GROUP BY GROUPING SETS ((), (vehicle_type))
	`;

	const overall = rows.find((row) => row.isOverall);
	const round = (value: number | null | undefined) =>
		value === null || value === undefined ? 0 : roundTo(value, 1);

	return {
		averageMinutes: round(overall?.averageMinutes),
		fastestMinutes: round(overall?.fastestMinutes),
		slowestMinutes: round(overall?.slowestMinutes),
		totalDelivered: overall?.count ?? 0,
		byVehicleType: rows
			.filter(
				(row): row is DeliveryTimeRow & { vehicleType: VehicleType } =>
					!row.isOverall && row.vehicleType !== null,
			)
			.sort(
				(a, b) =>
					b.count - a.count || a.vehicleType.localeCompare(b.vehicleType),
			)
			.map((row) => ({
				vehicleType: row.vehicleType,
				averageMinutes: round(row.averageMinutes),
				count: row.count,
			})),
	};
}
