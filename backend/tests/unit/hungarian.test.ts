import { describe, expect, it } from 'vitest';
import { solveMinimumCostAssignment, UNASSIGNED } from '../../src/algorithms/hungarian';

function createRandom(seed: number) {
	let state = seed;
	return () => {
		state = (state * 1_664_525 + 1_013_904_223) % 2 ** 32;
		return state / 2 ** 32;
	};
}

function randomMatrix(rows: number, columns: number, random: () => number) {
	return Array.from({ length: rows }, () =>
		Array.from({ length: columns }, () => Math.round(random() * 1000) / 10),
	);
}

function assignmentCost(cost: number[][], assignment: number[]) {
	return assignment.reduce(
		(sum, column, row) => (column === UNASSIGNED ? sum : sum + cost[row][column]),
		0,
	);
}

function bruteForceMinimum(cost: number[][]): number {
	const rows = cost.length;
	const columns = cost[0]?.length ?? 0;
	const pairs = Math.min(rows, columns);
	let best = Infinity;

	const explore = (row: number, usedColumns: Set<number>, assigned: number, total: number) => {
		if (assigned === pairs) {
			best = Math.min(best, total);
			return;
		}
		if (row === rows || rows - row < pairs - assigned) return;
		explore(row + 1, usedColumns, assigned, total);
		for (let column = 0; column < columns; column++) {
			if (usedColumns.has(column)) continue;
			usedColumns.add(column);
			explore(row + 1, usedColumns, assigned + 1, total + cost[row][column]);
			usedColumns.delete(column);
		}
	};

	explore(0, new Set(), 0, 0);
	return best;
}

function greedyCost(cost: number[][]): number {
	const pairs = cost.flatMap((row, rowIndex) =>
		row.map((value, columnIndex) => ({ value, rowIndex, columnIndex })),
	);
	pairs.sort((a, b) => a.value - b.value);
	const usedRows = new Set<number>();
	const usedColumns = new Set<number>();
	let total = 0;
	for (const pair of pairs) {
		if (usedRows.has(pair.rowIndex) || usedColumns.has(pair.columnIndex)) continue;
		usedRows.add(pair.rowIndex);
		usedColumns.add(pair.columnIndex);
		total += pair.value;
	}
	return total;
}

describe('solveMinimumCostAssignment', () => {
	it('finds the optimum where the greedy choice is a trap', () => {
		const cost = [
			[1, 2],
			[2, 100],
		];

		const assignment = solveMinimumCostAssignment(cost);

		expect(assignment).toEqual([1, 0]);
		expect(assignmentCost(cost, assignment)).toBe(4);
		expect(greedyCost(cost)).toBe(101);
	});

	it('solves the classic 3x3 instance', () => {
		const cost = [
			[4, 1, 3],
			[2, 0, 5],
			[3, 2, 2],
		];

		expect(assignmentCost(cost, solveMinimumCostAssignment(cost))).toBe(5);
	});

	it('leaves the surplus rows unassigned when there are more rows than columns', () => {
		const cost = [[9], [1], [5]];

		expect(solveMinimumCostAssignment(cost)).toEqual([UNASSIGNED, 0, UNASSIGNED]);
	});

	it('uses each column at most once when there are more columns than rows', () => {
		const cost = [
			[5, 1, 8, 1.5],
			[6, 1.2, 7, 9],
		];

		const assignment = solveMinimumCostAssignment(cost);

		expect(new Set(assignment).size).toBe(2);
		expect(assignmentCost(cost, assignment)).toBeCloseTo(2.7);
	});

	it.each([
		[[], []],
		[[[], []], [UNASSIGNED, UNASSIGNED]],
	])('handles degenerate input %j', (cost, expected) => {
		expect(solveMinimumCostAssignment(cost)).toEqual(expected);
	});

	it('handles ties deterministically', () => {
		const cost = [
			[1, 1],
			[1, 1],
		];

		const first = solveMinimumCostAssignment(cost);

		expect(first).toEqual(solveMinimumCostAssignment(cost));
		expect(new Set(first).size).toBe(2);
	});

	it('rejects non-finite costs and ragged matrices', () => {
		expect(() => solveMinimumCostAssignment([[1, Number.NaN]])).toThrow();
		expect(() => solveMinimumCostAssignment([[1, 2], [3]])).toThrow();
	});

	it.each([
		[3, 3],
		[4, 6],
		[6, 4],
		[7, 7],
		[5, 8],
	])('matches the brute-force optimum on random %ix%i matrices', (rows, columns) => {
		const random = createRandom(rows * 31 + columns);
		for (let sample = 0; sample < 25; sample++) {
			const cost = randomMatrix(rows, columns, random);
			const assignment = solveMinimumCostAssignment(cost);
			const assignedColumns = assignment.filter((column) => column !== UNASSIGNED);

			expect(assignedColumns).toHaveLength(Math.min(rows, columns));
			expect(new Set(assignedColumns).size).toBe(assignedColumns.length);
			expect(assignmentCost(cost, assignment)).toBeCloseTo(bruteForceMinimum(cost), 6);
		}
	});

	it('solves 50 orders x 30 couriers well under the latency budget', () => {
		const cost = randomMatrix(50, 30, createRandom(2024));

		const startedAt = performance.now();
		const assignment = solveMinimumCostAssignment(cost);
		const elapsedMs = performance.now() - startedAt;

		expect(assignment.filter((column) => column !== UNASSIGNED)).toHaveLength(30);
		expect(assignmentCost(cost, assignment)).toBeLessThanOrEqual(greedyCost(cost) + 1e-9);
		expect(elapsedMs).toBeLessThan(100);
	});
});
