import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/authenticate';
import * as ordersController from './orders.controller';

export const ordersRouter = Router();

ordersRouter.use(authenticate);
ordersRouter.get('/', ordersController.list);
ordersRouter.post(
	'/optimize-assignment',
	requireAdmin,
	ordersController.optimizeAssignment,
);
ordersRouter.get('/:id', ordersController.show);
ordersRouter.post('/', requireAdmin, ordersController.create);
ordersRouter.patch('/:id/status', requireAdmin, ordersController.updateStatus);
ordersRouter.patch('/:id/assign', requireAdmin, ordersController.assign);
