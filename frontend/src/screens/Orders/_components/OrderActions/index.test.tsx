import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { buildOrder } from '@/test/fixtures';
import { renderWithProviders } from '@/test/renderWithProviders';
import { OrderActions } from '.';

describe('OrderActions', () => {
	it('offers only the transitions the API allows for the order', () => {
		renderWithProviders(
			<OrderActions
				order={buildOrder({ status: 'delivering', availableTransitions: ['delivered'] })}
				busy={false}
				onChangeStatus={vi.fn()}
			/>,
		);

		expect(screen.getByRole('button', { name: 'Confirmar entrega' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
	});

	it('advances the order when the contextual action is clicked', async () => {
		const user = userEvent.setup();
		const onChangeStatus = vi.fn().mockResolvedValue(true);
		const order = buildOrder();
		renderWithProviders(<OrderActions order={order} busy={false} onChangeStatus={onChangeStatus} />);

		await user.click(screen.getByRole('button', { name: 'Iniciar preparo' }));

		expect(onChangeStatus).toHaveBeenCalledWith(order, 'preparing');
	});

	it('asks for confirmation before cancelling', async () => {
		const user = userEvent.setup();
		const onChangeStatus = vi.fn().mockResolvedValue(true);
		renderWithProviders(<OrderActions order={buildOrder()} busy={false} onChangeStatus={onChangeStatus} />);

		await user.click(screen.getByRole('button', { name: 'Cancelar' }));
		expect(onChangeStatus).not.toHaveBeenCalled();
		expect(screen.getByRole('dialog', { name: 'Cancelar este pedido?' })).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Cancelar pedido' }));

		expect(onChangeStatus).toHaveBeenCalledWith(expect.objectContaining({ id: 'order-1' }), 'cancelled');
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
	});

	it('points ready orders without a courier to the dispatch screen', () => {
		renderWithProviders(
			<OrderActions
				order={buildOrder({ status: 'ready', availableTransitions: ['cancelled'] })}
				busy={false}
				onChangeStatus={vi.fn()}
			/>,
		);

		expect(screen.getByRole('link', { name: 'Despachar' })).toHaveAttribute('href', '/dispatch');
		expect(screen.queryByRole('button', { name: 'Saiu para entrega' })).not.toBeInTheDocument();
	});
});
