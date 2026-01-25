import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import type { ThematicWithCount } from '~/server/functions/thematics'

interface TopicSelectorProps {
	thematics: ThematicWithCount[]
}

export function TopicSelector({ thematics }: TopicSelectorProps) {
	const [selected, setSelected] = useState<string[]>([])
	const navigate = useNavigate()

	const toggleThematic = (id: string) => {
		setSelected((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
	}

	const selectAll = () => {
		setSelected(thematics.map((t) => t.id))
	}

	const deselectAll = () => {
		setSelected([])
	}

	const startStudy = () => {
		if (selected.length === 0) return

		navigate({
			to: '/study/session',
			search: { thematics: selected.join(',') },
		})
	}

	const totalCards = thematics
		.filter((t) => selected.includes(t.id))
		.reduce((acc, t) => acc + t.flashcardCount, 0)

	if (thematics.length === 0) {
		return (
			<div className="text-center py-12">
				<div className="text-6xl mb-4">📚</div>
				<h2 className="text-xl font-semibold text-gray-900 mb-2">Aucune thématique disponible</h2>
				<p className="text-gray-600 mb-6">Commencez par générer des flashcards depuis un PDF</p>
				<a
					href="/"
					className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
				>
					Générer des flashcards
				</a>
			</div>
		)
	}

	return (
		<div>
			{/* Actions rapides */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex gap-2">
					<button
						type="button"
						onClick={selectAll}
						className="text-sm text-blue-600 hover:text-blue-700 font-medium"
					>
						Tout sélectionner
					</button>
					<span className="text-gray-300">|</span>
					<button
						type="button"
						onClick={deselectAll}
						className="text-sm text-gray-600 hover:text-gray-700"
					>
						Tout désélectionner
					</button>
				</div>
				{selected.length > 0 && (
					<span className="text-sm text-gray-600">
						{totalCards} carte{totalCards > 1 ? 's' : ''} sélectionnée
						{totalCards > 1 ? 's' : ''}
					</span>
				)}
			</div>

			{/* Grille de thématiques */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
				{thematics.map((thematic) => {
					const isSelected = selected.includes(thematic.id)
					return (
						<button
							key={thematic.id}
							type="button"
							onClick={() => toggleThematic(thematic.id)}
							className={`p-4 rounded-xl border-2 text-left transition-all ${
								isSelected
									? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
									: 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
							}`}
						>
							<div className="flex items-start gap-3">
								{/* Checkbox visuel */}
								<div
									className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
										isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'
									}`}
								>
									{isSelected && (
										<svg
											className="w-3 h-3 text-white"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											strokeWidth={3}
											aria-hidden="true"
										>
											<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
										</svg>
									)}
								</div>

								{/* Contenu */}
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-1">
										<span className="text-xl">{thematic.icon}</span>
										<h3 className="font-medium text-gray-900 truncate">{thematic.name}</h3>
									</div>
									{thematic.description && (
										<p className="text-sm text-gray-500 line-clamp-2 mb-2">
											{thematic.description}
										</p>
									)}
									<p className="text-sm text-gray-600">
										<span className="font-medium">{thematic.flashcardCount}</span> flashcard
										{thematic.flashcardCount > 1 ? 's' : ''}
									</p>
								</div>
							</div>
						</button>
					)
				})}
			</div>

			{/* Bouton démarrer */}
			<div className="flex justify-center">
				<button
					type="button"
					onClick={startStudy}
					disabled={selected.length === 0}
					className="px-8 py-3 bg-blue-600 text-white font-medium rounded-xl
                     hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                     transition-colors shadow-sm"
				>
					{selected.length === 0
						? 'Sélectionnez au moins une thématique'
						: `Commencer avec ${selected.length} thématique${selected.length > 1 ? 's' : ''} (${totalCards} cartes)`}
				</button>
			</div>
		</div>
	)
}
