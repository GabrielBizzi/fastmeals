import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middlewares/authenticate';
import * as productsController from './products.controller';

export const productsRouter = Router();

productsRouter.use(authenticate);
productsRouter.get('/', productsController.list);
productsRouter.get('/:id', productsController.show);
productsRouter.post('/', requireAdmin, productsController.create);
productsRouter.put('/:id', requireAdmin, productsController.update);
productsRouter.delete('/:id', requireAdmin, productsController.remove);

export const menuRouter = Router();

menuRouter.get('/', productsController.listMenu);
