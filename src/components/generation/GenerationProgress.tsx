import { useCallback } from 'react'

export type GenerationStep = 'uploading' | 'processing' | 'generating' | 'complete'

interface GenerationProgressProps {
	currentStep: GenerationStep
	streamingText?: string
	onCancel?: () => void
	isComplete?: boolean
	error?: string | null
}

interface StepConfig {
	label: string
	description: string
}

const STEPS: Record<GenerationStep, StepConfig> = {
	uploading: {
		label: 'Téléchargement',
		description: 'Envoi de votre PDF au serveur...',
	},
	processing: {
		label: 'Traitement',
		description: 'Extraction du texte et analyse du contenu...',
	},
	generating: {
		label: 'Génération',
		description: "Création des flashcards avec l'IA...",
	},
	complete: {
		label: 'Terminé',
		description: 'Vos flashcards sont prêtes !',
	},
}

const STEP_ORDER: GenerationStep[] = ['uploading', 'processing', 'generating', 'complete']

function getStepIndex(step: GenerationStep): number {
	return STEP_ORDER.indexOf(step)
}

export function GenerationProgress({
	currentStep,
	streamingText,
	onCancel,
	isComplete = false,
	error = null,
}: GenerationProgressProps) {
	const currentIndex = getStepIndex(currentStep)

	const handleCancel = useCallback(() => {
		onCancel?.()
	}, [onCancel])

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLButtonElement>) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault()
				handleCancel()
			}
		},
		[handleCancel],
	)

	return (
		<section
			className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6"
			aria-label="Progression de la génération"
			aria-live="polite"
		>
			{/* Step Indicator */}
			<div className="mb-6 flex justify-center">
				<div className="flex items-center mb-2">
					{STEP_ORDER.slice(0, -1).map((step, index) => {
						const isActive = index === currentIndex
						const isCompleted = index < currentIndex
						const stepConfig = STEPS[step]
						const isLastStep = index === STEP_ORDER.length - 2

						return (
							<div key={step} className="flex items-center">
								{/* Step Circle */}
								<div className="flex flex-col items-center">
									<div
										className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-colors ${
											isCompleted
												? 'bg-blue-600 text-white'
												: isActive
													? 'bg-blue-100 text-blue-700 ring-2 ring-blue-600'
													: 'bg-gray-100 text-gray-400'
										}`}
										aria-current={isActive ? 'step' : undefined}
									>
										{isCompleted ? <CheckIcon className="w-4 h-4" /> : index + 1}
									</div>
									<span
										className={`hidden sm:block text-xs mt-1 font-medium ${
											isActive ? 'text-blue-700' : isCompleted ? 'text-gray-700' : 'text-gray-400'
										}`}
									>
										{stepConfig.label}
									</span>
								</div>

								{/* Connector Line */}
								{!isLastStep && (
									<div
										className={`w-12 sm:w-20 h-0.5 mx-2 transition-colors ${
											isCompleted ? 'bg-blue-600' : 'bg-gray-200'
										}`}
										aria-hidden="true"
									/>
								)}
							</div>
						)
					})}
				</div>
			</div>

			{/* Current Step Description */}
			<div className="text-center mb-4">
				<p className="text-sm text-gray-600">{STEPS[currentStep].description}</p>
			</div>

			{/* Error State */}
			{error && (
				<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
					<div className="flex items-start gap-2">
						<ErrorIcon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
						<p className="text-sm text-red-700">{error}</p>
					</div>
				</div>
			)}

			{/* Streaming Output */}
			{streamingText && currentStep === 'generating' && (
				<div className="mb-4">
					<div className="bg-gray-50 rounded-lg border border-gray-200 p-4 max-h-48 overflow-y-auto">
						<pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
							{streamingText}
							<span
								className="inline-block w-2 h-4 bg-blue-600 animate-pulse ml-0.5"
								aria-hidden="true"
							/>
						</pre>
					</div>
				</div>
			)}

			{/* Progress Bar */}
			{!isComplete && !error && (
				<div className="mb-4">
					<div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
						<div
							className="h-full bg-blue-600 rounded-full transition-all duration-500 animate-pulse"
							style={{ width: `${((currentIndex + 1) / STEP_ORDER.length) * 100}%` }}
							role="progressbar"
							aria-valuenow={(currentIndex + 1) * 25}
							aria-valuemin={0}
							aria-valuemax={100}
						/>
					</div>
				</div>
			)}

			{/* Complete State */}
			{isComplete && (
				<div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
					<div className="flex items-center gap-2">
						<CheckCircleIcon className="w-5 h-5 text-green-600" />
						<p className="text-sm text-green-700 font-medium">Flashcards générées avec succès !</p>
					</div>
				</div>
			)}

			{/* Cancel Button */}
			{onCancel && !isComplete && !error && (
				<div className="flex justify-center">
					<button
						type="button"
						onClick={handleCancel}
						onKeyDown={handleKeyDown}
						className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
						aria-label="Annuler la génération"
					>
						Annuler
					</button>
				</div>
			)}
		</section>
	)
}

// Icon Components
function CheckIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="3"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<polyline points="20 6 9 17 4 12" />
		</svg>
	)
}

function CheckCircleIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="10" />
			<polyline points="16 10 11 15 8 12" />
		</svg>
	)
}

function ErrorIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="10" />
			<line x1="12" y1="8" x2="12" y2="12" />
			<line x1="12" y1="16" x2="12.01" y2="16" />
		</svg>
	)
}
