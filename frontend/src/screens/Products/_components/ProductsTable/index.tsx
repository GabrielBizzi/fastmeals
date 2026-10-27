import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import RestaurantMenuOutlined from '@mui/icons-material/RestaurantMenuOutlined';
import {
	IconButton,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TableSortLabel,
	Tooltip,
	Typography,
} from '@mui/material';
import { EmptyState } from '@/components/EmptyState';
import { TableSkeleton } from '@/components/TableSkeleton';
import type { Product } from '@/services/products';
import { CATEGORY_LABELS } from '@/utils/domainLabels';
import { formatCurrency } from '@/utils/formatters';
import type { CatalogFilters } from '../../types';
import { Description, ProductCell, Thumbnail } from './styles';

type ProductsTableProps = {
	products: Product[] | null;
	loading: boolean;
	canManage: boolean;
	hasFilters: boolean;
	sortBy: CatalogFilters['sortBy'];
	sortOrder: CatalogFilters['sortOrder'];
	togglingIds: ReadonlySet<string>;
	onSort(sortBy: CatalogFilters['sortBy']): void;
	onToggleAvailability(product: Product): void;
	onEdit(product: Product): void;
	onDelete(product: Product): void;
};

export function ProductsTable({
	products,
	loading,
	canManage,
	hasFilters,
	sortBy,
	sortOrder,
	togglingIds,
	onSort,
	onToggleAvailability,
	onEdit,
	onDelete,
}: ProductsTableProps) {
	if (!loading && products?.length === 0) {
		return (
			<EmptyState
				icon={<RestaurantMenuOutlined aria-hidden />}
				title={hasFilters ? 'Nenhum produto encontrado.' : 'O cardápio ainda está vazio.'}
				description={
					hasFilters
						? 'Tente outro nome ou limpe os filtros.'
						: canManage
							? 'Cadastre o primeiro produto para começar a receber pedidos.'
							: undefined
				}
			/>
		);
	}

	const sortableHeader = (column: CatalogFilters['sortBy'], label: string, align?: 'right') => (
		<TableCell align={align} sortDirection={sortBy === column ? sortOrder : false}>
			<TableSortLabel
				active={sortBy === column}
				direction={sortBy === column ? sortOrder : 'asc'}
				onClick={() => onSort(column)}
			>
				{label}
			</TableSortLabel>
		</TableCell>
	);

	return (
		<TableContainer>
			<Table aria-label="Produtos do cardápio" aria-busy={loading}>
				<TableHead>
					<TableRow>
						{sortableHeader('name', 'Produto')}
						<TableCell>Categoria</TableCell>
						{sortableHeader('price', 'Preço', 'right')}
						<TableCell align="right">Preparo</TableCell>
						<TableCell>Disponível</TableCell>
						{canManage ? <TableCell align="right">Ações</TableCell> : null}
					</TableRow>
				</TableHead>
				<TableBody>
					{loading && !products ? (
						<TableSkeleton columns={canManage ? 6 : 5} />
					) : (
						products?.map((product) => (
							<TableRow key={product.id} hover>
								<TableCell>
									<ProductCell>
										<Thumbnail aria-hidden>
											{product.imageUrl ? <img src={product.imageUrl} alt="" loading="lazy" /> : null}
										</Thumbnail>
										<div>
											<Typography variant="body2" sx={{ fontWeight: 600 }}>
												{product.name}
											</Typography>
											<Description title={product.description}>{product.description}</Description>
										</div>
									</ProductCell>
								</TableCell>
								<TableCell>{CATEGORY_LABELS[product.category]}</TableCell>
								<TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
									{formatCurrency(product.price)}
								</TableCell>
								<TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
									{product.preparationTime} min
								</TableCell>
								<TableCell>
									{canManage ? (
										<Switch
											checked={product.isAvailable}
											disabled={togglingIds.has(product.id)}
											onChange={() => onToggleAvailability(product)}
											inputProps={{
												'aria-label': `${product.name} disponível no cardápio`,
											}}
										/>
									) : (
										<Typography variant="body2" color={product.isAvailable ? 'primary' : 'text.secondary'}>
											{product.isAvailable ? 'Sim' : 'Não'}
										</Typography>
									)}
								</TableCell>
								{canManage ? (
									<TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
										<Tooltip title="Editar">
											<IconButton aria-label={`Editar ${product.name}`} onClick={() => onEdit(product)}>
												<EditOutlined fontSize="small" />
											</IconButton>
										</Tooltip>
										<Tooltip title="Excluir">
											<IconButton aria-label={`Excluir ${product.name}`} onClick={() => onDelete(product)}>
												<DeleteOutline fontSize="small" />
											</IconButton>
										</Tooltip>
									</TableCell>
								) : null}
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</TableContainer>
	);
}
