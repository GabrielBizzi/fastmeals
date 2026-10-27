import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import EditOutlined from '@mui/icons-material/EditOutlined';
import TwoWheelerOutlined from '@mui/icons-material/TwoWheelerOutlined';
import {
	Button,
	IconButton,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	ToggleButton,
	ToggleButtonGroup,
	Tooltip,
	Typography,
} from '@mui/material';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { TableSkeleton } from '@/components/TableSkeleton';
import { useAuth } from '@/context/auth.context';
import type { DeliveryPerson } from '@/services/deliveryPersons';
import { VEHICLE_PRESENTATION } from '@/utils/domainLabels';
import { DeliveryPersonFormDialog } from './_components/DeliveryPersonFormDialog';
import { useDeliveryPersons } from './_hooks/useDeliveryPersons';
import { Availability, Vehicle } from './styles';
import type { CourierFilter } from './types';

const FILTER_OPTIONS: { value: CourierFilter; label: string }[] = [
	{ value: 'all', label: 'Todos' },
	{ value: 'active', label: 'Ativos' },
	{ value: 'available', label: 'Livres agora' },
];

function availabilityOf(person: DeliveryPerson) {
	if (!person.isActive) return { tone: 'inactive', label: 'Inativo' } as const;
	if (person.currentOrderId) return { tone: 'busy', label: 'Em entrega' } as const;
	return { tone: 'free', label: 'Livre' } as const;
}

export default function DeliveryPersons() {
	const { isAdmin } = useAuth();
	const { filter, setFilter, persons, removePerson } = useDeliveryPersons();
	const [editing, setEditing] = useState<{ person: DeliveryPerson | null } | null>(null);
	const [deleting, setDeleting] = useState<DeliveryPerson | null>(null);
	const [deleteBusy, setDeleteBusy] = useState(false);
	const columns = isAdmin ? 6 : 5;

	const confirmDelete = async () => {
		if (!deleting) return;
		setDeleteBusy(true);
		const removed = await removePerson(deleting);
		setDeleteBusy(false);
		if (removed) setDeleting(null);
	};

	return (
		<>
			<PageHeader
				title="Entregadores"
				description="Quem está livre aparece como opção na tela de despacho."
				actions={
					isAdmin ? (
						<Button
							variant="contained"
							startIcon={<AddOutlined />}
							onClick={() => setEditing({ person: null })}
						>
							Novo entregador
						</Button>
					) : null
				}
			/>

			<ToggleButtonGroup
				exclusive
				size="small"
				value={filter}
				onChange={(_, value: CourierFilter | null) => value && setFilter(value)}
				aria-label="Filtrar entregadores"
				sx={{ mb: 2 }}
			>
				{FILTER_OPTIONS.map((option) => (
					<ToggleButton key={option.value} value={option.value}>
						{option.label}
					</ToggleButton>
				))}
			</ToggleButtonGroup>

			<Paper variant="outlined">
				{persons.status === 'error' && !persons.data ? (
					<ErrorState
						error={persons.error}
						fallbackMessage="Não foi possível carregar os entregadores. Tente novamente."
						onRetry={() => void persons.reload()}
					/>
				) : persons.status !== 'loading' && persons.data?.length === 0 ? (
					<EmptyState
						icon={<TwoWheelerOutlined aria-hidden />}
						title={filter === 'all' ? 'Nenhum entregador cadastrado.' : 'Nenhum entregador nesta situação.'}
						description={filter === 'all' && isAdmin ? 'Cadastre a equipe para começar a despachar pedidos.' : undefined}
					/>
				) : (
					<TableContainer>
						<Table aria-label="Entregadores" aria-busy={persons.status === 'loading'}>
							<TableHead>
								<TableRow>
									<TableCell>Nome</TableCell>
									<TableCell>Telefone</TableCell>
									<TableCell>Veículo</TableCell>
									<TableCell>Situação</TableCell>
									<TableCell>Localização</TableCell>
									{isAdmin ? <TableCell align="right">Ações</TableCell> : null}
								</TableRow>
							</TableHead>
							<TableBody>
								{persons.status === 'loading' && !persons.data ? (
									<TableSkeleton columns={columns} rows={4} />
								) : (
									persons.data?.map((person) => {
										const vehicle = VEHICLE_PRESENTATION[person.vehicleType];
										const availability = availabilityOf(person);
										return (
											<TableRow key={person.id} hover>
												<TableCell sx={{ fontWeight: 600 }}>{person.name}</TableCell>
												<TableCell sx={{ whiteSpace: 'nowrap' }}>{person.phone}</TableCell>
												<TableCell>
													<Vehicle>
														<vehicle.Icon fontSize="small" aria-hidden />
														{vehicle.label}
													</Vehicle>
												</TableCell>
												<TableCell>
													<Availability tone={availability.tone}>{availability.label}</Availability>
												</TableCell>
												<TableCell>
													{person.currentLatitude !== null && person.currentLongitude !== null ? (
														<Typography variant="body2" color="text.secondary">
															{person.currentLatitude.toFixed(4)}, {person.currentLongitude.toFixed(4)}
														</Typography>
													) : (
														<Typography variant="body2" color="text.secondary">
															Sem localização
														</Typography>
													)}
												</TableCell>
												{isAdmin ? (
													<TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
														<Tooltip title="Editar">
															<IconButton aria-label={`Editar ${person.name}`} onClick={() => setEditing({ person })}>
																<EditOutlined fontSize="small" />
															</IconButton>
														</Tooltip>
														<Tooltip title="Remover">
															<IconButton aria-label={`Remover ${person.name}`} onClick={() => setDeleting(person)}>
																<DeleteOutline fontSize="small" />
															</IconButton>
														</Tooltip>
													</TableCell>
												) : null}
											</TableRow>
										);
									})
								)}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</Paper>

			{isAdmin ? (
				<>
					<DeliveryPersonFormDialog
						open={editing !== null}
						person={editing?.person ?? null}
						onClose={() => setEditing(null)}
						onSaved={() => void persons.reload()}
					/>
					<ConfirmDialog
						open={deleting !== null}
						title="Remover entregador?"
						description={`${deleting?.name ?? 'Este entregador'} deixará de aparecer no despacho. As entregas já concluídas continuam no histórico.`}
						confirmLabel="Remover entregador"
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
