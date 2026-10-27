import { TablePagination } from '@mui/material';
import type { Pagination } from '@/services/pagination';

type TablePagerProps = {
	pagination: Pagination;
	onPageChange(page: number): void;
	onLimitChange(limit: number): void;
};

const ITEM_LABELS = {
	first: 'Primeira página',
	last: 'Última página',
	next: 'Próxima página',
	previous: 'Página anterior',
} as const;

export function TablePager({
	pagination,
	onPageChange,
	onLimitChange,
}: TablePagerProps) {
	if (pagination.total === 0) return null;

	return (
		<TablePagination
			component="div"
			count={pagination.total}
			page={Math.max(0, Math.min(pagination.page, pagination.totalPages) - 1)}
			rowsPerPage={pagination.limit}
			rowsPerPageOptions={[10, 20, 50]}
			onPageChange={(_, next) => onPageChange(next + 1)}
			onRowsPerPageChange={(event) => onLimitChange(Number(event.target.value))}
			labelRowsPerPage="Por página"
			labelDisplayedRows={({ from, to, count }) =>
				`${from} a ${to} de ${count}`
			}
			getItemAriaLabel={(type) => ITEM_LABELS[type]}
		/>
	);
}
