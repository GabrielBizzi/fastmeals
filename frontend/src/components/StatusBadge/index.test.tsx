import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { OrderStatus } from '@/services/orders';
import { StatusProgress } from '../StatusProgress';
import { StatusBadge } from '.';

describe('StatusBadge', () => {
	it.each<[OrderStatus, string]>([
		['pending', 'Pendente'],
		['preparing', 'Em preparo'],
		['ready', 'Pronto'],
		['delivering', 'Em entrega'],
		['delivered', 'Entregue'],
		['cancelled', 'Cancelado'],
	])('renders the %s status with its label and icon', (status, label) => {
		const { container } = render(<StatusBadge status={status} />);

		expect(screen.getByText(label)).toBeInTheDocument();
		expect(container.querySelector('svg')).toHaveAttribute(
			'aria-hidden',
			'true',
		);
	});
});

describe('StatusProgress', () => {
	it('describes the lifecycle step for assistive technologies', () => {
		render(<StatusProgress status="ready" />);

		expect(
			screen.getByRole('img', { name: 'Etapa 3 de 5: Pronto' }),
		).toBeInTheDocument();
	});

	it('marks cancelled orders explicitly', () => {
		render(<StatusProgress status="cancelled" />);

		expect(
			screen.getByRole('img', { name: 'Pedido cancelado' }),
		).toBeInTheDocument();
	});
});
