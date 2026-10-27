import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth.context';
import { getErrorCode, getUserMessage } from '@/services/errors';
import { ROUTES } from '@/routes/paths';
import { loginFormSchema, type LoginFormValues } from '../types';

function readRedirectTarget(state: unknown): string {
	if (typeof state === 'object' && state !== null && 'from' in state) {
		const { from } = state;
		if (typeof from === 'string' && from.startsWith('/') && from !== ROUTES.login) {
			return from;
		}
	}
	return ROUTES.orders;
}

export function useLoginForm() {
	const { signIn, sessionExpired } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [submitError, setSubmitError] = useState<string | null>(null);

	const form = useForm<LoginFormValues>({
		resolver: zodResolver(loginFormSchema),
		mode: 'onTouched',
		defaultValues: { email: '', password: '' },
	});

	const onSubmit = form.handleSubmit(async (values) => {
		setSubmitError(null);
		try {
			await signIn(values);
			navigate(readRedirectTarget(location.state), { replace: true });
		} catch (error) {
			setSubmitError(
				getUserMessage(error, 'Não foi possível entrar agora. Tente novamente em instantes.'),
			);
			if (getErrorCode(error) === 'INVALID_CREDENTIALS') {
				form.resetField('password');
				form.setFocus('password');
			}
		}
	});

	return {
		form,
		onSubmit,
		submitError,
		sessionExpired: sessionExpired && !submitError,
	};
}
