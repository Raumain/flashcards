import { Link } from '@tanstack/react-router'
import { useState } from 'react'

export interface ThematicCardData {
	id: string
	name: string
	description: string | null
	color: string | null
	icon: string
	pdfName: string | null
	flashcardCount: number
}

interface ThematicCardProps {
	thematic: ThematicCardData
	onDelete?: () => void
}

export function ThematicCard({ thematic, onDelete }: ThematicCardProps) {
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

	return (
		<div className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all group relative">
			<Link
				to="/dashboard/flashcards/$thematicId"
				params={{ thematicId: thematic.id }}
				className="block p-6"
			>
				<div className="flex items-start gap-4">
					<span
						className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
						style={{
							backgroundColor: `${thematic.color}20`,
							color: thematic.color ?? '#3B82F6',
						}}
					>
						{thematic.icon ?? '📚'}
					</span>
					<div className="flex-1 min-w-0">
						<h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
							{thematic.name}
						</h3>
						<p className="text-sm text-gray-500 mt-1">
							{thematic.flashcardCount} flashcard{thematic.flashcardCount > 1 ? 's' : ''}
						</p>
						{thematic.description && (
							<p className="text-sm text-gray-600 mt-2 line-clamp-2">{thematic.description}</p>
						)}
						{thematic.pdfName && (
							<p className="text-xs text-gray-400 mt-2 truncate flex items-center gap-1">
								<DocumentIcon className="h-3 w-3" />
								{thematic.pdfName}
							</p>
						)}
					</div>
					<ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors shrink-0" />
				</div>
			</Link>

			{/* Delete button - visible on hover */}
			{onDelete && (
				<button
					type="button"
					onClick={(e) => {
						e.preventDefault()
						e.stopPropagation()
						setShowDeleteConfirm(true)
					}}
					className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
					title="Supprimer cette thématique"
				>
					<TrashIcon className="h-4 w-4" />
				</button>
			)}

			{/* Delete confirmation modal */}
			{showDeleteConfirm && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
					onClick={() => setShowDeleteConfirm(false)}
					onKeyDown={(e) => e.key === 'Escape' && setShowDeleteConfirm(false)}
				>
					<div
						className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
						onClick={(e) => e.stopPropagation()}
						onKeyDown={() => {}}
					>
						<h3 className="text-lg font-semibold text-gray-900 mb-2">Supprimer la thématique ?</h3>
						<p className="text-gray-600 mb-6">
							Cette action supprimera également toutes les flashcards associées (
							{thematic.flashcardCount} carte{thematic.flashcardCount > 1 ? 's' : ''}).
						</p>
						<div className="flex justify-end gap-3">
							<button
								type="button"
								onClick={() => setShowDeleteConfirm(false)}
								className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
							>
								Annuler
							</button>
							<button
								type="button"
								onClick={() => {
									setShowDeleteConfirm(false)
									onDelete?.()
								}}
								className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
							>
								Supprimer
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

// Compact version for sidebar/list usage
interface ThematicButtonProps {
	thematic: ThematicCardData
	isSelected: boolean
	onClick: () => void
}

export function ThematicButton({ thematic, isSelected, onClick }: ThematicButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-3 ${
				isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
			}`}
		>
			<span
				className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
				style={{ backgroundColor: `${thematic.color}20`, color: thematic.color ?? '#3B82F6' }}
			>
				{thematic.icon ?? '📚'}
			</span>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium truncate">{thematic.name}</p>
				<p className="text-xs text-gray-500">{thematic.flashcardCount} cartes</p>
			</div>
		</button>
	)
}

// Icons
function ChevronRightIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<title>Voir</title>
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
		</svg>
	)
}

function TrashIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<title>Supprimer</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
			/>
		</svg>
	)
}

function DocumentIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<title>Document</title>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
			/>
		</svg>
	)
}
