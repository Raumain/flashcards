import { createFileRoute, Outlet } from '@tanstack/react-router'
import { MobileNav, Navbar } from '~/components/layout'

export const Route = createFileRoute('/dashboard')({
	component: DashboardLayout,
})

function DashboardLayout() {
	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />
			<MobileNav />

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<Outlet />
			</main>
		</div>
	)
}
