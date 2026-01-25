import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { RevisionCardPreview, ThresholdSlider } from '~/components/study'
import { LoadingSpinner } from '~/components/ui'
import { getRevisionCards } from '~/server/functions/study'

export const Route = createFileRoute('/revision/')({
	component: RevisionPage,
})

function RevisionPage() {
	const [threshold, setThreshold] = useState(3)
	const navigate = useNavigate()

	const { data: cards, isLoading } = useQuery({
		queryKey: ['revision-cards', threshold],
		queryFn: () => getRevisionCards({ data: { threshold } }),
	})

	const startRevision = () => {
		if (!cards?.length) return
		navigate({
			to: '/revision/session',
			search: { threshold },
		})
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white border-b border-gray-200">
				<div className="max-w-4xl mx-auto px-4 py-4">
					<div className="flex items-center gap-4">
						<Link
							to="/dashboard"
							className="text-gray-500 hover:text-gray-700 transition-colors"
							title="Retour au dashboard"
						>
							<svg
								className="w-5 h-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={2}
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M10 19l-7-7m0 0l7-7m-7 7h18"
								/>
							</svg>
							<span className="sr-only">Retour au dashboard</span>
						</Link>
						<div>
							<h1 className="text-xl font-bold text-gray-900">Mode Révision</h1>
							<p className="text-sm text-gray-600">
								Révisez les cartes qui vous posent le plus de difficultés
							</p>
						</div>
					</div>
				</div>
			</header>

			{/* Content */}
			<main className="max-w-4xl mx-auto py-8 px-4">
				{/* Sélecteur de seuil */}
				<div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
					<ThresholdSlider value={threshold} onChange={setThreshold} min={1} max={10} />
				</div>

				{/* Aperçu des cartes */}
				<div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
					{isLoading ? (
						<div className="flex flex-col items-center justify-center py-8 gap-3">
							<LoadingSpinner size="md" />
							<p className="text-sm text-gray-500">Chargement des cartes...</p>
						</div>
					) : cards && cards.length > 0 ? (
						<>
							<h2 className="text-lg font-semibold text-gray-900 mb-4">
								{cards.length} carte{cards.length > 1 ? 's' : ''} à réviser
							</h2>

							<ul className="space-y-2 mb-6 max-h-80 overflow-y-auto">
								{cards.slice(0, 10).map((card) => (
									<li key={card.id}>
										<RevisionCardPreview card={card} />
									</li>
								))}
								{cards.length > 10 && (
									<li className="text-center text-sm text-gray-500 py-2">
										... et {cards.length - 10} autre{cards.length - 10 > 1 ? 's' : ''}
									</li>
								)}
							</ul>

							<button
								type="button"
								onClick={startRevision}
								className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
							>
								Commencer la révision
							</button>
						</>
					) : (
						<div className="text-center py-12">
							<span className="text-6xl mb-4 block" aria-hidden="true">
								🎉
							</span>
							<h3 className="text-lg font-semibold text-gray-900">Félicitations !</h3>
							<p className="text-gray-600 mt-2">
								Aucune carte ne correspond à ce seuil d'erreurs.
								<br />
								Continuez à étudier régulièrement !
							</p>
							<Link
								to="/study"
								className="inline-block mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
							>
								Aller au mode étude
							</Link>
						</div>
					)}
				</div>
			</main>
		</div>
	)
}
