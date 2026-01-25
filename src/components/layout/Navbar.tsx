import { Link, useLocation } from '@tanstack/react-router'
import { UserMenu } from './UserMenu'

interface NavItem {
	name: string
	href: '/dashboard' | '/dashboard/flashcards' | '/dashboard/settings'
	icon: React.ComponentType<{ className?: string }>
}

const navigation: NavItem[] = [
	{ name: "Vue d'ensemble", href: '/dashboard', icon: HomeIcon },
	{ name: 'Mes flashcards', href: '/dashboard/flashcards', icon: CardStackIcon },
	{ name: 'Paramètres', href: '/dashboard/settings', icon: SettingsIcon },
]

export function Navbar() {
	const location = useLocation()

	const isActive = (href: string) => {
		if (href === '/dashboard') return location.pathname === '/dashboard'
		return location.pathname.startsWith(href)
	}

	return (
		<header className="sticky top-0 z-40 bg-white border-b border-gray-200">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">
					<Link to="/" className="flex items-center gap-2">
						<span className="text-2xl">🩺</span>
						<span className="text-xl font-bold text-gray-900">MedFlash</span>
					</Link>
					<nav className="hidden md:flex items-center gap-1">
						{navigation.map((item) => (
							<Link
								key={item.href}
								to={item.href}
								className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
									isActive(item.href)
										? 'bg-blue-50 text-blue-700'
										: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
								}`}
							>
								<item.icon className="h-4 w-4" />
								{item.name}
							</Link>
						))}
					</nav>
					<UserMenu />
				</div>
			</div>
		</header>
	)
}

interface MobileNavProps {
	className?: string
}

export function MobileNav({ className = '' }: MobileNavProps) {
	const location = useLocation()

	const isActive = (href: string) => {
		if (href === '/dashboard') return location.pathname === '/dashboard'
		return location.pathname.startsWith(href)
	}

	return (
		<nav className={`md:hidden bg-white border-b border-gray-200 px-4 py-2 ${className}`}>
			<div className="flex items-center gap-1 overflow-x-auto">
				{navigation.map((item) => (
					<Link
						key={item.href}
						to={item.href}
						className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
							isActive(item.href) ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
						}`}
					>
						<item.icon className="h-4 w-4" />
						{item.name}
					</Link>
				))}
			</div>
		</nav>
	)
}

// Icons
function HomeIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			aria-hidden="true"
		>
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
		<svg
			className={className}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			aria-hidden="true"
		>
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

function SettingsIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			aria-hidden="true"
		>
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
