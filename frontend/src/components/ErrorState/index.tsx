import ReplayOutlined from '@mui/icons-material/ReplayOutlined';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import { Button } from '@mui/material';
import { getUserMessage } from '@/services/errors';
import { EmptyState } from '../EmptyState';

type ErrorStateProps = {
	error: unknown;
	fallbackMessage: string;
	onRetry(): void;
};

export function ErrorState({
	error,
	fallbackMessage,
	onRetry,
}: ErrorStateProps) {
	return (
		<EmptyState
			icon={<ErrorOutline aria-hidden />}
			title={getUserMessage(error, fallbackMessage)}
			action={
				<Button
					variant="outlined"
					startIcon={<ReplayOutlined />}
					onClick={onRetry}
				>
					Tentar novamente
				</Button>
			}
		/>
	);
}
