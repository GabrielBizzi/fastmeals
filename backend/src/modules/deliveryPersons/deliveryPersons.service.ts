import type { Prisma } from '@prisma/client';
import { OrderStatus } from '@prisma/client';
import { AppError } from '../../errors/AppError';
import { prisma } from '../../lib/prisma';
import { toDeliveryPersonResponse } from './deliveryPersons.mapper';
import type {
	CreateDeliveryPersonInput,
	ListDeliveryPersonsQuery,
	UpdateDeliveryPersonInput,
} from './deliveryPersons.schemas';

const currentOrderInclude = {
	orders: {
		where: { status: OrderStatus.delivering },
		select: { id: true },
		take: 1,
	},
} satisfies Prisma.DeliveryPersonInclude;

function deliveryPersonNotFound() {
	return new AppError(
		'DELIVERY_PERSON_NOT_FOUND',
		'Entregador não encontrado',
	);
}

async function findExistingDeliveryPerson(id: string) {
	const person = await prisma.deliveryPerson.findFirst({
		where: { id, deletedAt: null },
		include: currentOrderInclude,
	});
	if (!person) throw deliveryPersonNotFound();
	return person;
}

export async function listDeliveryPersons(query: ListDeliveryPersonsQuery) {
	const deliveringFilter: Prisma.DeliveryPersonWhereInput =
		query.available === undefined
			? {}
			: query.available
				? { orders: { none: { status: OrderStatus.delivering } } }
				: { orders: { some: { status: OrderStatus.delivering } } };

	const persons = await prisma.deliveryPerson.findMany({
		where: {
			deletedAt: null,
			...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
			...deliveringFilter,
		},
		include: currentOrderInclude,
		orderBy: [{ name: 'asc' }, { id: 'asc' }],
	});

	return { data: persons.map(toDeliveryPersonResponse) };
}

export async function getDeliveryPerson(id: string) {
	return toDeliveryPersonResponse(await findExistingDeliveryPerson(id));
}

export async function createDeliveryPerson(input: CreateDeliveryPersonInput) {
	const person = await prisma.deliveryPerson.create({
		data: input,
		include: currentOrderInclude,
	});
	return toDeliveryPersonResponse(person);
}

export async function updateDeliveryPerson(
	id: string,
	input: UpdateDeliveryPersonInput,
) {
	const existing = await findExistingDeliveryPerson(id);

	if (input.isActive === false && existing.orders.length > 0) {
		throw new AppError(
			'DELIVERY_PERSON_IN_USE',
			'Não é possível desativar um entregador com uma entrega em andamento',
		);
	}

	const person = await prisma.deliveryPerson.update({
		where: { id },
		data: input,
		include: currentOrderInclude,
	});
	return toDeliveryPersonResponse(person);
}

export async function deleteDeliveryPerson(id: string): Promise<void> {
	const existing = await findExistingDeliveryPerson(id);

	if (existing.orders.length > 0) {
		throw new AppError(
			'DELIVERY_PERSON_IN_USE',
			'Não é possível remover um entregador com uma entrega em andamento',
		);
	}

	await prisma.$transaction([
		prisma.order.updateMany({
			where: {
				deliveryPersonId: id,
				status: {
					in: [OrderStatus.pending, OrderStatus.preparing, OrderStatus.ready],
				},
			},
			data: { deliveryPersonId: null },
		}),
		prisma.deliveryPerson.update({
			where: { id },
			data: { deletedAt: new Date(), isActive: false },
		}),
	]);
}
