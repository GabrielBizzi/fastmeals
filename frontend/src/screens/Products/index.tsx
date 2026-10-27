import AddOutlined from '@mui/icons-material/AddOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { Box, Button, InputAdornment, MenuItem, Paper, TextField } from '@mui/material';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { TablePager } from '@/components/TablePager';
import { useAuth } from '@/context/auth.context';
import { productCategorySchema, type Product } from '@/services/products';
import { CATEGORY_OPTIONS } from '@/utils/domainLabels';
import { ProductFormDialog } from './_components/ProductFormDialog';
import { ProductsTable } from './_components/ProductsTable';
import { useProductsCatalog } from './_hooks/useProductsCatalog';
import { Filters } from './styles';

const AVAILABILITY_FILTER = {
	all: undefined,
	available: true,
	unavailable: false,
} as const;

type AvailabilityKey = keyof typeof AVAILABILITY_FILTER;

function toAvailabilityKey(value: boolean | undefined): AvailabilityKey {
	if (value === undefined) return 'all';
	return value ? 'available' : 'unavailable';
}

function isAvailabilityKey(value: string): value is AvailabilityKey {
	return value in AVAILABILITY_FILTER;
}

export default function Products() {
	const { isAdmin } = useAuth();
	const catalog = useProductsCatalog();
	const { filters, products } = catalog;
	const [editing, setEditing] = useState<{ product: Product | null } | null>(null);
	const [deleting, setDeleting] = useState<Product | null>(null);
	const [deleteBusy, setDeleteBusy] = useState(false);

	const hasFilters = Boolean(
		filters.search.trim() || filters.category || filters.isAvailable !== undefined,
	);

	const confirmDelete = async () => {
		if (!deleting) return;
		setDeleteBusy(true);
		const removed = await catalog.removeProduct(deleting);
		setDeleteBusy(false);
		if (removed) setDeleting(null);
	};

	return (
		<>
			<PageHeader
				title="Cardápio"
				description="Produtos indisponíveis continuam aqui, mas não aparecem para os clientes."
				actions={
					isAdmin ? (
						<Button
							variant="contained"
							startIcon={<AddOutlined />}
							onClick={() => setEditing({ product: null })}
						>
							Novo produto
						</Button>
					) : null
				}
			/>

			<Filters>
				<TextField
					type="search"
					label="Buscar por nome"
					value={filters.search}
					onChange={(event) => catalog.updateFilters({ search: event.target.value })}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchOutlined fontSize="small" />
							</InputAdornment>
						),
					}}
					sx={{ maxWidth: 360 }}
				/>
				<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
					<TextField
						select
						label="Categoria"
						value={filters.category ?? ''}
						SelectProps={{ displayEmpty: true }}
						InputLabelProps={{ shrink: true }}
						onChange={(event) => {
							const parsed = productCategorySchema.safeParse(event.target.value);
							catalog.updateFilters({ category: parsed.success ? parsed.data : undefined });
						}}
						sx={{ width: 190 }}
					>
						<MenuItem value="">Todas</MenuItem>
						{CATEGORY_OPTIONS.map((option) => (
							<MenuItem key={option.value} value={option.value}>
								{option.label}
							</MenuItem>
						))}
					</TextField>
					<TextField
						select
						label="Disponibilidade"
						value={toAvailabilityKey(filters.isAvailable)}
						onChange={(event) => {
							const key = event.target.value;
							if (isAvailabilityKey(key)) {
								catalog.updateFilters({ isAvailable: AVAILABILITY_FILTER[key] });
							}
						}}
						sx={{ width: 190 }}
					>
						<MenuItem value="all">Todas</MenuItem>
						<MenuItem value="available">Disponíveis</MenuItem>
						<MenuItem value="unavailable">Indisponíveis</MenuItem>
					</TextField>
				</Box>
			</Filters>

			<Paper variant="outlined">
				{products.status === 'error' && !products.data ? (
					<ErrorState
						error={products.error}
						fallbackMessage="Não foi possível carregar o cardápio. Tente novamente."
						onRetry={() => void products.reload()}
					/>
				) : (
					<>
						<ProductsTable
							products={catalog.rows}
							loading={products.status === 'loading'}
							canManage={isAdmin}
							hasFilters={hasFilters}
							sortBy={filters.sortBy}
							sortOrder={filters.sortOrder}
							togglingIds={catalog.togglingIds}
							onSort={catalog.toggleSort}
							onToggleAvailability={(product) => void catalog.toggleAvailability(product)}
							onEdit={(product) => setEditing({ product })}
							onDelete={setDeleting}
						/>
						{products.data ? (
							<TablePager
								pagination={products.data.pagination}
								onPageChange={catalog.goToPage}
								onLimitChange={(limit) => catalog.updateFilters({ limit })}
							/>
						) : null}
					</>
				)}
			</Paper>

			{isAdmin ? (
				<>
					<ProductFormDialog
						open={editing !== null}
						product={editing?.product ?? null}
						onClose={() => setEditing(null)}
						onSaved={() => void products.reload()}
					/>
					<ConfirmDialog
						open={deleting !== null}
						title="Excluir produto?"
						description={`${deleting?.name ?? 'Este produto'} sairá do cardápio. Os pedidos já registrados continuam com o histórico.`}
						confirmLabel="Excluir produto"
						tone="danger"
						busy={deleteBusy}
						onCancel={() => setDeleting(null)}
						onConfirm={() => void confirmDelete()}
					/>
				</>
			) : null}
		</>
	);
}
