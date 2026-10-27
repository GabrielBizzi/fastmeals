import { zodResolver } from '@hookform/resolvers/zod';
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	Grid,
	InputAdornment,
	Switch,
} from '@mui/material';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { applyServerErrors } from '@/components/Form/applyServerErrors';
import { FormSelectField } from '@/components/Form/SelectField';
import { FormTextField } from '@/components/Form/TextField';
import { useNotifier } from '@/hooks/useNotifier';
import { createProduct, updateProduct, type Product } from '@/services/products';
import { CATEGORY_OPTIONS } from '@/utils/domainLabels';
import {
	EMPTY_PRODUCT_FORM,
	productFormSchema,
	toProductFormValues,
	toProductInput,
	type ProductFormValues,
} from '../../types';

type ProductFormDialogProps = {
	open: boolean;
	product: Product | null;
	onClose(): void;
	onSaved(): void;
};

const SERVER_FIELDS = [
	'name',
	'description',
	'price',
	'category',
	'preparationTime',
	'imageUrl',
	'isAvailable',
] as const;

export function ProductFormDialog({ open, product, onClose, onSaved }: ProductFormDialogProps) {
	const notifier = useNotifier();
	const form = useForm<ProductFormValues>({
		resolver: zodResolver(productFormSchema),
		mode: 'onChange',
		defaultValues: EMPTY_PRODUCT_FORM,
	});
	const description = useWatch({ control: form.control, name: 'description' });

	useEffect(() => {
		if (open) form.reset(product ? toProductFormValues(product) : EMPTY_PRODUCT_FORM);
	}, [open, product, form]);

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			const input = toProductInput(values);
			if (product) {
				await updateProduct(product.id, input);
			} else {
				await createProduct(input);
			}
			notifier.success('Produto salvo com sucesso.');
			onSaved();
			onClose();
		} catch (error) {
			applyServerErrors(error, SERVER_FIELDS, form.setError);
			notifier.failure(error, 'Não foi possível salvar o produto. Tente novamente.');
		}
	});

	const { isSubmitting } = form.formState;

	return (
		<Dialog
			open={open}
			onClose={isSubmitting ? undefined : onClose}
			maxWidth="sm"
			fullWidth
			aria-labelledby="product-form-title"
		>
			<form onSubmit={onSubmit} noValidate>
				<DialogTitle id="product-form-title">{product ? 'Editar produto' : 'Novo produto'}</DialogTitle>
				<DialogContent>
					<Grid container spacing={2} sx={{ pt: 1 }}>
						<Grid item xs={12}>
							<FormTextField control={form.control} name="name" label="Nome" />
						</Grid>
						<Grid item xs={12}>
							<FormTextField
								control={form.control}
								name="description"
								label="Descrição"
								multiline
								minRows={3}
								helperText={`${description.trim().length}/500 caracteres`}
							/>
						</Grid>
						<Grid item xs={12} sm={4}>
							<FormTextField
								control={form.control}
								name="price"
								label="Preço"
								inputMode="decimal"
								InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
							/>
						</Grid>
						<Grid item xs={12} sm={4}>
							<FormSelectField
								control={form.control}
								name="category"
								label="Categoria"
								options={CATEGORY_OPTIONS}
							/>
						</Grid>
						<Grid item xs={12} sm={4}>
							<FormTextField
								control={form.control}
								name="preparationTime"
								label="Preparo"
								inputMode="numeric"
								InputProps={{ endAdornment: <InputAdornment position="end">min</InputAdornment> }}
							/>
						</Grid>
						<Grid item xs={12}>
							<FormTextField
								control={form.control}
								name="imageUrl"
								label="URL da imagem (opcional)"
								placeholder="https://"
								inputMode="url"
							/>
						</Grid>
						<Grid item xs={12}>
							<Controller
								control={form.control}
								name="isAvailable"
								render={({ field }) => (
									<FormControlLabel
										control={
											<Switch
												checked={field.value}
												onChange={(event) => field.onChange(event.target.checked)}
												inputRef={field.ref}
											/>
										}
										label="Disponível no cardápio"
										sx={{ ml: 0, gap: 1.5 }}
									/>
								)}
							/>
						</Grid>
					</Grid>
				</DialogContent>
				<DialogActions>
					<Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
						Descartar
					</Button>
					<Button type="submit" variant="contained" disabled={isSubmitting}>
						{isSubmitting ? 'Salvando…' : 'Salvar produto'}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
