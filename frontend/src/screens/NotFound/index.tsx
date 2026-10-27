import { Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { ROUTES } from '@/routes/paths';

export default function NotFound() {
	return (
		<EmptyState
			title="Página não encontrada"
			description="O endereço pode ter mudado. Volte para a lista de pedidos para continuar."
			action={
				<Button variant="contained" component={RouterLink} to={ROUTES.orders}>
					Ir para pedidos
				</Button>
			}
		/>
	);
}
