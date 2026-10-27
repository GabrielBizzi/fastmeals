import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: { '@': path.resolve(__dirname, './src') },
	},
	server: {
		port: 3000,
		proxy: {
			'/api': {
				target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:3001',
				changeOrigin: false,
			},
		},
	},
	preview: { port: 3000 },
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					react: ['react', 'react-dom', 'react-router-dom'],
					mui: ['@mui/material', '@emotion/react', '@emotion/styled'],
				},
			},
		},
	},
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/test/setup.ts'],
		css: false,
	},
});
