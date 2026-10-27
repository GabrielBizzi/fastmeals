import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { useAuthStore } from '@/stores/auth';
import { server } from './server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
	cleanup();
	server.resetHandlers();
	useAuthStore.setState({
		status: 'checking',
		accessToken: null,
		user: null,
		sessionExpired: false,
	});
});

afterAll(() => server.close());
