import { useCallback, useState } from 'react';
import { useNotifier } from '@/hooks/useNotifier';
import { useRemoteData } from '@/hooks/useRemoteData';
import {
	deleteDeliveryPerson,
	listDeliveryPersons,
	type DeliveryPerson,
	type DeliveryPersonFilters,
} from '@/services/deliveryPersons';
import type { CourierFilter } from '../types';

const FILTERS: Record<CourierFilter, DeliveryPersonFilters> = {
	all: {},
	active: { isActive: true },
	available: { isActive: true, available: true },
};

export function useDeliveryPersons() {
	const notifier = useNotifier();
	const [filter, setFilter] = useState<CourierFilter>('all');
	const persons = useRemoteData(
		(signal) => listDeliveryPersons(FILTERS[filter], signal),
		filter,
	);
	const reloadPersons = persons.reload;

	const removePerson = useCallback(
		async (person: DeliveryPerson) => {
			try {
				await deleteDeliveryPerson(person.id);
				notifier.success('Entregador removido.');
				await reloadPersons();
				return true;
			} catch (error) {
				notifier.failure(
					error,
					'Não foi possível remover o entregador. Tente novamente.',
				);
				return false;
			}
		},
		[notifier, reloadPersons],
	);

	return { filter, setFilter, persons, removePerson };
}
