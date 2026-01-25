import { useForm } from '@tanstack/react-form'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { SocialButtons } from '~/components/auth/SocialButtons'
import { signIn } from '~/lib/auth-client'

export const Route = createFileRoute('/signin')({
	component: SignInPage,
})

const signInSchema = z.object({
	email: z.string().email('Email invalide'),
	password: z.string().min(1, 'Le mot de passe est requis'),
})

function SignInPage() {
	const navigate = useNavigate()
	const [error, setError] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const form = useForm({
		defaultValues: {
			email: '',
			password: '',
		},
		validators: {
			onChange: signInSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				setError(null)
				setIsSubmitting(true)
				await signIn.email(
					{
						email: value.email,
						password: value.password,
					},
					{
						onSuccess: () => {
							navigate({ to: '/' })
						},
						onError: (ctx) => {
							const errorMessage = ctx.error?.message || 'Erreur lors de la connexion'
							// Map common error codes to French messages
							if (errorMessage.includes('Invalid') || errorMessage.includes('invalid')) {
								setError('Email ou mot de passe incorrect')
							} else if (errorMessage.includes('not found')) {
								setError('Aucun compte avec cet email')
							} else {
								setError(errorMessage)
							}
							setIsSubmitting(false)
						},
					},
				)
			} catch {
				setError('Erreur lors de la connexion')
				setIsSubmitting(false)
			}
		},
	})

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
			<div className="max-w-md w-full">
				{/* En-tête */}
				<div className="text-center mb-8">
					<Link to="/" className="inline-flex items-center gap-2 mb-6">
						<span className="text-3xl">🩺</span>
						<span className="text-2xl font-bold text-gray-900">MedFlash</span>
					</Link>
					<h1 className="text-3xl font-bold text-gray-900">Connexion</h1>
					<p className="mt-2 text-gray-600">Connectez-vous pour accéder à vos flashcards</p>
				</div>

				{/* Connexion sociale */}
				<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
					<SocialButtons mode="signin" />
				</div>

				{/* Séparateur */}
				<div className="flex items-center gap-4 mb-6">
					<div className="flex-1 h-px bg-gray-200" />
					<span className="text-sm text-gray-500">ou par email</span>
					<div className="flex-1 h-px bg-gray-200" />
				</div>

				{/* Formulaire */}
				<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
					{error && (
						<div
							className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
							role="alert"
						>
							{error}
						</div>
					)}

					<form
						onSubmit={(e) => {
							e.preventDefault()
							e.stopPropagation()
							form.handleSubmit()
						}}
						className="space-y-4"
					>
						{/* Champ Email */}
						<form.Field name="email">
							{(field) => (
								<div>
									<label
										htmlFor={field.name}
										className="block text-sm font-medium text-gray-700 mb-1"
									>
										Email
									</label>
									<input
										id={field.name}
										name={field.name}
										type="email"
										autoComplete="email"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										className={`w-full px-3 py-2 border rounded-lg shadow-sm 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      ${
												field.state.meta.isTouched && field.state.meta.errors.length > 0
													? 'border-red-300 bg-red-50'
													: 'border-gray-300'
											}`}
										placeholder="jean.dupont@example.com"
									/>
									{field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
										<p className="mt-1 text-sm text-red-600">
											{field.state.meta.errors[0]?.message}
										</p>
									)}
								</div>
							)}
						</form.Field>

						{/* Champ Mot de passe */}
						<form.Field name="password">
							{(field) => (
								<div>
									<div className="flex items-center justify-between mb-1">
										<label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
											Mot de passe
										</label>
										<button
											type="button"
											className="text-sm text-blue-600 hover:text-blue-700"
											onClick={() => {
												// TODO: Implement forgot password flow
												alert('Fonctionnalité à venir')
											}}
										>
											Mot de passe oublié ?
										</button>
									</div>
									<input
										id={field.name}
										name={field.name}
										type="password"
										autoComplete="current-password"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										className={`w-full px-3 py-2 border rounded-lg shadow-sm 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      ${
												field.state.meta.isTouched && field.state.meta.errors.length > 0
													? 'border-red-300 bg-red-50'
													: 'border-gray-300'
											}`}
										placeholder="••••••••"
									/>
									{field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
										<p className="mt-1 text-sm text-red-600">
											{field.state.meta.errors[0]?.message}
										</p>
									)}
								</div>
							)}
						</form.Field>

						{/* Bouton submit */}
						<button
							type="submit"
							disabled={isSubmitting}
							className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg
                       hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
						>
							{isSubmitting ? (
								<span className="flex items-center justify-center gap-2">
									<svg
										className="w-5 h-5 animate-spin"
										fill="none"
										viewBox="0 0 24 24"
										aria-hidden="true"
									>
										<title>Chargement</title>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										/>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
									</svg>
									Connexion en cours...
								</span>
							) : (
								'Se connecter'
							)}
						</button>
					</form>
				</div>

				{/* Lien inscription */}
				<p className="mt-6 text-center text-sm text-gray-600">
					Pas encore de compte ?{' '}
					<Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
						Créer un compte
					</Link>
				</p>
			</div>
		</div>
	)
}
