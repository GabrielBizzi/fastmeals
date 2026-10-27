import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import * as authController from './auth.controller';

export const authRouter = Router();

authRouter.post('/login', authController.login);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authenticate, authController.me);
