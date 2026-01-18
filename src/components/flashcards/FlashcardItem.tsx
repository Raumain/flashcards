import { memo, useCallback, useState } from 'react'
import { ImageLightbox } from '~/components/ui/ImageLightbox'
import type { Flashcard, PageImage } from '~/lib/types/flashcard'

interface FlashcardItemProps {
	flashcard: Flashcard
	pageImages?: PageImage[]
	onFlip?: (id: string, isFlipped: boolean) => void
}

interface LightboxState {
	isOpen: boolean
	imageUrl: string
	alt: string
}

const DIFFICULTY_COLORS: Record<Flashcard['difficulty'], { bg: string; text: string }> = {
	easy: { bg: 'bg-green-100', text: 'text-green-700' },
	medium: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
	hard: { bg: 'bg-red-100', text: 'text-red-700' },
}

const DIFFICULTY_LABELS: Record<Flashcard['difficulty'], string> = {
	easy: 'Facile',
	medium: 'Moyen',
	hard: 'Difficile',
}

/**
 * Helper to get image URL from page index
 */
function getImageUrl(
	pageImages: PageImage[] | undefined,
	pageIndex: number | undefined,
): string | null {
	if (pageIndex === undefined || !pageImages) return null
	const pageImage = pageImages.find((img) => img.pageIndex === pageIndex)
	if (!pageImage) return null
	return `data:${pageImage.mimeType};base64,${pageImage.base64}`
}

/**
 * Memoized FlashcardItem component
 * Prevents re-renders when parent state changes but flashcard data is unchanged
 */
export const FlashcardItem = memo(function FlashcardItem({
	flashcard,
	pageImages,
	onFlip,
}: FlashcardItemProps) {
	const [isFlipped, setIsFlipped] = useState(false)
	const [lightbox, setLightbox] = useState<LightboxState>({
		isOpen: false,
		imageUrl: '',
		alt: '',
	})

	const handleFlip = useCallback(() => {
		const newFlipped = !isFlipped
		setIsFlipped(newFlipped)
		onFlip?.(flashcard.id, newFlipped)
	}, [isFlipped, flashcard.id, onFlip])

	const openLightbox = useCallback((imageUrl: string, alt: string) => {
		setLightbox({ isOpen: true, imageUrl, alt })
	}, [])

	const closeLightbox = useCallback(() => {
		setLightbox((prev) => ({ ...prev, isOpen: false }))
	}, [])

	// Fallback to 'medium' if difficulty is undefined or invalid
	const difficultyStyle = DIFFICULTY_COLORS[flashcard.difficulty] ?? DIFFICULTY_COLORS.medium
	const difficultyLabel = DIFFICULTY_LABELS[flashcard.difficulty] ?? 'Moyen'

	// Get image URL for back side (use front.imagePageIndex as fallback for backwards compatibility)
	// Gemini may set imagePageIndex on front or back depending on the content
	const imagePageIndex = flashcard.back.imagePageIndex ?? flashcard.front.imagePageIndex
	const imageDescription =
		flashcard.back.imageDescription || flashcard.front.imageDescription || 'Schéma de la réponse'
	const backImageUrl = getImageUrl(pageImages, imagePageIndex)

	// Handle card click for flip (but not when clicking on image)
	const handleCardClick = useCallback(
		(e: React.MouseEvent) => {
			// Don't flip if clicking on the image button
			if ((e.target as HTMLElement).closest('[data-image-button]')) {
				return
			}
			handleFlip()
		},
		[handleFlip],
	)

	return (
		// biome-ignore lint/a11y/useSemanticElements: tqt je gère
		<div
			className="perspective-1000 h-auto min-h-64 cursor-pointer w-full text-left"
			onClick={handleCardClick}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault()
					handleFlip()
				}
			}}
			role="button"
			tabIndex={0}
			aria-label={`Flashcard: ${isFlipped ? 'affiche la réponse' : 'affiche la question'}. Appuyez sur Entrée ou Espace pour retourner.`}
			aria-pressed={isFlipped}
		>
			<div
				className={`relative min-h-64 w-full transition-transform duration-500 transform-style-3d ${
					isFlipped ? 'rotate-y-180' : ''
				}`}
			>
				{/* Front Side - Question */}
				<div
					className="absolute inset-0 backface-hidden bg-white rounded-lg border border-gray-200 p-4 sm:p-5 flex flex-col shadow-sm"
					aria-hidden={isFlipped}
				>
					{/* Header */}
					<div className="flex items-center justify-between mb-3">
						<span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
							{flashcard.category}
						</span>
						<span
							className={`text-xs font-medium px-2 py-1 rounded ${difficultyStyle.bg} ${difficultyStyle.text}`}
						>
							{difficultyLabel}
						</span>
					</div>

					{/* Question */}
					<div className="flex-1 flex items-center justify-center">
						<p className="text-gray-900 text-center font-medium leading-relaxed">
							{flashcard.front.question}
						</p>
					</div>

					{/* Flip hint */}
					<div className="mt-3 text-center">
						<span className="text-xs text-gray-400">Cliquez pour voir la réponse</span>
					</div>
				</div>

				{/* Back Side - Answer */}
				<div
					className="absolute inset-0 backface-hidden rotate-y-180 bg-blue-50 rounded-lg border border-blue-200 p-4 sm:p-5 flex flex-col shadow-sm overflow-y-auto"
					aria-hidden={!isFlipped}
				>
					{/* Header */}
					<div className="flex items-center justify-between mb-3 shrink-0">
						<span className="text-xs font-medium text-blue-600">Réponse</span>
						<span
							className={`text-xs font-medium px-2 py-1 rounded ${difficultyStyle.bg} ${difficultyStyle.text}`}
						>
							{DIFFICULTY_LABELS[flashcard.difficulty]}
						</span>
					</div>

					{/* Answer */}
					<div className="shrink-0">
						<p className="text-gray-900 font-medium text-sm leading-relaxed">{flashcard.back.answer}</p>

						{/* Details */}
						{flashcard.back.details && (
							<div className="mt-2 pt-2 border-t border-blue-200">
								<p className="text-sm text-gray-600 leading-relaxed">{flashcard.back.details}</p>
							</div>
						)}
					</div>

					{/* Actual Image from PDF - only on back/answer side */}
					{backImageUrl && (
						<button
							type="button"
							data-image-button
							className="mt-3 rounded border border-blue-200 overflow-hidden group cursor-zoom-in w-full text-left shrink-0"
							onClick={(e) => {
								e.stopPropagation()
								openLightbox(backImageUrl, imageDescription)
							}}
							aria-label="Agrandir l'image"
						>
							<div className="relative">
								<img
									src={backImageUrl}
									alt={imageDescription}
									className="w-full h-24 object-contain bg-blue-100 transition-transform group-hover:scale-105"
								/>
								{/* Zoom indicator */}
								<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
									<span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-2 py-1 rounded">
										🔍 Agrandir
									</span>
								</div>
							</div>
							{imageDescription && imageDescription !== 'Schéma de la réponse' && (
								<p className="text-xs text-blue-700 italic text-center p-2 bg-blue-100">
									{imageDescription}
								</p>
							)}
						</button>
					)}

					{/* Flip hint */}
					<div className="mt-3 text-center shrink-0">
						<span className="text-xs text-blue-400">Cliquez pour voir la question</span>
					</div>
				</div>
			</div>

			{/* Image Lightbox */}
			{/* Image Lightbox */}
			<ImageLightbox
				isOpen={lightbox.isOpen}
				imageUrl={lightbox.imageUrl}
				alt={lightbox.alt}
				onClose={closeLightbox}
			/>
		</div>
	)
})
