import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
} from '@mui/material';
import { useId } from 'react';

type ConfirmDialogProps = {
	open: boolean;
	title: string;
	description: string;
	confirmLabel: string;
	tone?: 'default' | 'danger';
	busy?: boolean;
	onConfirm(): void;
	onCancel(): void;
};

export function ConfirmDialog({
	open,
	title,
	description,
	confirmLabel,
	tone = 'default',
	busy = false,
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	const titleId = useId();
	const descriptionId = useId();

	return (
		<Dialog
			open={open}
			onClose={busy ? undefined : onCancel}
			aria-labelledby={titleId}
			aria-describedby={descriptionId}
			maxWidth="xs"
			fullWidth
		>
			<DialogTitle id={titleId}>{title}</DialogTitle>
			<DialogContent>
				<DialogContentText id={descriptionId}>{description}</DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button variant="outlined" onClick={onCancel} disabled={busy}>
					Voltar
				</Button>
				<Button
					variant="contained"
					color={tone === 'danger' ? 'error' : 'primary'}
					onClick={onConfirm}
					disabled={busy}
				>
					{confirmLabel}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
