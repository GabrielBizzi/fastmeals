import type { AddressInfo } from 'node:net';
import { performance } from 'node:perf_hooks';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { signAccessToken } from '../src/modules/auth/token.service';

const RUNS = 30;

type Scenario = {
	name: string;
	method: 'GET' | 'POST';
	path: string;
	budgetMs: number;
};

const SCENARIOS: Scenario[] = [
	{ name: 'products page 1', method: 'GET', path: '/api/products', budgetMs: 200 },
	{ name: 'products search', method: 'GET', path: '/api/products?search=volume%200999', budgetMs: 200 },
	{ name: 'products filtered', method: 'GET', path: '/api/products?category=drink&isAvailable=true&sortBy=price&sortOrder=asc', budgetMs: 200 },
	{ name: 'products deep page', method: 'GET', path: '/api/products?page=400&limit=20', budgetMs: 200 },
	{ name: 'orders page 1', method: 'GET', path: '/api/orders', budgetMs: 200 },
	{ name: 'orders by status', method: 'GET', path: '/api/orders?status=delivered&limit=50', budgetMs: 200 },
	{ name: 'orders by total', method: 'GET', path: '/api/orders?sortBy=totalAmount&sortOrder=desc', budgetMs: 200 },
	{ name: 'orders deep page', method: 'GET', path: '/api/orders?page=450&limit=20', budgetMs: 200 },
	{ name: 'optimize 50x30', method: 'POST', path: '/api/orders/optimize-assignment', budgetMs: 2000 },
];

function percentile(sorted: number[], ratio: number) {
	return sorted[Math.min(sorted.length - 1, Math.ceil(ratio * sorted.length) - 1)];
}

async function main() {
	const admin = await prisma.user.findFirstOrThrow({ where: { role: 'admin' } });
	const headers = { Authorization: `Bearer ${signAccessToken(admin.id, admin.role)}` };
	const server = createApp({ rateLimitPerMinute: 1_000_000 }).listen(0);
	const { port } = server.address() as AddressInfo;
	const baseUrl = `http://127.0.0.1:${port}`;
	const rows: Record<string, string | number>[] = [];

	try {
		for (const scenario of SCENARIOS) {
			const timings: number[] = [];
			let extra = '';
			for (let run = 0; run < RUNS + 3; run++) {
				const startedAt = performance.now();
				const response = await fetch(`${baseUrl}${scenario.path}`, {
					method: scenario.method,
					headers,
				});
				const body: unknown = await response.json();
				const elapsed = performance.now() - startedAt;
				if (!response.ok) throw new Error(`${scenario.name} returned ${response.status}`);
				if (run >= 3) timings.push(elapsed);
				if (
					typeof body === 'object' &&
					body !== null &&
					'executionTimeMs' in body &&
					'assignments' in body &&
					Array.isArray(body.assignments)
				) {
					extra = `${body.assignments.length} assignments, algorithm ${String(body.executionTimeMs)} ms`;
				}
			}
			timings.sort((a, b) => a - b);
			const p95 = percentile(timings, 0.95);
			rows.push({
				scenario: scenario.name,
				p50Ms: Number(percentile(timings, 0.5).toFixed(1)),
				p95Ms: Number(p95.toFixed(1)),
				maxMs: Number(timings[timings.length - 1].toFixed(1)),
				budgetMs: scenario.budgetMs,
				withinBudget: p95 < scenario.budgetMs ? 'yes' : 'NO',
				...(extra ? { notes: extra } : {}),
			});
		}
	} finally {
		server.close();
		await prisma.$disconnect();
	}

	process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
	if (rows.some((row) => row.withinBudget === 'NO')) process.exitCode = 1;
}

main().catch((error: unknown) => {
	process.stderr.write(`Benchmark failed: ${String(error)}\n`);
	process.exitCode = 1;
});
