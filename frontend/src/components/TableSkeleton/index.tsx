import { Skeleton, TableCell, TableRow } from '@mui/material';

type TableSkeletonProps = {
	rows?: number;
	columns: number;
};

export function TableSkeleton({ rows = 6, columns }: TableSkeletonProps) {
	return (
		<>
			{Array.from({ length: rows }, (_, row) => (
				<TableRow key={row} aria-hidden>
					{Array.from({ length: columns }, (_, column) => (
						<TableCell key={column}>
							<Skeleton width={column === 0 ? '70%' : '50%'} height={20} />
						</TableCell>
					))}
				</TableRow>
			))}
		</>
	);
}
