import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { TopicSelector } from '~/components/study'
import { LoadingSpinner } from '~/components/ui'
import { getThematics } from '~/server/functions/thematics'

export const Route = createFileRoute('/study/')({
	component: StudyPage,
})

function StudyPage() {
	const {
		data: thematics,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['thematics'],
		queryFn: () => getThematics(),
	})

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
							<h1 className="text-xl font-bold text-gray-900">Mode Étude</h1>
							<p className="text-sm text-gray-600">Sélectionnez les thématiques à réviser</p>
						</div>
					</div>
				</div>
			</header>

			{/* Content */}
			<main className="max-w-4xl mx-auto py-8 px-4">
				{isLoading ? (
					<div className="flex flex-col items-center justify-center py-12 gap-3">
						<LoadingSpinner size="lg" />
						<p className="text-gray-600">Chargement des thématiques...</p>
					</div>
				) : error ? (
					<div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
						<p className="text-red-600">Erreur lors du chargement des thématiques</p>
						<button
							type="button"
							onClick={() => window.location.reload()}
							className="mt-4 text-sm text-red-700 hover:underline"
						>
							Réessayer
						</button>
					</div>
				) : (
					<TopicSelector thematics={thematics ?? []} />
				)}
			</main>
		</div>
	)
}
