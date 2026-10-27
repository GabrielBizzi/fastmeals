import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import * as reportsController from './reports.controller';

export const reportsRouter = Router();

reportsRouter.use(authenticate);
reportsRouter.get('/revenue', reportsController.revenue);
reportsRouter.get('/orders-by-status', reportsController.ordersByStatus);
reportsRouter.get('/top-products', reportsController.topProducts);
reportsRouter.get('/average-delivery-time', reportsController.averageDeliveryTime);
