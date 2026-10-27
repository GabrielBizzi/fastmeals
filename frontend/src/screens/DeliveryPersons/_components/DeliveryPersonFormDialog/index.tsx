import { zodResolver } from '@hookform/resolvers/zod';
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	Grid,
	Switch,
	Typography,
} from '@mui/material';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { applyServerErrors } from '@/components/Form/applyServerErrors';
import { FormSelectField } from '@/components/Form/SelectField';
import { FormTextField } from '@/components/Form/TextField';
import { useNotifier } from '@/hooks/useNotifier';
import {
	createDeliveryPerson,
	updateDeliveryPerson,
	type DeliveryPerson,
} from '@/services/deliveryPersons';
import { VEHICLE_OPTIONS } from '@/utils/domainLabels';
import { maskPhone } from '@/utils/masks';
import {
	deliveryPersonFormSchema,
	EMPTY_DELIVERY_PERSON_FORM,
	toDeliveryPersonFormValues,
	toDeliveryPersonInput,
	type DeliveryPersonFormValues,
} from '../../types';

type DeliveryPersonFormDialogProps = {
	open: boolean;
	person: DeliveryPerson | null;
	onClose(): void;
	onSaved(): void;
};

const SERVER_FIELDS = [
	'name',
	'phone',
	'vehicleType',
	'isActive',
	'currentLatitude',
	'currentLongitude',
] as const;

export function DeliveryPersonFormDialog({
	open,
	person,
	onClose,
	onSaved,
}: DeliveryPersonFormDialogProps) {
	const notifier = useNotifier();
	const form = useForm<DeliveryPersonFormValues>({
		resolver: zodResolver(deliveryPersonFormSchema),
		mode: 'onChange',
		defaultValues: EMPTY_DELIVERY_PERSON_FORM,
	});

	useEffect(() => {
		if (open)
			form.reset(
				person
					? toDeliveryPersonFormValues(person)
					: EMPTY_DELIVERY_PERSON_FORM,
			);
	}, [open, person, form]);

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			const input = toDeliveryPersonInput(values);
			if (person) {
				await updateDeliveryPerson(person.id, input);
			} else {
				await createDeliveryPerson(input);
			}
			notifier.success('Entregador salvo com sucesso.');
			onSaved();
			onClose();
		} catch (error) {
			applyServerErrors(error, SERVER_FIELDS, form.setError);
			notifier.failure(
				error,
				'Não foi possível salvar o entregador. Tente novamente.',
			);
		}
	});

	const { isSubmitting } = form.formState;

	return (
		<Dialog
			open={open}
			onClose={isSubmitting ? undefined : onClose}
			maxWidth="sm"
			fullWidth
			aria-labelledby="courier-form-title"
		>
			<form onSubmit={onSubmit} noValidate>
				<DialogTitle id="courier-form-title">
					{person ? 'Editar entregador' : 'Novo entregador'}
				</DialogTitle>
				<DialogContent>
					<Grid container spacing={2} sx={{ pt: 1 }}>
						<Grid item xs={12}>
							<FormTextField control={form.control} name="name" label="Nome" />
						</Grid>
						<Grid item xs={12} sm={6}>
							<FormTextField
								control={form.control}
								name="phone"
								label="Telefone"
								placeholder="(11) 98765-4321"
								inputMode="tel"
								transform={maskPhone}
							/>
						</Grid>
						<Grid item xs={12} sm={6}>
							<FormSelectField
								control={form.control}
								name="vehicleType"
								label="Veículo"
								options={VEHICLE_OPTIONS}
							/>
						</Grid>
						<Grid item xs={12}>
							<Typography variant="subtitle2" component="p">
								Localização atual
							</Typography>
							<Typography variant="caption" component="p">
								Usada para sugerir o entregador mais próximo de cada pedido.
							</Typography>
						</Grid>
						<Grid item xs={6}>
							<FormTextField
								control={form.control}
								name="currentLatitude"
								label="Latitude"
								placeholder="-23,5489"
								inputMode="decimal"
							/>
						</Grid>
						<Grid item xs={6}>
							<FormTextField
								control={form.control}
								name="currentLongitude"
								label="Longitude"
								placeholder="-46,6388"
								inputMode="decimal"
							/>
						</Grid>
						<Grid item xs={12}>
							<Controller
								control={form.control}
								name="isActive"
								render={({ field }) => (
									<FormControlLabel
										control={
											<Switch
												checked={field.value}
												onChange={(event) =>
													field.onChange(event.target.checked)
												}
												inputRef={field.ref}
											/>
										}
										label="Ativo para receber entregas"
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
						{isSubmitting ? 'Salvando…' : 'Salvar entregador'}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
