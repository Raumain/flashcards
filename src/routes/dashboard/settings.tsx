import { useForm } from '@tanstack/react-form'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { authClient, useSession } from '~/lib/auth-client'

export const Route = createFileRoute('/dashboard/settings')({
	component: SettingsPage,
})

const profileSchema = z.object({
	name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
})

function SettingsPage() {
	const { data: session, isPending } = useSession()
	const navigate = useNavigate()
	const [successMessage, setSuccessMessage] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [isDeleting, setIsDeleting] = useState(false)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

	const form = useForm({
		defaultValues: {
			name: session?.user?.name ?? '',
		},
		validators: {
			onChange: profileSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				setError(null)
				setSuccessMessage(null)

				await authClient.updateUser({
					name: value.name,
				})

				setSuccessMessage('Profil mis à jour avec succès')
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour'
				setError(message)
			}
		},
	})

	if (isPending) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
			</div>
		)
	}

	if (!session?.user) {
		return (
			<div className="text-center py-12">
				<p className="text-gray-600">Veuillez vous connecter pour accéder aux paramètres.</p>
			</div>
		)
	}

	const { user } = session
	const initials = user.name
		? user.name
				.split(' ')
				.map((n) => n[0])
				.join('')
				.toUpperCase()
				.slice(0, 2)
		: (user.email?.charAt(0).toUpperCase() ?? '?')

	const handleDeleteAccount = async () => {
		try {
			setIsDeleting(true)
			await authClient.deleteUser()
			navigate({ to: '/' })
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Erreur lors de la suppression du compte'
			setError(message)
			setIsDeleting(false)
			setShowDeleteConfirm(false)
		}
	}

	return (
		<div className="max-w-2xl">
			<div className="mb-8">
				<h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
				<p className="mt-1 text-gray-600">
					Gérez vos informations personnelles et vos préférences.
				</p>
			</div>

			{/* Success message */}
			{successMessage && (
				<div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
					{successMessage}
				</div>
			)}

			{/* Error message */}
			{error && (
				<div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
					{error}
				</div>
			)}

			{/* Profile section */}
			<section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
				<h2 className="text-lg font-semibold text-gray-900 mb-6">Profil</h2>

				{/* Avatar */}
				<div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
					{user.image ? (
						<img
							src={user.image}
							alt={user.name ?? 'Avatar'}
							className="h-16 w-16 rounded-full object-cover"
						/>
					) : (
						<div
							className="h-16 w-16 rounded-full bg-blue-600 text-white
                         flex items-center justify-center text-xl font-medium"
						>
							{initials}
						</div>
					)}
					<div>
						<p className="font-medium text-gray-900">{user.name}</p>
						<p className="text-sm text-gray-500">{user.email}</p>
					</div>
				</div>

				{/* Profile form */}
				<form
					onSubmit={(e) => {
						e.preventDefault()
						e.stopPropagation()
						form.handleSubmit()
					}}
					className="space-y-4"
				>
					<form.Field name="name">
						{(field) => (
							<div>
								<label
									htmlFor={field.name}
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									Nom
								</label>
								<input
									id={field.name}
									type="text"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           text-gray-900 placeholder:text-gray-400"
									placeholder="Votre nom"
								/>
								{field.state.meta.errors.length > 0 && (
									<p className="mt-1 text-sm text-red-600">{field.state.meta.errors.join(', ')}</p>
								)}
							</div>
						)}
					</form.Field>

					<div>
						<label htmlFor="email-display" className="block text-sm font-medium text-gray-700 mb-1">
							Email
						</label>
						<input
							id="email-display"
							type="email"
							value={user.email ?? ''}
							disabled
							className="w-full px-3 py-2 border border-gray-200 rounded-lg
                       bg-gray-50 text-gray-500 cursor-not-allowed"
						/>
						<p className="mt-1 text-xs text-gray-500">L'email ne peut pas être modifié.</p>
					</div>

					<div className="pt-4">
						<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
							{([canSubmit, isSubmitting]) => (
								<button
									type="submit"
									disabled={!canSubmit || isSubmitting}
									className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg
                           hover:bg-blue-700 transition-colors focus:outline-none
                           focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                           disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
								</button>
							)}
						</form.Subscribe>
					</div>
				</form>
			</section>

			{/* Account section */}
			<section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
				<h2 className="text-lg font-semibold text-gray-900 mb-4">Compte</h2>

				<div className="space-y-4">
					<div className="flex items-center justify-between py-3 border-b border-gray-100">
						<div>
							<p className="font-medium text-gray-900">Méthode de connexion</p>
							<p className="text-sm text-gray-500">
								{user.image?.includes('googleusercontent') ? 'Google' : 'Email / Mot de passe'}
							</p>
						</div>
					</div>

					<div className="flex items-center justify-between py-3 border-b border-gray-100">
						<div>
							<p className="font-medium text-gray-900">Email vérifié</p>
							<p className="text-sm text-gray-500">{user.emailVerified ? 'Oui' : 'Non'}</p>
						</div>
						{user.emailVerified ? (
							<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
								Vérifié
							</span>
						) : (
							<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
								Non vérifié
							</span>
						)}
					</div>

					<div className="flex items-center justify-between py-3">
						<div>
							<p className="font-medium text-gray-900">Membre depuis</p>
							<p className="text-sm text-gray-500">
								{new Date(user.createdAt).toLocaleDateString('fr-FR', {
									year: 'numeric',
									month: 'long',
									day: 'numeric',
								})}
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Danger zone */}
			<section className="bg-white rounded-xl border border-red-200 p-6">
				<h2 className="text-lg font-semibold text-red-600 mb-4">Zone dangereuse</h2>

				<div className="flex items-center justify-between">
					<div>
						<p className="font-medium text-gray-900">Supprimer le compte</p>
						<p className="text-sm text-gray-500">
							Cette action est irréversible. Toutes vos données seront supprimées.
						</p>
					</div>
					<button
						type="button"
						onClick={() => setShowDeleteConfirm(true)}
						className="px-4 py-2 border border-red-300 text-red-600 font-medium rounded-lg
                     hover:bg-red-50 transition-colors focus:outline-none
                     focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
					>
						Supprimer
					</button>
				</div>

				{/* Delete confirmation modal */}
				{showDeleteConfirm && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
						<div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
							<h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmer la suppression</h3>
							<p className="text-gray-600 mb-6">
								Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et
								toutes vos flashcards seront perdues.
							</p>
							<div className="flex justify-end gap-3">
								<button
									type="button"
									onClick={() => setShowDeleteConfirm(false)}
									disabled={isDeleting}
									className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg
                           hover:bg-gray-50 transition-colors disabled:opacity-50"
								>
									Annuler
								</button>
								<button
									type="button"
									onClick={handleDeleteAccount}
									disabled={isDeleting}
									className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg
                           hover:bg-red-700 transition-colors disabled:opacity-50"
								>
									{isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
								</button>
							</div>
						</div>
					</div>
				)}
			</section>
		</div>
	)
}
