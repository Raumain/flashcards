import { motion, type PanInfo, useMotionValue, useTransform } from 'framer-motion'
import { useState } from 'react'
import type { Flashcard } from '~/lib/db/schema'

interface SwipeableCardProps {
	flashcard: Flashcard
	onSwipe: (direction: 'left' | 'right') => void
}

export function SwipeableCard({ flashcard, onSwipe }: SwipeableCardProps) {
	const [isFlipped, setIsFlipped] = useState(false)
	const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null)

	const x = useMotionValue(0)

	// Opacité des indicateurs en fonction du drag
	const rightIndicatorOpacity = useTransform(x, [0, 100], [0, 1])
	const leftIndicatorOpacity = useTransform(x, [-100, 0], [1, 0])

	// Rotation de la carte pendant le drag
	const rotate = useTransform(x, [-200, 200], [-15, 15])

	// Scale pendant le drag pour effet de profondeur
	const scale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95])

	const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
		const threshold = 100

		if (info.offset.x > threshold) {
			setExitDirection('right')
			onSwipe('right')
		} else if (info.offset.x < -threshold) {
			setExitDirection('left')
			onSwipe('left')
		}
	}

	const flipCard = (e: React.MouseEvent) => {
		// Empêche le flip pendant le drag
		if (Math.abs(x.get()) > 10) return
		e.stopPropagation()
		setIsFlipped(!isFlipped)
	}

	return (
		<div className="relative w-full max-w-md mx-auto h-96">
			{/* Indicateur gauche (incorrect) */}
			<motion.div
				style={{ opacity: leftIndicatorOpacity }}
				className="absolute left-4 top-1/2 -translate-y-1/2 z-10
                   w-16 h-16 flex items-center justify-center
                   rounded-full bg-red-500 text-white text-2xl font-bold
                   shadow-lg"
				aria-hidden="true"
			>
				✗
			</motion.div>

			{/* Indicateur droite (correct) */}
			<motion.div
				style={{ opacity: rightIndicatorOpacity }}
				className="absolute right-4 top-1/2 -translate-y-1/2 z-10
                   w-16 h-16 flex items-center justify-center
                   rounded-full bg-green-500 text-white text-2xl font-bold
                   shadow-lg"
				aria-hidden="true"
			>
				✓
			</motion.div>

			{/* Carte draggable */}
			<motion.div
				style={{ x, rotate, scale }}
				drag="x"
				dragConstraints={{ left: 0, right: 0 }}
				dragElastic={0.7}
				onDragEnd={handleDragEnd}
				animate={
					exitDirection
						? {
								x: exitDirection === 'right' ? 500 : -500,
								opacity: 0,
								transition: { duration: 0.3, ease: 'easeOut' },
							}
						: {}
				}
				className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
				role="button"
				tabIndex={0}
				aria-label={`Flashcard: ${flashcard.front.question}`}
				onClick={flipCard}
				onKeyDown={(e) => {
					if (e.key === ' ' || e.key === 'Enter') {
						e.preventDefault()
						setIsFlipped(!isFlipped)
					}
				}}
			>
				{/* Container 3D */}
				<div className="w-full h-full perspective-1000">
					<motion.div
						animate={{ rotateY: isFlipped ? 180 : 0 }}
						transition={{ duration: 0.5, ease: 'easeInOut' }}
						className="relative w-full h-full transform-style-3d"
					>
						{/* Face avant (Question) */}
						<div className="absolute inset-0 backface-hidden">
							<div
								className="w-full h-full bg-white rounded-2xl shadow-xl border border-gray-200 p-6
                            flex flex-col select-none"
							>
								{/* Header */}
								<div className="flex items-center justify-between mb-4">
									<span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
										Question
									</span>
									{flashcard.difficulty && (
										<span
											className={`text-xs font-medium px-2 py-1 rounded-full ${
												flashcard.difficulty === 'easy'
													? 'bg-green-100 text-green-700'
													: flashcard.difficulty === 'medium'
														? 'bg-yellow-100 text-yellow-700'
														: 'bg-red-100 text-red-700'
											}`}
										>
											{flashcard.difficulty === 'easy'
												? 'Facile'
												: flashcard.difficulty === 'medium'
													? 'Moyen'
													: 'Difficile'}
										</span>
									)}
								</div>

								{/* Question */}
								<div className="flex-1 flex items-center justify-center px-2">
									<p className="text-xl text-gray-900 text-center leading-relaxed">
										{flashcard.front.question}
									</p>
								</div>

								{/* Category & hint */}
								<div className="mt-4 space-y-2">
									{flashcard.category && (
										<p className="text-xs text-gray-500 text-center">📁 {flashcard.category}</p>
									)}
									<p className="text-center text-sm text-gray-400">Cliquez pour voir la réponse</p>
								</div>
							</div>
						</div>

						{/* Face arrière (Réponse) */}
						<div className="absolute inset-0 backface-hidden rotate-y-180">
							<div
								className="w-full h-full bg-gradient-to-br from-blue-50 to-white 
                            rounded-2xl shadow-xl border border-blue-200 p-6
                            flex flex-col select-none"
							>
								{/* Header */}
								<span className="text-xs font-semibold text-green-600 uppercase tracking-wider">
									Réponse
								</span>

								{/* Answer */}
								<div className="flex-1 flex flex-col items-center justify-center gap-4 px-2">
									<p className="text-xl text-gray-900 text-center font-medium leading-relaxed">
										{flashcard.back.answer}
									</p>
									{flashcard.back.details && (
										<p className="text-sm text-gray-600 text-center leading-relaxed">
											{flashcard.back.details}
										</p>
									)}
								</div>

								{/* Swipe instructions */}
								<div className="mt-4 flex items-center justify-center gap-6 text-sm">
									<span className="flex items-center gap-1 text-red-500">
										<span className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100">
											←
										</span>
										<span className="text-gray-600">Incorrect</span>
									</span>
									<span className="flex items-center gap-1 text-green-500">
										<span className="text-gray-600">Correct</span>
										<span className="w-6 h-6 flex items-center justify-center rounded-full bg-green-100">
											→
										</span>
									</span>
								</div>
							</div>
						</div>
					</motion.div>
				</div>
			</motion.div>
		</div>
	)
}
