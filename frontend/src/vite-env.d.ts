interface ImportMetaEnv {
	readonly VITE_API_URL?: string;
	readonly VITE_ORDERS_POLLING_MS?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
