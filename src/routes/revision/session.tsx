import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { StudyComplete, StudyProgress, SwipeableCard } from '~/components/study'
import { LoadingSpinner } from '~/components/ui'
import { getRevisionCards, recordStudyResult } from '~/server/functions/study'

export const Route = createFileRoute('/revision/session')({
	component: RevisionSessionPage,
	validateSearch: (search: Record<string, unknown>) => ({
		threshold: Number(search.threshold) || 3,
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

function RevisionSessionPage() {
	const { threshold } = Route.useSearch()

	const [currentIndex, setCurrentIndex] = useState(0)
	const [results, setResults] = useState<{ id: string; correct: boolean; time: number }[]>([])
	const [cardStartTime, setCardStartTime] = useState(Date.now())

	const queryClient = useQueryClient()

	const { data: revisionCards, isLoading } = useQuery({
		queryKey: ['revision-session-cards', threshold],
		queryFn: () => getRevisionCards({ data: { threshold } }),
		select: (data) => shuffleArray(data),
		staleTime: Number.POSITIVE_INFINITY,
	})

	const recordMutation = useMutation({
		mutationFn: recordStudyResult,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
			queryClient.invalidateQueries({ queryKey: ['revision-cards'] })
		},
	})

	const currentCard = revisionCards?.[currentIndex]
	const isComplete = revisionCards && currentIndex >= revisionCards.length

	const handleSwipe = async (direction: 'left' | 'right') => {
		if (!currentCard) return

		const responseTime = Date.now() - cardStartTime
		const isCorrect = direction === 'right'

		setResults((prev) => [...prev, { id: currentCard.id, correct: isCorrect, time: responseTime }])

		recordMutation.mutate({
			data: {
				flashcardId: currentCard.id,
				isCorrect,
				responseTime,
			},
		})

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

	const flashcardsForComplete = useMemo(() => {
		if (!revisionCards) return []
		return revisionCards.map((card) => ({
			id: card.id,
			thematicId: card.thematicId,
			userId: card.userId,
			front: card.front,
			back: card.back,
			category: card.category,
			difficulty: card.difficulty,
			createdAt: card.createdAt,
			updatedAt: card.updatedAt,
		}))
	}, [revisionCards])

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen gap-4">
				<LoadingSpinner size="lg" />
				<p className="text-gray-600">Chargement des cartes...</p>
			</div>
		)
	}

	if (!revisionCards?.length) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
				<div className="text-6xl" aria-hidden="true">
					&#127881;
				</div>
				<p className="text-gray-600 text-center">Aucune carte avec ce seuil</p>
				<Link to="/revision" className="text-blue-600 hover:underline font-medium">
					Modifier le seuil
				</Link>
			</div>
		)
	}

	if (isComplete) {
		return <StudyComplete stats={stats} flashcards={flashcardsForComplete} results={results} />
	}

	return (
		<div className="min-h-screen bg-gray-50 py-8 px-4">
			<div className="max-w-lg mx-auto">
				<div className="mb-6">
					<Link
						to="/revision"
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
						<span>Quitter la revision</span>
					</Link>
				</div>

				<div className="mb-4 text-center">
					<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-medium">
						Mode Revision
					</span>
				</div>

				<StudyProgress
					current={currentIndex + 1}
					total={revisionCards.length}
					correct={stats.correct}
					wrong={stats.wrong}
				/>

				<div className="mt-8 relative">
					{currentCard && (
						<>
							<RevisionBadge errorCount={currentCard.errorCount} />
							<SwipeableCard key={currentCard.id} flashcard={currentCard} onSwipe={handleSwipe} />
						</>
					)}
				</div>

				<div className="mt-8 flex justify-center gap-8 text-sm text-gray-500">
					<div className="flex items-center gap-2">
						<span
							className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-600"
							aria-hidden="true"
						>
							&#8592;
						</span>
						<span>Incorrect</span>
					</div>
					<div className="flex items-center gap-2">
						<span>Correct</span>
						<span
							className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 text-green-600"
							aria-hidden="true"
						>
							&#8594;
						</span>
					</div>
				</div>

				<p className="mt-6 text-center text-xs text-gray-400">
					Cliquez sur la carte pour la retourner, puis swipez pour repondre
				</p>
			</div>
		</div>
	)
}

function RevisionBadge({ errorCount }: { errorCount: number }) {
	const getBadgeClasses = (): string => {
		if (errorCount >= 5) return 'bg-red-100 text-red-700 border-red-200'
		if (errorCount >= 3) return 'bg-orange-100 text-orange-700 border-orange-200'
		return 'bg-yellow-100 text-yellow-700 border-yellow-200'
	}

	return (
		<div
			className={`absolute -top-3 right-4 z-20 px-3 py-1 rounded-full text-xs font-medium border ${getBadgeClasses()}`}
		>
			{errorCount} erreur{errorCount > 1 ? 's' : ''}
		</div>
	)
}
