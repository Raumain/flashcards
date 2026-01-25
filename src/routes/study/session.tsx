import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { StudyComplete, StudyProgress, SwipeableCard } from '~/components/study'
import { LoadingSpinner } from '~/components/ui'
import { getFlashcardsByThematics } from '~/server/functions/flashcards'
import { recordStudyResult } from '~/server/functions/study'

export const Route = createFileRoute('/study/session')({
	component: StudySessionPage,
	validateSearch: (search: Record<string, unknown>) => ({
		thematics: (search.thematics as string) || '',
	}),
})

function shuffleArray<T>(array: T[]): T[] {
	const shuffled = [...array]
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
	}
	return shuffled
}

function StudySessionPage() {
	const { thematics } = Route.useSearch()
	const thematicIds = thematics.split(',').filter(Boolean)

	const [currentIndex, setCurrentIndex] = useState(0)
	const [results, setResults] = useState<{ id: string; correct: boolean; time: number }[]>([])
	const [cardStartTime, setCardStartTime] = useState(Date.now())

	const queryClient = useQueryClient()

	const { data: flashcards, isLoading } = useQuery({
		queryKey: ['study-flashcards', thematicIds],
		queryFn: () => getFlashcardsByThematics({ data: { thematicIds } }),
		select: (data) => shuffleArray(data),
		staleTime: Number.POSITIVE_INFINITY, // Ne pas recharger pendant la session
	})

	const recordMutation = useMutation({
		mutationFn: recordStudyResult,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
		},
	})

	const currentCard = flashcards?.[currentIndex]
	const isComplete = flashcards && currentIndex >= flashcards.length

	const handleSwipe = async (direction: 'left' | 'right') => {
		if (!currentCard) return

		const responseTime = Date.now() - cardStartTime
		const isCorrect = direction === 'right'

		// Enregistrer localement
		setResults((prev) => [...prev, { id: currentCard.id, correct: isCorrect, time: responseTime }])

		// Enregistrer en base (fire and forget)
		recordMutation.mutate({
			data: {
				flashcardId: currentCard.id,
				isCorrect,
				responseTime,
			},
		})

		// Passer à la carte suivante
		setCurrentIndex((prev) => prev + 1)
		setCardStartTime(Date.now())
	}

	const stats = useMemo(() => {
		const correct = results.filter((r) => r.correct).length
		const wrong = results.filter((r) => !r.correct).length
		const avgTime =
			results.length > 0
				? Math.round(results.reduce((acc, r) => acc + r.time, 0) / results.length / 1000)
				: 0

		return { correct, wrong, avgTime, total: results.length }
	}, [results])

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen gap-4">
				<LoadingSpinner size="lg" />
				<p className="text-gray-600">Chargement des flashcards...</p>
			</div>
		)
	}

	if (!flashcards?.length) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
				<div className="text-6xl">📭</div>
				<p className="text-gray-600 text-center">Aucune flashcard trouvée pour ces thématiques</p>
				<Link to="/study" className="text-blue-600 hover:underline font-medium">
					Retour à la sélection
				</Link>
			</div>
		)
	}

	if (isComplete) {
		return <StudyComplete stats={stats} flashcards={flashcards} results={results} />
	}

	return (
		<div className="min-h-screen bg-gray-50 py-8 px-4">
			<div className="max-w-lg mx-auto">
				{/* Header avec retour */}
				<div className="mb-6">
					<Link
						to="/study"
						className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
					>
						<svg
							className="w-4 h-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
							aria-hidden="true"
						>
							<path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
						</svg>
						<span>Quitter la session</span>
					</Link>
				</div>

				{/* Progression */}
				<StudyProgress
					current={currentIndex + 1}
					total={flashcards.length}
					correct={stats.correct}
					wrong={stats.wrong}
				/>

				{/* Carte à swiper */}
				<div className="mt-8">
					{currentCard && (
						<SwipeableCard key={currentCard.id} flashcard={currentCard} onSwipe={handleSwipe} />
					)}
				</div>

				{/* Instructions */}
				<div className="mt-8 flex justify-center gap-8 text-sm text-gray-500">
					<div className="flex items-center gap-2">
						<span
							className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-600"
							aria-hidden="true"
						>
							←
						</span>
						<span>Incorrect</span>
					</div>
					<div className="flex items-center gap-2">
						<span>Correct</span>
						<span
							className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 text-green-600"
							aria-hidden="true"
						>
							→
						</span>
					</div>
				</div>

				{/* Keyboard shortcuts hint */}
				<p className="mt-6 text-center text-xs text-gray-400">
					Cliquez sur la carte pour la retourner, puis swipez pour répondre
				</p>
			</div>
		</div>
	)
}
