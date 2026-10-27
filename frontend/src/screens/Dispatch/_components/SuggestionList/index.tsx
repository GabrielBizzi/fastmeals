import CheckOutlined from '@mui/icons-material/CheckOutlined';
import { Button, Typography } from '@mui/material';
import type { AssignmentPlan, SuggestedAssignment } from '@/services/orders';
import { formatDistance } from '@/utils/formatters';
import type { SuggestionDecision } from '../../_hooks/useDispatchBoard';
import { Row, Rows } from './styles';

type SuggestionListProps = {
	plan: AssignmentPlan;
	decisions: Record<string, SuggestionDecision>;
	customerNames: ReadonlyMap<string, string>;
	onAccept(assignment: SuggestedAssignment): void;
	onReject(assignment: SuggestedAssignment): void;
};

export function SuggestionList({ plan, decisions, customerNames, onAccept, onReject }: SuggestionListProps) {
	return (
		<>
			{plan.assignments.length > 0 ? (
				<Rows aria-label="Atribuições sugeridas">
					{plan.assignments.map((assignment) => {
						const decision = decisions[assignment.orderId];
						return (
							<Row key={assignment.orderId} data-decision={decision ?? 'open'}>
								<div className="pair">
									<span className="address">
										{customerNames.get(assignment.orderId) ?? 'Pedido'}, {assignment.orderAddress}
									</span>
									<span className="courier">
										{assignment.deliveryPersonName}, a {formatDistance(assignment.estimatedDistanceKm)}
									</span>
								</div>
								<div className="actions">
									{decision === 'accepted' ? (
										<Typography variant="body2" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
											<CheckOutlined fontSize="small" aria-hidden />
											Saiu para entrega
										</Typography>
									) : decision === 'rejected' ? (
										<Typography variant="body2" color="text.secondary">
											Recusada
										</Typography>
									) : (
										<>
											<Button
												size="small"
												variant="contained"
												disabled={decision === 'accepting'}
												onClick={() => onAccept(assignment)}
											>
												{decision === 'accepting' ? 'Enviando…' : 'Aceitar'}
											</Button>
											<Button
												size="small"
												variant="outlined"
												disabled={decision === 'accepting'}
												onClick={() => onReject(assignment)}
											>
												Recusar
											</Button>
										</>
									)}
								</div>
							</Row>
						);
					})}
				</Rows>
			) : null}

			{plan.unassigned.length > 0 ? (
				<Rows aria-label="Pedidos sem entregador" style={{ marginTop: plan.assignments.length ? 16 : 0 }}>
					{plan.unassigned.map((entry) => (
						<Row key={entry.orderId} data-decision="unassigned">
							<div className="pair">
								<span className="address">
									{customerNames.get(entry.orderId) ?? 'Pedido'}, {entry.orderAddress}
								</span>
								<span className="courier">Sem entregador livre no momento. Aguarde alguém concluir uma entrega.</span>
							</div>
						</Row>
					))}
				</Rows>
			) : null}
		</>
	);
}
