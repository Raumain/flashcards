import { Link } from '@tanstack/react-router'
import type { Flashcard } from '~/lib/db/schema'

interface StudyCompleteProps {
	stats: {
		correct: number
		wrong: number
		avgTime: number
		total: number
	}
	flashcards: Flashcard[]
	results: { id: string; correct: boolean; time: number }[]
}

export function StudyComplete({ stats, flashcards, results }: StudyCompleteProps) {
	const successRate = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0

	const wrongCards = results
		.filter((r) => !r.correct)
		.map((r) => flashcards.find((f) => f.id === r.id))
		.filter((card): card is Flashcard => card !== undefined)

	return (
		<div className="min-h-screen bg-gray-50 py-8 px-4">
			<div className="max-w-lg mx-auto">
				{/* Résumé */}
				<div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
					<div className="text-6xl mb-4" aria-hidden="true">
						{successRate >= 80 ? '🎉' : successRate >= 50 ? '💪' : '📚'}
					</div>

					<h1 className="text-2xl font-bold text-gray-900 mb-2">Session terminée !</h1>

					<p className="text-gray-600 mb-6">
						{successRate >= 80
							? 'Excellent travail !'
							: successRate >= 50
								? 'Bon effort, continuez !'
								: 'Continuez à réviser !'}
					</p>

					{/* Statistiques */}
					<div className="grid grid-cols-3 gap-4 mb-8">
						<div className="bg-green-50 rounded-xl p-4">
							<p className="text-2xl font-bold text-green-600">{stats.correct}</p>
							<p className="text-sm text-green-700">Correct</p>
						</div>
						<div className="bg-red-50 rounded-xl p-4">
							<p className="text-2xl font-bold text-red-600">{stats.wrong}</p>
							<p className="text-sm text-red-700">Incorrect</p>
						</div>
						<div className="bg-blue-50 rounded-xl p-4">
							<p className="text-2xl font-bold text-blue-600">{successRate}%</p>
							<p className="text-sm text-blue-700">Réussite</p>
						</div>
					</div>

					{/* Temps moyen si disponible */}
					{stats.avgTime > 0 && (
						<p className="text-sm text-gray-500 mb-6">Temps moyen par carte : {stats.avgTime}s</p>
					)}

					{/* Actions */}
					<div className="flex flex-col gap-3">
						<Link
							to="/study"
							className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-xl
                       hover:bg-blue-700 transition-colors text-center"
						>
							Nouvelle session
						</Link>
						<Link
							to="/dashboard"
							className="w-full px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl
                       hover:bg-gray-200 transition-colors text-center"
						>
							Retour au dashboard
						</Link>
					</div>
				</div>

				{/* Cartes incorrectes */}
				{wrongCards.length > 0 && (
					<div className="mt-8 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
						<h2 className="text-lg font-semibold text-gray-900 mb-4">
							À réviser ({wrongCards.length})
						</h2>
						<ul className="space-y-3">
							{wrongCards.map((card) => (
								<li key={card.id} className="p-3 bg-red-50 rounded-lg border border-red-100">
									<p className="text-sm text-gray-900 font-medium">{card.front.question}</p>
									<p className="text-xs text-gray-600 mt-1">→ {card.back.answer}</p>
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</div>
	)
}
