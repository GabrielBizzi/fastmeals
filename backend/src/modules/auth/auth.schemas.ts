import { z } from 'zod';

export const loginSchema = z.object({
	email: z
		.string({ required_error: 'O e-mail é obrigatório' })
		.trim()
		.toLowerCase()
		.email('Informe um e-mail válido'),
	password: z
		.string({ required_error: 'A senha é obrigatória' })
		.min(1, 'A senha é obrigatória'),
});

export const refreshSchema = z.object({
	refreshToken: z.string().min(1).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
