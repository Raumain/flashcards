import { Link, useLocation } from '@tanstack/react-router'

interface SidebarItem {
	name: string
	href: string
	icon: React.ComponentType<{ className?: string }>
	disabled?: boolean
}

const navigation: SidebarItem[] = [
	{ name: "Vue d'ensemble", href: '/dashboard', icon: HomeIcon },
	{ name: 'Mes flashcards', href: '/dashboard/flashcards', icon: CardStackIcon },
	{ name: 'Mode étude', href: '/study', icon: PlayIcon, disabled: true },
	{ name: 'Mode révision', href: '/revision', icon: RefreshIcon, disabled: true },
	{ name: 'Paramètres', href: '/dashboard/settings', icon: SettingsIcon },
]

interface SidebarProps {
	className?: string
}

export function Sidebar({ className = '' }: SidebarProps) {
	const location = useLocation()

	const isActive = (href: string) => {
		if (href === '/dashboard') return location.pathname === '/dashboard'
		return location.pathname.startsWith(href)
	}

	return (
		<aside className={`w-64 bg-white border-r border-gray-200 min-h-screen ${className}`}>
			<div className="p-4">
				<Link to="/" className="flex items-center gap-2 mb-8">
					<span className="text-2xl">🩺</span>
					<span className="text-xl font-bold text-gray-900">MedFlash</span>
				</Link>

				<nav className="space-y-1">
					{navigation.map((item) => {
						if (item.disabled) {
							return (
								<span
									key={item.href}
									className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed"
									title="Bientôt disponible"
								>
									<item.icon className="h-5 w-5" />
									{item.name}
									<span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
										Bientôt
									</span>
								</span>
							)
						}

						return (
							<Link
								key={item.href}
								to={item.href as '/dashboard' | '/dashboard/flashcards' | '/dashboard/settings'}
								className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
									isActive(item.href)
										? 'bg-blue-50 text-blue-700'
										: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
								}`}
							>
								<item.icon className="h-5 w-5" />
								{item.name}
							</Link>
						)
					})}
				</nav>
			</div>

			{/* Quick action */}
			<div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
				<Link
					to="/"
					className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
				>
					<UploadIcon className="h-4 w-4" />
					Nouveau PDF
				</Link>
			</div>
		</aside>
	)
}

// Icons
function HomeIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<title>Accueil</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
			/>
		</svg>
	)
}

function CardStackIcon({ className }: { className?: string }) {
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

function RefreshIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<title>Réviser</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
			/>
		</svg>
	)
}

function SettingsIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<title>Paramètres</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
			/>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
			/>
		</svg>
	)
}

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
