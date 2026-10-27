import { UserRole } from '@prisma/client';
import request from 'supertest';
import { createApp } from '../../src/app';
import { signAccessToken } from '../../src/modules/auth/token.service';
import { createUser } from './factories';

export const app = createApp({ rateLimitPerMinute: 10_000 });

export const api = () => request(app);

export async function authHeaderFor(role: UserRole = UserRole.admin) {
	const user = await createUser(role);
	return {
		user,
		header: { Authorization: `Bearer ${signAccessToken(user.id, user.role)}` },
	};
}
