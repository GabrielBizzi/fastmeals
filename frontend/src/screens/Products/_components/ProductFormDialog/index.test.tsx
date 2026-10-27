import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { buildProduct } from '@/test/fixtures';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';
import { ProductFormDialog } from '.';

describe('ProductFormDialog', () => {
	it('validates fields while the operator types', async () => {
		const user = userEvent.setup();
		renderWithProviders(<ProductFormDialog open product={null} onClose={vi.fn()} onSaved={vi.fn()} />);

		await user.type(screen.getByLabelText('Nome'), 'Ab');
		await user.type(screen.getByLabelText('Preço'), '10,999');

		expect(await screen.findByText('O nome deve ter entre 3 e 120 caracteres')).toBeInTheDocument();
		expect(screen.getByText('Use no máximo 2 casas decimais')).toBeInTheDocument();

		await user.type(screen.getByLabelText('Nome'), 'c');
		await waitFor(() =>
			expect(screen.queryByText('O nome deve ter entre 3 e 120 caracteres')).not.toBeInTheDocument(),
		);
	});

	it('sends the normalized payload and reports success', async () => {
		const user = userEvent.setup();
		const onSaved = vi.fn();
		const onClose = vi.fn();
		let received: unknown;
		server.use(
			http.post('*/api/products', async ({ request }) => {
				received = await request.json();
				return HttpResponse.json(buildProduct({ id: 'new-product' }), { status: 201 });
			}),
		);
		renderWithProviders(<ProductFormDialog open product={null} onClose={onClose} onSaved={onSaved} />);

		await user.type(screen.getByLabelText('Nome'), 'Suco de Uva');
		await user.type(screen.getByLabelText('Descrição'), 'Suco integral de uva, 500ml');
		await user.type(screen.getByLabelText('Preço'), '12,50');
		await user.type(screen.getByLabelText('Preparo'), '5');
		await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

		await waitFor(() => expect(onSaved).toHaveBeenCalled());
		expect(received).toEqual({
			name: 'Suco de Uva',
			description: 'Suco integral de uva, 500ml',
			price: 12.5,
			category: 'meal',
			preparationTime: 5,
			imageUrl: null,
			isAvailable: true,
		});
		expect(onClose).toHaveBeenCalled();
		expect(await screen.findByText('Produto salvo com sucesso.')).toBeInTheDocument();
	});

	it('shows server-side field errors next to the field', async () => {
		const user = userEvent.setup();
		server.use(
			http.put('*/api/products/:id', () =>
				HttpResponse.json(
					{
						error: {
							code: 'VALIDATION_ERROR',
							message: 'Dados inválidos',
							details: [{ field: 'imageUrl', message: 'Informe uma URL válida' }],
						},
					},
					{ status: 400 },
				),
			),
		);
		renderWithProviders(<ProductFormDialog open product={buildProduct()} onClose={vi.fn()} onSaved={vi.fn()} />);

		await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

		expect(await screen.findByText('Informe uma URL válida')).toBeInTheDocument();
		expect(screen.getByText('Revise os campos destacados e tente novamente.')).toBeInTheDocument();
	});
});
