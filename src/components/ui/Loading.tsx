/**
 * Skeleton loading components for MedFlash
 * Provides visual loading placeholders while content is being fetched
 */

interface SkeletonProps {
	className?: string
}

/**
 * Base skeleton component with pulse animation
 */
export function Skeleton({ className = '' }: SkeletonProps) {
	return (
		<output
			className={`block animate-pulse bg-gray-200 rounded ${className}`}
			aria-label="Loading..."
		/>
	)
}

/**
 * Skeleton for text lines
 */
export function SkeletonText({
	lines = 3,
	className = '',
}: {
	lines?: number
	className?: string
}) {
	return (
		<output className={`block space-y-2 ${className}`} aria-label="Loading text...">
			{Array.from({ length: lines }).map((_, i) => (
				<Skeleton
					key={`skeleton-text-line-${crypto.randomUUID()}`}
					className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
				/>
			))}
		</output>
	)
}

/**
 * Skeleton for a single flashcard
 */
export function SkeletonFlashcard({ className = '' }: SkeletonProps) {
	return (
		<output
			className={`block bg-white rounded-lg border border-gray-200 p-4 sm:p-5 h-56 sm:h-64 ${className}`}
			aria-label="Loading flashcard..."
		>
			{/* Category badge */}
			<div className="flex items-center justify-between mb-3">
				<Skeleton className="h-5 w-20" />
				<Skeleton className="h-5 w-16 rounded-full" />
			</div>

			{/* Question text */}
			<div className="space-y-2 mb-4">
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-5/6" />
				<Skeleton className="h-4 w-4/6" />
			</div>

			{/* Flip hint */}
			<div className="absolute bottom-4 left-0 right-0 flex justify-center">
				<Skeleton className="h-4 w-24" />
			</div>
		</output>
	)
}

/**
 * Skeleton for the flashcard grid
 */
export function SkeletonFlashcardGrid({
	count = 6,
	className = '',
}: {
	count?: number
	className?: string
}) {
	return (
		<output className={`block ${className}`} aria-label="Loading flashcards...">
			{/* Filter bar skeleton */}
			<div className="flex flex-wrap gap-4 mb-6 items-center">
				<Skeleton className="h-10 w-40" />
				<div className="flex gap-2">
					<Skeleton className="h-8 w-16 rounded-full" />
					<Skeleton className="h-8 w-20 rounded-full" />
					<Skeleton className="h-8 w-14 rounded-full" />
				</div>
			</div>

			{/* Grid skeleton */}
			<ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{Array.from({ length: count }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton items never reorder
					<li key={`skeleton-flashcard-${i}`} className="relative">
						<SkeletonFlashcard />
					</li>
				))}
			</ul>
		</output>
	)
}

/**
 * Skeleton for metadata summary
 */
export function SkeletonMetadata({ className = '' }: SkeletonProps) {
	return (
		<output
			className={`block p-4 bg-blue-50 border border-blue-200 rounded-lg ${className}`}
			aria-label="Loading metadata..."
		>
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<Skeleton className="h-4 w-16 bg-blue-200" />
					<Skeleton className="h-4 w-32 bg-blue-200" />
				</div>
				<div className="flex items-center gap-2">
					<Skeleton className="h-4 w-28 bg-blue-200" />
					<Skeleton className="h-4 w-8 bg-blue-200" />
				</div>
				<Skeleton className="h-3 w-full bg-blue-100 mt-2" />
			</div>
		</output>
	)
}

/**
 * Full page loading spinner
 */
export function LoadingSpinner({
	size = 'md',
	className = '',
}: {
	size?: 'sm' | 'md' | 'lg'
	className?: string
}) {
	const sizeClasses = {
		sm: 'w-4 h-4',
		md: 'w-8 h-8',
		lg: 'w-12 h-12',
	}

	return (
		<output className={`flex items-center justify-center ${className}`} aria-label="Loading...">
			<svg
				className={`animate-spin text-blue-600 ${sizeClasses[size]}`}
				viewBox="0 0 24 24"
				fill="none"
				aria-hidden="true"
			>
				<circle
					className="opacity-25"
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					strokeWidth="4"
				/>
				<path
					className="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
				/>
			</svg>
			<span className="sr-only">Loading...</span>
		</output>
	)
}

/**
 * Loading overlay for async operations
 */
export function LoadingOverlay({
	message = 'Loading...',
	className = '',
}: {
	message?: string
	className?: string
}) {
	return (
		<div
			className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${className}`}
			role="dialog"
			aria-modal="true"
			aria-label={message}
		>
			<div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4 shadow-xl">
				<LoadingSpinner size="lg" />
				<p className="text-gray-700 font-medium">{message}</p>
			</div>
		</div>
	)
}

/**
 * Inline loading indicator with text
 */
export function InlineLoading({
	text = 'Loading...',
	className = '',
}: {
	text?: string
	className?: string
}) {
	return (
		<output
			className={`flex items-center gap-2 text-sm text-gray-600 ${className}`}
			aria-live="polite"
		>
			<LoadingSpinner size="sm" />
			<span>{text}</span>
		</output>
	)
}

/**
 * Button loading state component
 */
export function ButtonSpinner({ className = '' }: SkeletonProps) {
	return (
		<svg
			className={`animate-spin w-4 h-4 ${className}`}
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
		>
			<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
			<path
				className="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
			/>
		</svg>
	)
}

/**
 * Progress bar with percentage
 */
export function ProgressBar({
	progress,
	showPercentage = true,
	className = '',
}: {
	progress: number
	showPercentage?: boolean
	className?: string
}) {
	const clampedProgress = Math.min(100, Math.max(0, progress))

	return (
		<div className={className}>
			<div
				className="h-2 bg-gray-200 rounded-full overflow-hidden"
				role="progressbar"
				aria-valuenow={clampedProgress}
				aria-valuemin={0}
				aria-valuemax={100}
			>
				<div
					className="h-full bg-blue-600 transition-all duration-300 ease-out"
					style={{ width: `${clampedProgress}%` }}
				/>
			</div>
			{showPercentage && (
				<p className="text-xs text-gray-500 mt-1 text-right">{Math.round(clampedProgress)}%</p>
			)}
		</div>
	)
}

/**
 * Step progress indicator (for multi-step processes)
 */
export function StepProgress({
	currentStep,
	totalSteps,
	stepLabels,
	className = '',
}: {
	currentStep: number
	totalSteps: number
	stepLabels?: string[]
	className?: string
}) {
	return (
		<output className={`block ${className}`} aria-label={`Step ${currentStep} of ${totalSteps}`}>
			<div className="flex items-center justify-between">
				{Array.from({ length: totalSteps }).map((_, i) => {
					const stepNumber = i + 1
					const isActive = stepNumber === currentStep
					const isCompleted = stepNumber < currentStep

					return (
						<div key={`step-${stepNumber}`} className="flex items-center flex-1">
							{/* Step circle */}
							<div
								className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
									isCompleted
										? 'bg-blue-600 text-white'
										: isActive
											? 'bg-blue-100 text-blue-700 ring-2 ring-blue-600'
											: 'bg-gray-100 text-gray-400'
								}`}
								aria-current={isActive ? 'step' : undefined}
							>
								{isCompleted ? (
									<svg
										className="w-4 h-4"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth="3"
										aria-hidden="true"
									>
										<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
									</svg>
								) : (
									stepNumber
								)}
							</div>

							{/* Connector */}
							{i < totalSteps - 1 && (
								<div
									className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-blue-600' : 'bg-gray-200'}`}
									aria-hidden="true"
								/>
							)}
						</div>
					)
				})}
			</div>

			{/* Labels */}
			{stepLabels && (
				<div className="flex justify-between mt-2">
					{stepLabels.map((label, i) => (
						<span
							key={`step-label-${i}-${label}`}
							className={`text-xs ${
								i + 1 === currentStep ? 'text-blue-700 font-medium' : 'text-gray-500'
							}`}
						>
							{label}
						</span>
					))}
				</div>
			)}
		</output>
	)
}

/**
 * Pulsing dot indicator (for streaming/live updates)
 */
export function PulsingDot({ className = '' }: SkeletonProps) {
	return (
		<span className={`relative inline-flex h-3 w-3 ${className}`}>
			<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
			<span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
		</span>
	)
}

/**
 * Content placeholder for when data is being loaded
 */
export function ContentPlaceholder({
	icon,
	title,
	description,
	className = '',
}: {
	icon?: React.ReactNode
	title: string
	description?: string
	className?: string
}) {
	return (
		<div className={`flex flex-col items-center justify-center py-12 ${className}`}>
			{icon && <div className="text-gray-400 mb-4">{icon}</div>}
			<h3 className="text-lg font-medium text-gray-700">{title}</h3>
			{description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
		</div>
	)
}
