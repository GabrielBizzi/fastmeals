import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/authenticate';
import * as deliveryPersonsController from './deliveryPersons.controller';

export const deliveryPersonsRouter = Router();

deliveryPersonsRouter.use(authenticate);
deliveryPersonsRouter.get('/', deliveryPersonsController.list);
deliveryPersonsRouter.get('/:id', deliveryPersonsController.show);
deliveryPersonsRouter.post('/', requireAdmin, deliveryPersonsController.create);
deliveryPersonsRouter.put('/:id', requireAdmin, deliveryPersonsController.update);
deliveryPersonsRouter.delete(
	'/:id',
	requireAdmin,
	deliveryPersonsController.remove,
);
