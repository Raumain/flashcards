/// <reference types="vite/client" />
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import '../styles/globals.css'

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ title: 'MedFlash - AI-Powered Flashcards' },
			{
				name: 'description',
				content: 'Generate flashcards from medical PDFs using AI',
			},
			// Performance: prevent text size adjustment on mobile
			{ name: 'text-size-adjust', content: '100%' },
			// Theme color for browser chrome
			{ name: 'theme-color', content: '#2563eb' },
		],
		links: [
			// Preconnect to Gemini API
			{ rel: 'preconnect', href: 'https://generativelanguage.googleapis.com' },
			// DNS prefetch for faster API calls
			{ rel: 'dns-prefetch', href: 'https://generativelanguage.googleapis.com' },
		],
	}),
	component: RootComponent,
	notFoundComponent: NotFoundPage,
})

function NotFoundPage() {
	return (
		<main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
			<div className="text-center max-w-md">
				<h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
				<h2 className="text-2xl font-semibold text-gray-900 mb-2">Page Not Found</h2>
				<p className="text-gray-600 mb-8">
					The page you're looking for doesn't exist or has been moved.
				</p>
				<a
					href="/"
					className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
				>
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M10 19l-7-7m0 0l7-7m-7 7h18"
						/>
					</svg>
					Back to Home
				</a>
			</div>
		</main>
	)
}

function RootComponent() {
	return (
		<RootDocument>
			<Outlet />
		</RootDocument>
	)
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<a
					href="#main-content"
					className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50"
				>
					Skip to main content
				</a>
				{children}
				<Scripts />
			</body>
		</html>
	)
}
