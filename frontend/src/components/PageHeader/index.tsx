import { Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { Actions, Header, Heading } from './styles';

type PageHeaderProps = {
	title: string;
	description?: ReactNode;
	actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
	return (
		<Header>
			<Heading>
				<Typography variant="h1">{title}</Typography>
				{description ? (
					<Typography variant="body2" color="text.secondary" component="div">
						{description}
					</Typography>
				) : null}
			</Heading>
			{actions ? <Actions>{actions}</Actions> : null}
		</Header>
	);
}
