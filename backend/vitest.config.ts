import 'dotenv/config';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		globalSetup: ['./tests/globalSetup.ts'],
		env: {
			NODE_ENV: 'test',
			DATABASE_URL: process.env.TEST_DATABASE_URL ?? '',
		},
		fileParallelism: false,
		testTimeout: 15000,
		hookTimeout: 60000,
	},
});
