import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { FlashcardGrid, ThematicButton, ThematicCard } from '~/components/flashcards'
import { getFlashcardsByThematic } from '~/server/functions/flashcards'
import { getThematics, type ThematicWithCount } from '~/server/functions/thematics'

export const Route = createFileRoute('/dashboard/flashcards')({
	component: FlashcardsPage,
})

function FlashcardsPage() {
	const [selectedThematic, setSelectedThematic] = useState<string | null>(null)

	// Charger les thématiques
	const {
		data: thematics,
		isLoading: isLoadingThematics,
		error: thematicsError,
	} = useQuery({
		queryKey: ['thematics'],
		queryFn: () => getThematics(),
	})

	// Charger les flashcards de la thématique sélectionnée
	const { data: flashcards, isLoading: isLoadingFlashcards } = useQuery({
		queryKey: ['flashcards', selectedThematic],
		queryFn: async () => {
			if (!selectedThematic) return []
			return getFlashcardsByThematic({ data: { thematicId: selectedThematic } })
		},
		enabled: !!selectedThematic,
	})

	// Get current thematic details
	const currentThematic = selectedThematic
		? thematics?.find((t: ThematicWithCount) => t.id === selectedThematic)
		: null

	if (isLoadingThematics) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
			</div>
		)
	}

	if (thematicsError) {
		return (
			<div className="text-center py-12">
				<p className="text-red-600">Erreur lors du chargement des thématiques.</p>
			</div>
		)
	}

	const hasThematics = thematics && thematics.length > 0
	const totalFlashcards = hasThematics
		? thematics.reduce((acc: number, t: ThematicWithCount) => acc + t.flashcardCount, 0)
		: 0

	return (
		<div>
			{/* Header */}
			<div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Mes Flashcards</h1>
					<p className="mt-1 text-gray-600">
						{hasThematics
							? `${thematics.length} thématique${thematics.length > 1 ? 's' : ''}, ${totalFlashcards} flashcard${totalFlashcards > 1 ? 's' : ''} au total`
							: 'Aucune flashcard pour le moment'}
					</p>
				</div>
				{hasThematics && (
					<div className="flex items-center gap-3">
						{totalFlashcards > 0 && (
							<button
								type="button"
								disabled
								title="Mode étude bientôt disponible"
								className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-400 font-medium rounded-lg cursor-not-allowed"
							>
								<PlayIcon className="h-4 w-4" />
								<span className="hidden sm:inline">Étudier</span>
							</button>
						)}
						<Link
							to="/"
							className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
						>
							<PlusIcon className="h-4 w-4" />
							<span className="hidden sm:inline">Nouveau PDF</span>
						</Link>
					</div>
				)}
			</div>

			{/* Empty state */}
			{!hasThematics && (
				<div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
					<div className="text-5xl mb-4">📚</div>
					<h2 className="text-xl font-semibold text-gray-900 mb-2">Aucune flashcard créée</h2>
					<p className="text-gray-600 mb-6 max-w-md mx-auto">
						Uploadez un PDF médical pour générer automatiquement des flashcards et commencer à
						étudier.
					</p>
					<Link
						to="/"
						className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
					>
						<UploadIcon className="h-5 w-5" />
						Générer des flashcards
					</Link>
				</div>
			)}

			{/* Thematic list + Flashcards */}
			{hasThematics && (
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
					{/* Sidebar - Thematic list */}
					<div className="lg:col-span-1">
						<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
							<div className="p-4 border-b border-gray-200">
								<h2 className="font-semibold text-gray-900">Thématiques</h2>
							</div>
							<nav className="p-2">
								<button
									type="button"
									onClick={() => setSelectedThematic(null)}
									className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
										selectedThematic === null
											? 'bg-blue-50 text-blue-700'
											: 'hover:bg-gray-50 text-gray-700'
									}`}
								>
									<span className="text-sm font-medium">Toutes les thématiques</span>
								</button>
								{thematics.map((thematic: ThematicWithCount) => (
									<ThematicButton
										key={thematic.id}
										thematic={{
											...thematic,
											color: thematic.color ?? '#3B82F6',
											description: thematic.description ?? null,
											icon: thematic.icon ?? '📚',
											pdfName: thematic.pdfName ?? null,
										}}
										isSelected={selectedThematic === thematic.id}
										onClick={() => setSelectedThematic(thematic.id)}
									/>
								))}
							</nav>
						</div>
					</div>

					{/* Main content - Flashcards */}
					<div className="lg:col-span-3">
						{selectedThematic === null ? (
							<AllThematicsView thematics={thematics} onSelect={setSelectedThematic} />
						) : isLoadingFlashcards ? (
							<div className="flex items-center justify-center py-12">
								<div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
							</div>
						) : flashcards && flashcards.length > 0 ? (
							<div>
								{/* Thematic header with back button */}
								<div className="mb-6">
									<button
										type="button"
										onClick={() => setSelectedThematic(null)}
										className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-3"
									>
										<ChevronLeftIcon className="h-4 w-4" />
										Retour aux thématiques
									</button>
									<div className="flex items-start gap-4">
										<span
											className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
											style={{
												backgroundColor: `${currentThematic?.color ?? '#3B82F6'}20`,
												color: currentThematic?.color ?? '#3B82F6',
											}}
										>
											{currentThematic?.icon ?? '📚'}
										</span>
										<div className="flex-1 min-w-0">
											<h2 className="text-xl font-semibold text-gray-900">
												{currentThematic?.name}
											</h2>
											{currentThematic?.description && (
												<p className="mt-1 text-sm text-gray-600">{currentThematic.description}</p>
											)}
											<div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
												<span>
													{flashcards.length} flashcard{flashcards.length > 1 ? 's' : ''}
												</span>
												{currentThematic?.pdfName && (
													<span className="flex items-center gap-1">
														<DocumentIcon className="h-4 w-4" />
														{currentThematic.pdfName}
													</span>
												)}
											</div>
										</div>
										<button
											type="button"
											disabled
											title="Mode étude bientôt disponible"
											className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed"
										>
											<PlayIcon className="h-4 w-4" />
											Étudier
										</button>
									</div>
								</div>
								<FlashcardGrid
									flashcards={flashcards.map((f: (typeof flashcards)[number]) => ({
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
								/>
							</div>
						) : (
							<div className="text-center py-12 text-gray-500">
								Aucune flashcard dans cette thématique.
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}

interface AllThematicsViewProps {
	thematics: ThematicWithCount[]
	onSelect: (id: string) => void
}

function AllThematicsView({ thematics }: AllThematicsViewProps) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
			{thematics.map((thematic) => (
				<ThematicCard
					key={thematic.id}
					thematic={{
						...thematic,
						color: thematic.color ?? '#3B82F6',
						description: thematic.description ?? null,
						icon: thematic.icon ?? '📚',
						pdfName: thematic.pdfName ?? null,
					}}
				/>
			))}
		</div>
	)
}

// Icons
function UploadIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<title>Upload</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
			/>
		</svg>
	)
}

function ChevronLeftIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<title>Retour</title>
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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
