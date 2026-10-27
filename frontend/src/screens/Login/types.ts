import { z } from 'zod';

export const loginFormSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, 'Informe seu e-mail')
		.email('Informe um e-mail válido, como nome@empresa.com'),
	password: z.string().min(1, 'Informe sua senha'),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
