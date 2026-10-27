import { execSync } from 'node:child_process';
import 'dotenv/config';

export default function setup() {
	const databaseUrl = process.env.TEST_DATABASE_URL;
	if (!databaseUrl) {
		throw new Error('TEST_DATABASE_URL must point to a disposable database');
	}
	execSync('npx prisma migrate deploy', {
		env: { ...process.env, DATABASE_URL: databaseUrl },
		stdio: 'ignore',
	});
}
