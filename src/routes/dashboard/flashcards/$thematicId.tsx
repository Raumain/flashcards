import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { FlashcardGrid } from '~/components/flashcards'
import { deleteFlashcard, getFlashcardsByThematic } from '~/server/functions/flashcards'
import { deleteThematic, getThematic } from '~/server/functions/thematics'

export const Route = createFileRoute('/dashboard/flashcards/$thematicId')({
	component: ThematicDetailPage,
})

function ThematicDetailPage() {
	const { thematicId } = Route.useParams()
	const navigate = useNavigate()
	const queryClient = useQueryClient()

	// Modal state
	const [deleteModal, setDeleteModal] = useState<{
		isOpen: boolean
		type: 'flashcard' | 'thematic'
		id: string
		name?: string
	} | null>(null)

	// Charger la thématique
	const {
		data: thematic,
		isLoading: isLoadingThematic,
		error: thematicError,
	} = useQuery({
		queryKey: ['thematic', thematicId],
		queryFn: () => getThematic({ data: { id: thematicId } }),
	})

	// Charger les flashcards
	const { data: flashcards, isLoading: isLoadingFlashcards } = useQuery({
		queryKey: ['flashcards', thematicId],
		queryFn: () => getFlashcardsByThematic({ data: { thematicId } }),
		enabled: !!thematic,
	})

	// Mutation pour supprimer une flashcard
	const deleteFlashcardMutation = useMutation({
		mutationFn: (id: string) => deleteFlashcard({ data: { id } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['flashcards', thematicId] })
			queryClient.invalidateQueries({ queryKey: ['thematic', thematicId] })
			queryClient.invalidateQueries({ queryKey: ['thematics'] })
			setDeleteModal(null)
		},
	})

	// Mutation pour supprimer la thématique
	const deleteThematicMutation = useMutation({
		mutationFn: (id: string) => deleteThematic({ data: { id } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['thematics'] })
			navigate({ to: '/dashboard/flashcards' })
		},
	})

	const handleDeleteFlashcard = useCallback((id: string) => {
		setDeleteModal({ isOpen: true, type: 'flashcard', id })
	}, [])

	const handleDeleteThematic = useCallback(() => {
		if (thematic) {
			setDeleteModal({
				isOpen: true,
				type: 'thematic',
				id: thematicId,
				name: thematic.name,
			})
		}
	}, [thematic, thematicId])

	const confirmDelete = useCallback(() => {
		if (!deleteModal) return
		if (deleteModal.type === 'flashcard') {
			deleteFlashcardMutation.mutate(deleteModal.id)
		} else {
			deleteThematicMutation.mutate(deleteModal.id)
		}
	}, [deleteModal, deleteFlashcardMutation, deleteThematicMutation])

	// Loading state
	if (isLoadingThematic) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
			</div>
		)
	}

	// Error state
	if (thematicError || !thematic) {
		return (
			<div className="text-center py-12">
				<div className="text-5xl mb-4">😕</div>
				<h2 className="text-xl font-semibold text-gray-900 mb-2">Thématique introuvable</h2>
				<p className="text-gray-600 mb-6">
					Cette thématique n'existe pas ou vous n'y avez pas accès.
				</p>
				<Link
					to="/dashboard/flashcards"
					className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
				>
					<ChevronLeftIcon className="h-4 w-4" />
					Retour aux flashcards
				</Link>
			</div>
		)
	}

	return (
		<div>
			{/* Breadcrumb */}
			<nav className="mb-6">
				<ol className="flex items-center gap-2 text-sm">
					<li>
						<Link
							to="/dashboard/flashcards"
							className="text-gray-500 hover:text-gray-700 transition-colors"
						>
							Mes Flashcards
						</Link>
					</li>
					<li className="text-gray-400">/</li>
					<li className="text-gray-900 font-medium truncate max-w-xs">{thematic.name}</li>
				</ol>
			</nav>

			{/* Header */}
			<div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
				<div className="flex flex-col sm:flex-row sm:items-start gap-4">
					<span
						className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
						style={{
							backgroundColor: `${thematic.color ?? '#3B82F6'}20`,
							color: thematic.color ?? '#3B82F6',
						}}
					>
						{thematic.icon ?? '📚'}
					</span>
					<div className="flex-1 min-w-0">
						<h1 className="text-2xl font-bold text-gray-900">{thematic.name}</h1>
						{thematic.description && <p className="mt-1 text-gray-600">{thematic.description}</p>}
						<div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
							<span className="flex items-center gap-1.5">
								<CardsIcon className="h-4 w-4" />
								{thematic.flashcardCount} flashcard
								{thematic.flashcardCount > 1 ? 's' : ''}
							</span>
							{thematic.pdfName && (
								<span className="flex items-center gap-1.5">
									<DocumentIcon className="h-4 w-4" />
									{thematic.pdfName}
								</span>
							)}
							<span className="flex items-center gap-1.5">
								<CalendarIcon className="h-4 w-4" />
								Créée le{' '}
								{new Date(thematic.createdAt).toLocaleDateString('fr-FR', {
									day: 'numeric',
									month: 'long',
									year: 'numeric',
								})}
							</span>
						</div>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						<button
							type="button"
							disabled
							title="Mode étude bientôt disponible"
							className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed"
						>
							<PlayIcon className="h-4 w-4" />
							Étudier
						</button>
						<button
							type="button"
							onClick={handleDeleteThematic}
							className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
						>
							<TrashIcon className="h-4 w-4" />
							<span className="hidden sm:inline">Supprimer</span>
						</button>
					</div>
				</div>
			</div>

			{/* Flashcards */}
			{isLoadingFlashcards ? (
				<div className="flex items-center justify-center py-12">
					<div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
				</div>
			) : flashcards && flashcards.length > 0 ? (
				<div>
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-lg font-semibold text-gray-900">Toutes les flashcards</h2>
					</div>
					<FlashcardGrid
						flashcards={flashcards.map((f) => ({
							id: f.id,
							front: {
								question: (f.front as { question: string }).question,
								imageDescription: (f.front as { imageDescription?: string }).imageDescription,
							},
							back: {
								answer: (f.back as { answer: string }).answer,
								details: (f.back as { details?: string }).details,
								imageDescription: (f.back as { imageDescription?: string }).imageDescription,
							},
							category: f.category ?? 'General',
							difficulty: f.difficulty as 'easy' | 'medium' | 'hard',
						}))}
						onDeleteFlashcard={handleDeleteFlashcard}
					/>
				</div>
			) : (
				<div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
					<div className="text-5xl mb-4">🃏</div>
					<h2 className="text-xl font-semibold text-gray-900 mb-2">Aucune flashcard</h2>
					<p className="text-gray-600 mb-6 max-w-md mx-auto">
						Cette thématique ne contient pas encore de flashcards.
					</p>
					<Link
						to="/"
						className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
					>
						<PlusIcon className="h-5 w-5" />
						Générer des flashcards
					</Link>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			{deleteModal?.isOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					{/* Backdrop - biome-ignore comments on next line */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: Backdrop uses click only */}
					{/* biome-ignore lint/a11y/noStaticElementInteractions: Backdrop pattern */}
					<div className="absolute inset-0 bg-black/50" onClick={() => setDeleteModal(null)} />

					{/* Modal */}
					<div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
						<div className="text-center">
							<div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
								<TrashIcon className="h-6 w-6 text-red-600" />
							</div>
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								{deleteModal.type === 'flashcard'
									? 'Supprimer cette flashcard ?'
									: 'Supprimer cette thématique ?'}
							</h3>
							<p className="text-gray-600 mb-6">
								{deleteModal.type === 'flashcard'
									? 'Cette action est irréversible. La flashcard sera définitivement supprimée.'
									: `Cette action est irréversible. La thématique "${deleteModal.name}" et toutes ses flashcards seront définitivement supprimées.`}
							</p>
							<div className="flex items-center justify-center gap-3">
								<button
									type="button"
									onClick={() => setDeleteModal(null)}
									className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
								>
									Annuler
								</button>
								<button
									type="button"
									onClick={confirmDelete}
									disabled={deleteFlashcardMutation.isPending || deleteThematicMutation.isPending}
									className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
								>
									{(deleteFlashcardMutation.isPending || deleteThematicMutation.isPending) && (
										<div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
									)}
									Supprimer
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

// Icons
function ChevronLeftIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<title>Retour</title>
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
		</svg>
	)
}

function PlayIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<title>Étudier</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
			/>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
	)
}

function TrashIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<title>Supprimer</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
			/>
		</svg>
	)
}

function DocumentIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<title>Document</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
			/>
		</svg>
	)
}

function CardsIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<title>Flashcards</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
			/>
		</svg>
	)
}

function CalendarIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<title>Date</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
			/>
		</svg>
	)
}

function PlusIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<title>Ajouter</title>
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
		</svg>
	)
}
