import { memo, useCallback, useMemo, useState } from 'react'
import type { Flashcard, PageImage } from '~/lib/types/flashcard'
import { FlashcardItem } from './FlashcardItem'

interface FlashcardGridProps {
	flashcards: Flashcard[]
	pageImages?: PageImage[]
	onFlashcardFlip?: (id: string, isFlipped: boolean) => void
}

type DifficultyFilter = 'all' | Flashcard['difficulty']

/**
 * Memoized FlashcardGrid component
 * Uses useMemo for filtered results and React.memo for child components
 */
export const FlashcardGrid = memo(function FlashcardGrid({
	flashcards,
	pageImages,
	onFlashcardFlip,
}: FlashcardGridProps) {
	const [categoryFilter, setCategoryFilter] = useState<string>('all')
	const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all')

	// Extract unique categories from flashcards
	const categories = useMemo(() => {
		const uniqueCategories = new Set(flashcards.map((f) => f.category))
		return Array.from(uniqueCategories).sort()
	}, [flashcards])

	// Filter flashcards
	const filteredFlashcards = useMemo(() => {
		return flashcards.filter((flashcard) => {
			const matchesCategory = categoryFilter === 'all' || flashcard.category === categoryFilter
			const matchesDifficulty =
				difficultyFilter === 'all' || flashcard.difficulty === difficultyFilter
			return matchesCategory && matchesDifficulty
		})
	}, [flashcards, categoryFilter, difficultyFilter])

	const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
		setCategoryFilter(e.target.value)
	}, [])

	const handleDifficultyChange = useCallback((difficulty: DifficultyFilter) => {
		setDifficultyFilter(difficulty)
	}, [])

	if (flashcards.length === 0) {
		return (
			<div className="text-center py-12">
				<p className="text-gray-500">Aucune flashcard à afficher</p>
			</div>
		)
	}

	return (
		<div>
			{/* Filters */}
			<div className="mb-6 flex flex-col sm:flex-row gap-4">
				{/* Category Filter */}
				<div className="flex-1">
					<label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
						Catégorie
					</label>
					<select
						id="category-filter"
						value={categoryFilter}
						onChange={handleCategoryChange}
						className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="all">Toutes les catégories ({flashcards.length})</option>
						{categories.map((category) => {
							const count = flashcards.filter((f) => f.category === category).length
							return (
								<option key={category} value={category}>
									{category} ({count})
								</option>
							)
						})}
					</select>
				</div>

				{/* Difficulty Filter */}
				<fieldset className="w-full sm:w-auto">
					<legend className="block text-sm font-medium text-gray-700 mb-1">Difficulté</legend>
					<div className="flex flex-wrap gap-1">
						<DifficultyButton
							label="Tous"
							isActive={difficultyFilter === 'all'}
							onClick={() => handleDifficultyChange('all')}
						/>
						<DifficultyButton
							label="Facile"
							isActive={difficultyFilter === 'easy'}
							onClick={() => handleDifficultyChange('easy')}
							colorClass="hover:bg-green-50 hover:text-green-700 hover:border-green-300"
							activeClass="bg-green-100 text-green-700 border-green-300"
						/>
						<DifficultyButton
							label="Moyen"
							isActive={difficultyFilter === 'medium'}
							onClick={() => handleDifficultyChange('medium')}
							colorClass="hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-300"
							activeClass="bg-yellow-100 text-yellow-700 border-yellow-300"
						/>
						<DifficultyButton
							label="Difficile"
							isActive={difficultyFilter === 'hard'}
							onClick={() => handleDifficultyChange('hard')}
							colorClass="hover:bg-red-50 hover:text-red-700 hover:border-red-300"
							activeClass="bg-red-100 text-red-700 border-red-300"
						/>
					</div>
				</fieldset>
			</div>

			{/* Results Count */}
			<p className="text-sm text-gray-500 mb-4">
				Affichage de {filteredFlashcards.length} sur {flashcards.length} flashcards
			</p>

			{/* Grid */}
			{filteredFlashcards.length > 0 ? (
				<ul
					className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0"
					aria-label="Flashcards"
				>
					{filteredFlashcards.map((flashcard) => (
						<li key={flashcard.id}>
							<FlashcardItem
								flashcard={flashcard}
								pageImages={pageImages}
								onFlip={onFlashcardFlip}
							/>
						</li>
					))}
				</ul>
			) : (
				<div className="text-center py-12 bg-gray-50 rounded-lg">
					<p className="text-gray-500">Aucune flashcard ne correspond à vos filtres</p>
					<button
						type="button"
						onClick={() => {
							setCategoryFilter('all')
							setDifficultyFilter('all')
						}}
						className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
					>
						Effacer les filtres
					</button>
				</div>
			)}
		</div>
	)
})

// Memoized difficulty filter button component
interface DifficultyButtonProps {
	label: string
	isActive: boolean
	onClick: () => void
	colorClass?: string
	activeClass?: string
}

const DifficultyButton = memo(function DifficultyButton({
	label,
	isActive,
	onClick,
	colorClass = 'hover:bg-gray-100',
	activeClass = 'bg-gray-100 text-gray-900 border-gray-400',
}: DifficultyButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
				isActive ? activeClass : `bg-white text-gray-600 border-gray-300 ${colorClass}`
			}`}
			aria-pressed={isActive}
		>
			{label}
		</button>
	)
})
