import { useCallback, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useNotifier } from '@/hooks/useNotifier';
import { useRemoteData } from '@/hooks/useRemoteData';
import { deleteProduct, listProducts, updateProduct, type Product } from '@/services/products';
import type { CatalogFilters } from '../types';

const INITIAL_FILTERS: CatalogFilters = {
	search: '',
	sortBy: 'createdAt',
	sortOrder: 'desc',
	page: 1,
	limit: 20,
};

export function useProductsCatalog() {
	const notifier = useNotifier();
	const [filters, setFilters] = useState<CatalogFilters>(INITIAL_FILTERS);
	const [togglingIds, setTogglingIds] = useState<ReadonlySet<string>>(new Set());
	const [availabilityOverrides, setAvailabilityOverrides] = useState<Record<string, boolean>>({});
	const debouncedSearch = useDebouncedValue(filters.search.trim());
	const query = { ...filters, search: debouncedSearch || undefined };

	const products = useRemoteData((signal) => listProducts(query, signal), JSON.stringify(query));
	const reloadProducts = products.reload;

	const updateFilters = useCallback((patch: Partial<CatalogFilters>) => {
		setFilters((current) => ({ ...current, page: 1, ...patch }));
	}, []);

	const goToPage = useCallback((page: number) => {
		setFilters((current) => ({ ...current, page }));
	}, []);

	const toggleSort = useCallback((sortBy: CatalogFilters['sortBy']) => {
		setFilters((current) => ({
			...current,
			page: 1,
			sortBy,
			sortOrder: current.sortBy === sortBy && current.sortOrder === 'asc' ? 'desc' : 'asc',
		}));
	}, []);

	const toggleAvailability = useCallback(
		async (product: Product) => {
			const next = !product.isAvailable;
			setTogglingIds((current) => new Set(current).add(product.id));
			setAvailabilityOverrides((current) => ({ ...current, [product.id]: next }));
			try {
				await updateProduct(product.id, { isAvailable: next });
				notifier.success(next ? `${product.name} voltou ao cardápio.` : `${product.name} saiu do cardápio.`);
				await reloadProducts();
			} catch (error) {
				notifier.failure(error, 'Não foi possível alterar a disponibilidade. Tente novamente.');
			} finally {
				setAvailabilityOverrides(({ [product.id]: _, ...rest }) => rest);
				setTogglingIds((current) => {
					const updated = new Set(current);
					updated.delete(product.id);
					return updated;
				});
			}
		},
		[notifier, reloadProducts],
	);

	const removeProduct = useCallback(
		async (product: Product) => {
			try {
				await deleteProduct(product.id);
				notifier.success('Produto excluído.');
				await reloadProducts();
				return true;
			} catch (error) {
				notifier.failure(error, 'Não foi possível excluir o produto. Tente novamente.');
				return false;
			}
		},
		[notifier, reloadProducts],
	);

	const rows =
		products.data?.data.map((product) =>
			product.id in availabilityOverrides
				? { ...product, isAvailable: availabilityOverrides[product.id] }
				: product,
		) ?? null;

	return {
		filters,
		updateFilters,
		goToPage,
		toggleSort,
		products,
		rows,
		togglingIds,
		toggleAvailability,
		removeProduct,
	};
}
