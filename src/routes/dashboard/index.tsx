import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useSession } from '~/lib/auth-client'
import {
	getDashboardMetrics,
	getRecentThematics,
	type RecentThematic,
} from '~/server/functions/metrics'

export const Route = createFileRoute('/dashboard/')({
	component: DashboardIndex,
})

function DashboardIndex() {
	const { data: session, isPending: isSessionPending } = useSession()

	const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
		queryKey: ['dashboard-metrics'],
		queryFn: () => getDashboardMetrics(),
		enabled: !!session?.user,
	})

	const { data: recentThematics, isLoading: isLoadingThematics } = useQuery({
		queryKey: ['recent-thematics'],
		queryFn: () => getRecentThematics(),
		enabled: !!session?.user,
	})

	if (isSessionPending) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
			</div>
		)
	}

	if (!session?.user) {
		return (
			<div className="text-center py-12">
				<p className="text-gray-600">Veuillez vous connecter pour accéder au dashboard.</p>
			</div>
		)
	}

	const isLoading = isLoadingMetrics || isLoadingThematics

	return (
		<div>
			<div className="mb-8">
				<h1 className="text-2xl font-bold text-gray-900">
					Bienvenue, {session.user.name ?? 'Utilisateur'} 👋
				</h1>
				<p className="mt-1 text-gray-600">Voici un aperçu de vos activités sur MedFlash.</p>
			</div>

			{/* Stats cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
				{isLoading ? (
					<>
						<div className="bg-gray-100 animate-pulse rounded-xl h-32" />
						<div className="bg-gray-100 animate-pulse rounded-xl h-32" />
						<div className="bg-gray-100 animate-pulse rounded-xl h-32" />
					</>
				) : (
					<>
						<StatCard
							title="Flashcards créées"
							value={metrics?.totalFlashcards.toString() ?? '0'}
							description={`${metrics?.totalThematics ?? 0} thématique${(metrics?.totalThematics ?? 0) > 1 ? 's' : ''}`}
							icon={CardIcon}
						/>
						<StatCard
							title="Sessions d'étude"
							value={metrics?.totalSessions.toString() ?? '0'}
							description={
								metrics?.streak
									? `🔥 ${metrics.streak} jour${metrics.streak > 1 ? 's' : ''} de suite`
									: 'Commencez à étudier'
							}
							icon={BookIcon}
						/>
						<StatCard
							title="Taux de réussite"
							value={metrics?.totalSessions ? `${metrics.successRate}%` : '—'}
							description="Moyenne globale"
							icon={ChartIcon}
						/>
					</>
				)}
			</div>

			{/* Recent thematics */}
			{!isLoading && recentThematics && recentThematics.length > 0 && (
				<div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-lg font-semibold text-gray-900">Thématiques récentes</h2>
						<Link
							to="/dashboard/flashcards"
							className="text-sm text-blue-600 hover:text-blue-700 font-medium"
						>
							Voir tout →
						</Link>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{recentThematics.slice(0, 3).map((thematic: RecentThematic) => (
							<Link
								key={thematic.id}
								to="/dashboard/flashcards"
								className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors group"
							>
								<span
									className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
									style={{
										backgroundColor: `${thematic.color}20`,
										color: thematic.color ?? '#3B82F6',
									}}
								>
									{thematic.icon ?? '📚'}
								</span>
								<div className="flex-1 min-w-0">
									<p className="font-medium text-gray-900 group-hover:text-blue-700 truncate">
										{thematic.name}
									</p>
									<p className="text-sm text-gray-500">
										{thematic.flashcardCount} carte{thematic.flashcardCount > 1 ? 's' : ''}
									</p>
								</div>
							</Link>
						))}
					</div>
				</div>
			)}

			{/* Quick actions */}
			<div className="bg-white rounded-xl border border-gray-200 p-6">
				<h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<ActionCard
						title="Générer des flashcards"
						description="Uploadez un PDF médical pour créer des flashcards"
						href="/"
						icon="📄"
					/>
					<ActionCard
						title="Voir mes flashcards"
						description="Accédez à toutes vos flashcards existantes"
						href="/dashboard/flashcards"
						icon="🗂️"
					/>
				</div>
			</div>
		</div>
	)
}

interface StatCardProps {
	title: string
	value: string
	description: string
	icon: React.ComponentType<{ className?: string }>
}

function StatCard({ title, value, description, icon: Icon }: StatCardProps) {
	return (
		<div className="bg-white rounded-xl border border-gray-200 p-6">
			<div className="flex items-center justify-between mb-4">
				<span className="text-sm font-medium text-gray-600">{title}</span>
				<Icon className="h-5 w-5 text-gray-400" />
			</div>
			<p className="text-3xl font-bold text-gray-900">{value}</p>
			<p className="text-sm text-gray-500 mt-1">{description}</p>
		</div>
	)
}

interface ActionCardProps {
	title: string
	description: string
	href: string
	icon: string
}

function ActionCard({ title, description, href, icon }: ActionCardProps) {
	return (
		<a
			href={href}
			className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 
                 hover:border-blue-300 hover:bg-blue-50/50 transition-colors group"
		>
			<span className="text-2xl">{icon}</span>
			<div>
				<h3 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
					{title}
				</h3>
				<p className="text-sm text-gray-500">{description}</p>
			</div>
		</a>
	)
}

// Icons
function CardIcon({ className }: { className?: string }) {
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

function BookIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<title>Étude</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
			/>
		</svg>
	)
}

function ChartIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<title>Statistiques</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
			/>
		</svg>
	)
}
