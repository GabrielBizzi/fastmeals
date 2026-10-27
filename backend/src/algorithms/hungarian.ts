export type CostMatrix = readonly (readonly number[])[];

export const UNASSIGNED = -1;

function assertRectangular(cost: CostMatrix): number {
	const columns = cost[0]?.length ?? 0;
	for (const row of cost) {
		if (row.length !== columns) {
			throw new Error('Cost matrix rows must have the same length');
		}
		for (const value of row) {
			if (!Number.isFinite(value)) {
				throw new Error('Cost matrix values must be finite numbers');
			}
		}
	}
	return columns;
}

function solveRowsNotExceedingColumns(cost: CostMatrix, columns: number): number[] {
	const rows = cost.length;
	const rowPotential = new Float64Array(rows + 1);
	const columnPotential = new Float64Array(columns + 1);
	const rowOfColumn = new Int32Array(columns + 1);
	const previousColumn = new Int32Array(columns + 1);

	for (let row = 1; row <= rows; row++) {
		rowOfColumn[0] = row;
		let currentColumn = 0;
		const minSlack = new Float64Array(columns + 1).fill(Infinity);
		const visited = new Uint8Array(columns + 1);

		do {
			visited[currentColumn] = 1;
			const currentRow = rowOfColumn[currentColumn];
			let delta = Infinity;
			let nextColumn = 0;

			for (let column = 1; column <= columns; column++) {
				if (visited[column]) continue;
				const slack =
					cost[currentRow - 1][column - 1] -
					rowPotential[currentRow] -
					columnPotential[column];
				if (slack < minSlack[column]) {
					minSlack[column] = slack;
					previousColumn[column] = currentColumn;
				}
				if (minSlack[column] < delta) {
					delta = minSlack[column];
					nextColumn = column;
				}
			}

			for (let column = 0; column <= columns; column++) {
				if (visited[column]) {
					rowPotential[rowOfColumn[column]] += delta;
					columnPotential[column] -= delta;
				} else {
					minSlack[column] -= delta;
				}
			}
			currentColumn = nextColumn;
		} while (rowOfColumn[currentColumn] !== 0);

		do {
			const column = previousColumn[currentColumn];
			rowOfColumn[currentColumn] = rowOfColumn[column];
			currentColumn = column;
		} while (currentColumn !== 0);
	}

	const columnOfRow = new Array<number>(rows).fill(UNASSIGNED);
	for (let column = 1; column <= columns; column++) {
		if (rowOfColumn[column] !== 0) {
			columnOfRow[rowOfColumn[column] - 1] = column - 1;
		}
	}
	return columnOfRow;
}

export function solveMinimumCostAssignment(cost: CostMatrix): number[] {
	const rows = cost.length;
	if (rows === 0) return [];

	const columns = assertRectangular(cost);
	if (columns === 0) return new Array<number>(rows).fill(UNASSIGNED);

	if (rows <= columns) {
		return solveRowsNotExceedingColumns(cost, columns);
	}

	const transposed = Array.from({ length: columns }, (_, column) =>
		cost.map((row) => row[column]),
	);
	const rowOfColumn = solveRowsNotExceedingColumns(transposed, rows);
	const columnOfRow = new Array<number>(rows).fill(UNASSIGNED);
	rowOfColumn.forEach((row, column) => {
		if (row !== UNASSIGNED) columnOfRow[row] = column;
	});
	return columnOfRow;
}
