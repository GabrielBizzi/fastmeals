import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	Alert,
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Grid,
	IconButton,
	Typography,
} from '@mui/material';
import { useEffect, useMemo } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { applyServerErrors } from '@/components/Form/applyServerErrors';
import { FormSelectField } from '@/components/Form/SelectField';
import { FormTextField } from '@/components/Form/TextField';
import { useNotifier } from '@/hooks/useNotifier';
import { useRemoteData } from '@/hooks/useRemoteData';
import { createOrder } from '@/services/orders';
import { listProducts } from '@/services/products';
import { formatCurrency } from '@/utils/formatters';
import { maskPhone } from '@/utils/masks';
import {
	createOrderFormSchema,
	EMPTY_ORDER_FORM,
	toCreateOrderInput,
	type CreateOrderFormValues,
} from '../../types';

type CreateOrderDialogProps = {
	open: boolean;
	onClose(): void;
	onCreated(): void;
};

const SERVER_FIELDS = [
	'customerName',
	'customerPhone',
	'deliveryAddress',
	'latitude',
	'longitude',
	'items',
] as const;

export function CreateOrderDialog({ open, onClose, onCreated }: CreateOrderDialogProps) {
	const notifier = useNotifier();
	const products = useRemoteData(
		(signal) => listProducts({ page: 1, limit: 100, isAvailable: true, sortBy: 'name', sortOrder: 'asc' }, signal),
		'available-products',
		{ enabled: open },
	);

	const form = useForm<CreateOrderFormValues>({
		resolver: zodResolver(createOrderFormSchema),
		mode: 'onChange',
		defaultValues: EMPTY_ORDER_FORM,
	});
	const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });
	const items = useWatch({ control: form.control, name: 'items' });

	useEffect(() => {
		if (open) form.reset(EMPTY_ORDER_FORM);
	}, [open, form]);

	const productOptions = useMemo(
		() =>
			(products.data?.data ?? []).map((product) => ({
				value: product.id,
				label: `${product.name} (${formatCurrency(product.price)})`,
			})),
		[products.data],
	);

	const estimatedTotal = useMemo(() => {
		const priceById = new Map((products.data?.data ?? []).map((product) => [product.id, product.price]));
		return items.reduce((sum, item) => {
			const price = priceById.get(item.productId) ?? 0;
			const quantity = Number(item.quantity);
			return sum + (Number.isInteger(quantity) ? price * quantity : 0);
		}, 0);
	}, [items, products.data]);

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			await createOrder(toCreateOrderInput(values));
			notifier.success('Pedido criado.');
			onCreated();
			onClose();
		} catch (error) {
			applyServerErrors(error, SERVER_FIELDS, form.setError);
			notifier.failure(error, 'Não foi possível criar o pedido. Tente novamente.');
		}
	});

	const { isSubmitting } = form.formState;
	const itemsError = form.formState.errors.items?.root?.message ?? form.formState.errors.items?.message;

	return (
		<Dialog
			open={open}
			onClose={isSubmitting ? undefined : onClose}
			maxWidth="md"
			fullWidth
			aria-labelledby="create-order-title"
		>
			<form onSubmit={onSubmit} noValidate>
				<DialogTitle id="create-order-title">Novo pedido</DialogTitle>
				<DialogContent>
					<Grid container spacing={2} sx={{ pt: 1 }}>
						<Grid item xs={12} sm={7}>
							<FormTextField control={form.control} name="customerName" label="Nome do cliente" />
						</Grid>
						<Grid item xs={12} sm={5}>
							<FormTextField
								control={form.control}
								name="customerPhone"
								label="Telefone"
								placeholder="(11) 98765-4321"
								inputMode="tel"
								transform={maskPhone}
							/>
						</Grid>
						<Grid item xs={12}>
							<FormTextField
								control={form.control}
								name="deliveryAddress"
								label="Endereço de entrega"
								placeholder="Rua, número, bairro, cidade"
							/>
						</Grid>
						<Grid item xs={6}>
							<FormTextField
								control={form.control}
								name="latitude"
								label="Latitude"
								placeholder="-23,5505"
								inputMode="decimal"
							/>
						</Grid>
						<Grid item xs={6}>
							<FormTextField
								control={form.control}
								name="longitude"
								label="Longitude"
								placeholder="-46,6333"
								inputMode="decimal"
							/>
						</Grid>
					</Grid>

					<Box sx={{ mt: 3 }}>
						<Typography variant="h3" component="h3" sx={{ mb: 1.5 }}>
							Itens
						</Typography>
						{products.status === 'error' ? (
							<Alert severity="error" sx={{ mb: 2 }}>
								Não foi possível carregar o cardápio. Feche e abra novamente.
							</Alert>
						) : null}
						<Box sx={{ display: 'grid', gap: 1.5 }}>
							{fields.map((field, index) => (
								<Box key={field.id} sx={{ display: 'grid', gridTemplateColumns: '1fr 96px 40px', gap: 1.5, alignItems: 'start' }}>
									<FormSelectField
										control={form.control}
										name={`items.${index}.productId`}
										label="Produto"
										options={productOptions}
										disabled={products.status === 'loading'}
									/>
									<FormTextField
										control={form.control}
										name={`items.${index}.quantity`}
										label="Qtd."
										inputMode="numeric"
									/>
									<IconButton
										aria-label={`Remover item ${index + 1}`}
										onClick={() => remove(index)}
										disabled={fields.length === 1}
										sx={{ mt: 0.25 }}
									>
										<DeleteOutline />
									</IconButton>
								</Box>
							))}
						</Box>
						{itemsError ? (
							<Typography variant="caption" color="error" role="alert">
								{itemsError}
							</Typography>
						) : null}
						<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
							<Button
								startIcon={<AddOutlined />}
								onClick={() => append({ productId: '', quantity: '1' })}
								disabled={fields.length >= 50}
							>
								Adicionar item
							</Button>
							<Typography variant="body2" color="text.secondary">
								Total estimado: <strong>{formatCurrency(estimatedTotal)}</strong>
							</Typography>
						</Box>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
						Descartar
					</Button>
					<Button type="submit" variant="contained" disabled={isSubmitting}>
						{isSubmitting ? 'Criando…' : 'Criar pedido'}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
