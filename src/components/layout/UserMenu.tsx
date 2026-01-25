import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { signOut, useSession } from '~/lib/auth-client'

export function UserMenu() {
	const { data: session, isPending } = useSession()
	const [isOpen, setIsOpen] = useState(false)
	const [isSigningOut, setIsSigningOut] = useState(false)
	const menuRef = useRef<HTMLDivElement>(null)
	const navigate = useNavigate()

	// Close menu when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsOpen(false)
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside)
			return () => document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isOpen])

	// Close menu on Escape key
	useEffect(() => {
		function handleEscape(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				setIsOpen(false)
			}
		}

		if (isOpen) {
			document.addEventListener('keydown', handleEscape)
			return () => document.removeEventListener('keydown', handleEscape)
		}
	}, [isOpen])

	const handleSignOut = async () => {
		try {
			setIsSigningOut(true)
			await signOut()
			setIsOpen(false)
			navigate({ to: '/' })
		} catch (error) {
			console.error('Erreur lors de la déconnexion:', error)
		} finally {
			setIsSigningOut(false)
		}
	}

	// Loading state
	if (isPending) {
		return <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
	}

	// Not authenticated - show login button
	if (!session?.user) {
		return (
			<Link
				to="/signin"
				className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg
                   hover:bg-blue-700 transition-colors focus:outline-none
                   focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
			>
				Connexion
			</Link>
		)
	}

	const { user } = session
	const initials = user.name
		? user.name
				.split(' ')
				.map((n) => n[0])
				.join('')
				.toUpperCase()
				.slice(0, 2)
		: (user.email?.charAt(0).toUpperCase() ?? '?')

	return (
		<div className="relative" ref={menuRef}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				aria-expanded={isOpen}
				aria-haspopup="true"
				className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100
                   transition-colors focus:outline-none focus:ring-2
                   focus:ring-blue-500 focus:ring-offset-2"
			>
				{user.image ? (
					<img
						src={user.image}
						alt={user.name ?? 'Avatar'}
						className="h-8 w-8 rounded-full object-cover"
					/>
				) : (
					<div
						className="h-8 w-8 rounded-full bg-blue-600 text-white
                       flex items-center justify-center text-sm font-medium"
					>
						{initials}
					</div>
				)}
				<span className="hidden sm:block text-sm font-medium text-gray-700 max-w-32 truncate">
					{user.name ?? user.email}
				</span>
				<svg
					className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<title>Menu</title>
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{isOpen && (
				<div
					className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg
                     border border-gray-200 py-1 z-50"
					role="menu"
					aria-orientation="vertical"
				>
					{/* User info header */}
					<div className="px-4 py-3 border-b border-gray-100">
						<p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
						<p className="text-xs text-gray-500 truncate">{user.email}</p>
					</div>

					{/* Menu items */}
					<div className="py-1">
						<Link
							to="/dashboard"
							onClick={() => setIsOpen(false)}
							className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700
                         hover:bg-gray-50 transition-colors"
							role="menuitem"
						>
							<svg
								className="h-4 w-4 text-gray-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden="true"
							>
								<title>Dashboard</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
								/>
							</svg>
							Dashboard
						</Link>

						<Link
							to="/dashboard/settings"
							onClick={() => setIsOpen(false)}
							className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700
                         hover:bg-gray-50 transition-colors"
							role="menuitem"
						>
							<svg
								className="h-4 w-4 text-gray-400"
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
							Paramètres
						</Link>
					</div>

					{/* Sign out */}
					<div className="border-t border-gray-100 py-1">
						<button
							type="button"
							onClick={handleSignOut}
							disabled={isSigningOut}
							className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600
                         hover:bg-red-50 transition-colors disabled:opacity-50"
							role="menuitem"
						>
							<svg
								className="h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden="true"
							>
								<title>Déconnexion</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
								/>
							</svg>
							{isSigningOut ? 'Déconnexion...' : 'Se déconnecter'}
						</button>
					</div>
				</div>
			)}
		</div>
	)
}
