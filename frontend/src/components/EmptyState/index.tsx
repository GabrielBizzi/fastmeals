import { Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { Wrapper } from './styles';

type EmptyStateProps = {
	title: string;
	description?: string;
	icon?: ReactNode;
	action?: ReactNode;
};

export function EmptyState({
	title,
	description,
	icon,
	action,
}: EmptyStateProps) {
	return (
		<Wrapper role="status">
			{icon}
			<Typography variant="h3" component="p">
				{title}
			</Typography>
			{description ? (
				<Typography variant="body2" color="text.secondary">
					{description}
				</Typography>
			) : null}
			{action}
		</Wrapper>
	);
}
