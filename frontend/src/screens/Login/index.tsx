import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { Alert, Button, IconButton, InputAdornment, Typography } from '@mui/material';
import { useState } from 'react';
import { FormTextField } from '@/components/Form/TextField';
import { BrandMark } from '@/layout/styles';
import { useLoginForm } from './_hooks/useLoginForm';
import { Aside, Form, FormArea, Page, Statement, Wordmark } from './styles';

export default function Login() {
	const { form, onSubmit, submitError, sessionExpired } = useLoginForm();
	const [showPassword, setShowPassword] = useState(false);
	const { isSubmitting } = form.formState;

	return (
		<Page>
			<Aside>
				<Wordmark>
					<BrandMark aria-hidden>F</BrandMark>
					FastMeals
				</Wordmark>
				<Statement>Cada pedido, da cozinha até a porta do cliente.</Statement>
			</Aside>

			<FormArea>
				<Form onSubmit={onSubmit} noValidate aria-labelledby="login-title">
					<div>
						<Typography id="login-title" variant="h1" component="h1">
							Entrar
						</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
							Use o e-mail e a senha da sua conta da operação.
						</Typography>
					</div>

					{sessionExpired ? (
						<Alert severity="info">Sua sessão expirou. Entre novamente para continuar.</Alert>
					) : null}
					{submitError ? <Alert severity="error">{submitError}</Alert> : null}

					<FormTextField
						control={form.control}
						name="email"
						label="E-mail"
						type="email"
						autoComplete="username"
						size="medium"
					/>
					<FormTextField
						control={form.control}
						name="password"
						label="Senha"
						type={showPassword ? 'text' : 'password'}
						autoComplete="current-password"
						size="medium"
						InputProps={{
							endAdornment: (
								<InputAdornment position="end">
									<IconButton
										aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
										onClick={() => setShowPassword((visible) => !visible)}
										edge="end"
										size="small"
									>
										{showPassword ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
									</IconButton>
								</InputAdornment>
							),
						}}
					/>

					<Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
						{isSubmitting ? 'Entrando…' : 'Entrar'}
					</Button>
				</Form>
			</FormArea>
		</Page>
	);
}
