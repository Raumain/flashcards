import { forwardRef, useCallback, useState } from 'react'

/**
 * Error types that can occur during flashcard generation
 */
export type ErrorType =
	| 'INVALID_FILE'
	| 'FILE_TOO_LARGE'
	| 'PAYLOAD_TOO_LARGE'
	| 'PROCESSING_ERROR'
	| 'AI_ERROR'
	| 'RATE_LIMITED'
	| 'CONTENT_FILTERED'
	| 'NETWORK_ERROR'
	| 'TIMEOUT'
	| 'UNKNOWN'

/**
 * Structured error information for display
 */
export interface ErrorInfo {
	type: ErrorType
	title: string
	message: string
	suggestion: string
	canRetry: boolean
}

/**
 * Maps error messages/codes to user-friendly error information
 */
export function parseError(error: string | { code?: string; message?: string }): ErrorInfo {
	const errorMessage = typeof error === 'string' ? error : error.message || ''
	const errorCode = typeof error === 'string' ? '' : error.code || ''

	// Check for specific error patterns
	if (errorCode === 'INVALID_FILE' || errorMessage.includes('not a valid PDF')) {
		return {
			type: 'INVALID_FILE',
			title: 'Fichier PDF invalide',
			message: 'Le fichier téléchargé ne semble pas être un document PDF valide.',
			suggestion: 'Veuillez vous assurer de télécharger un fichier PDF correct et réessayez.',
			canRetry: false,
		}
	}

	if (
		errorCode === 'FILE_TOO_LARGE' ||
		errorMessage.includes('too large') ||
		errorMessage.includes('size')
	) {
		return {
			type: 'FILE_TOO_LARGE',
			title: 'Fichier trop volumineux',
			message: 'Le fichier PDF dépasse la taille maximale autorisée de 20Mo.',
			suggestion: 'Essayez de compresser le PDF ou de le diviser en fichiers plus petits.',
			canRetry: false,
		}
	}

	if (errorCode === 'PAYLOAD_TOO_LARGE' || errorMessage.includes('dépasse la limite')) {
		return {
			type: 'PAYLOAD_TOO_LARGE',
			title: 'Images trop volumineuses',
			message: errorMessage || 'La taille totale des images dépasse la limite autorisée.',
			suggestion: 'Essayez avec un PDF plus court ou de moindre résolution.',
			canRetry: false,
		}
	}

	if (
		errorMessage.includes('rate limit') ||
		errorMessage.includes('RATE_LIMIT') ||
		errorMessage.includes('quota')
	) {
		return {
			type: 'RATE_LIMITED',
			title: 'Trop de requêtes',
			message: 'Nous avons atteint une limite temporaire sur les requêtes IA.',
			suggestion: 'Veuillez patienter quelques minutes et réessayer.',
			canRetry: true,
		}
	}

	if (
		errorMessage.includes('safety') ||
		errorMessage.includes('filtered') ||
		errorMessage.includes('blocked')
	) {
		return {
			type: 'CONTENT_FILTERED',
			title: 'Contenu non supporté',
			message:
				"L'IA n'a pas pu traiter certains contenus de votre PDF en raison des politiques de contenu.",
			suggestion: 'Essayez un PDF différent ou supprimez tout contenu potentiellement sensible.',
			canRetry: false,
		}
	}

	if (
		errorMessage.includes('network') ||
		errorMessage.includes('fetch') ||
		errorMessage.includes('connection')
	) {
		return {
			type: 'NETWORK_ERROR',
			title: 'Erreur de connexion',
			message: 'Impossible de se connecter au serveur.',
			suggestion: 'Vérifiez votre connexion internet et réessayez.',
			canRetry: true,
		}
	}

	if (
		errorCode === 'TIMEOUT' ||
		errorMessage.includes('timeout') ||
		errorMessage.includes('timed out') ||
		errorMessage.includes('pris trop de temps')
	) {
		return {
			type: 'TIMEOUT',
			title: 'Délai dépassé',
			message: 'La génération a pris trop de temps.',
			suggestion:
				'Cela peut arriver avec les gros PDF. Essayez avec un fichier plus petit ou avec moins de pages.',
			canRetry: true,
		}
	}

	if (
		errorCode === 'PROCESSING_ERROR' ||
		errorMessage.includes('conversion') ||
		errorMessage.includes('processing')
	) {
		return {
			type: 'PROCESSING_ERROR',
			title: 'Erreur de traitement',
			message: 'Un problème est survenu lors du traitement de votre PDF.',
			suggestion:
				'Le PDF est peut-être corrompu ou dans un format non supporté. Essayez un autre fichier.',
			canRetry: true,
		}
	}

	if (
		errorCode === 'AI_ERROR' ||
		errorMessage.includes('AI') ||
		errorMessage.includes('generation')
	) {
		return {
			type: 'AI_ERROR',
			title: 'Erreur de génération IA',
			message: "L'IA a rencontré un problème lors de la génération des flashcards.",
			suggestion: "C'est généralement temporaire. Veuillez réessayer.",
			canRetry: true,
		}
	}

	// Default unknown error
	return {
		type: 'UNKNOWN',
		title: 'Une erreur est survenue',
		message: errorMessage || "Une erreur inattendue s'est produite.",
		suggestion: 'Veuillez réessayer. Si le problème persiste, essayez un autre PDF.',
		canRetry: true,
	}
}

/**
 * Icon components for different error types
 */
function ErrorIcon({ type }: { type: ErrorType }) {
	const iconClasses = 'w-6 h-6'

	switch (type) {
		case 'INVALID_FILE':
		case 'FILE_TOO_LARGE':
		case 'PAYLOAD_TOO_LARGE':
			return (
				<svg
					className={iconClasses}
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					aria-hidden="true"
				>
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
					<polyline points="14 2 14 8 20 8" />
					<line x1="9" y1="15" x2="15" y2="15" />
				</svg>
			)
		case 'RATE_LIMITED':
		case 'TIMEOUT':
			return (
				<svg
					className={iconClasses}
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					aria-hidden="true"
				>
					<circle cx="12" cy="12" r="10" />
					<polyline points="12 6 12 12 16 14" />
				</svg>
			)
		case 'NETWORK_ERROR':
			return (
				<svg
					className={iconClasses}
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					aria-hidden="true"
				>
					<path d="M5 12.55a11 11 0 0 1 14.08 0" />
					<path d="M1.42 9a16 16 0 0 1 21.16 0" />
					<path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
					<line x1="12" y1="20" x2="12.01" y2="20" />
					<line x1="2" y1="2" x2="22" y2="22" />
				</svg>
			)
		case 'CONTENT_FILTERED':
			return (
				<svg
					className={iconClasses}
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					aria-hidden="true"
				>
					<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
					<line x1="12" y1="8" x2="12" y2="12" />
					<line x1="12" y1="16" x2="12.01" y2="16" />
				</svg>
			)
		default:
			return (
				<svg
					className={iconClasses}
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					aria-hidden="true"
				>
					<circle cx="12" cy="12" r="10" />
					<line x1="12" y1="8" x2="12" y2="12" />
					<line x1="12" y1="16" x2="12.01" y2="16" />
				</svg>
			)
	}
}

/**
 * Props for ErrorAlert component
 */
interface ErrorAlertProps {
	/** The error message or object to display */
	error: string | { code?: string; message?: string }
	/** Callback when retry button is clicked */
	onRetry?: () => void
	/** Callback when dismiss button is clicked */
	onDismiss?: () => void
	/** Whether a retry is currently in progress */
	isRetrying?: boolean
	/** Additional CSS classes */
	className?: string
}

/**
 * A comprehensive error alert component with:
 * - User-friendly error messages
 * - Contextual icons
 * - Retry functionality with cooldown
 * - Dismiss option
 * - Accessible design
 */
export const ErrorAlert = forwardRef<HTMLDivElement, ErrorAlertProps>(function ErrorAlert(
	{ error, onRetry, onDismiss, isRetrying = false, className = '' },
	ref,
) {
	const errorInfo = parseError(error)
	const [retryCount, setRetryCount] = useState(0)
	const [cooldown, setCooldown] = useState(0)

	const handleRetry = useCallback(() => {
		if (cooldown > 0 || isRetrying || !onRetry) return

		const newRetryCount = retryCount + 1
		setRetryCount(newRetryCount)

		// Add exponential backoff cooldown for repeated retries
		if (newRetryCount >= 2) {
			const cooldownTime = Math.min(30, 5 * newRetryCount)
			setCooldown(cooldownTime)

			const interval = setInterval(() => {
				setCooldown((prev) => {
					if (prev <= 1) {
						clearInterval(interval)
						return 0
					}
					return prev - 1
				})
			}, 1000)
		}

		onRetry()
	}, [cooldown, isRetrying, onRetry, retryCount])

	// Determine background color based on error type
	const getBgColor = () => {
		switch (errorInfo.type) {
			case 'RATE_LIMITED':
			case 'TIMEOUT':
				return 'bg-amber-50 border-amber-200'
			case 'NETWORK_ERROR':
				return 'bg-blue-50 border-blue-200'
			default:
				return 'bg-red-50 border-red-200'
		}
	}

	const getTextColor = () => {
		switch (errorInfo.type) {
			case 'RATE_LIMITED':
			case 'TIMEOUT':
				return 'text-amber-800'
			case 'NETWORK_ERROR':
				return 'text-blue-800'
			default:
				return 'text-red-800'
		}
	}

	const getIconColor = () => {
		switch (errorInfo.type) {
			case 'RATE_LIMITED':
			case 'TIMEOUT':
				return 'text-amber-500'
			case 'NETWORK_ERROR':
				return 'text-blue-500'
			default:
				return 'text-red-500'
		}
	}

	const getButtonStyles = () => {
		switch (errorInfo.type) {
			case 'RATE_LIMITED':
			case 'TIMEOUT':
				return 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
			case 'NETWORK_ERROR':
				return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
			default:
				return 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
		}
	}

	return (
		<div
			ref={ref}
			tabIndex={-1}
			role="alert"
			aria-live="assertive"
			className={`rounded-lg border p-4 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${getBgColor()} ${className}`}
		>
			<div className="flex gap-3">
				{/* Icon */}
				<div className={`shrink-0 ${getIconColor()}`}>
					<ErrorIcon type={errorInfo.type} />
				</div>

				{/* Content */}
				<div className="flex-1 min-w-0">
					<h3 className={`font-semibold ${getTextColor()}`}>{errorInfo.title}</h3>
					<p className={`mt-1 text-sm ${getTextColor()} opacity-90`}>{errorInfo.message}</p>
					<p className={`mt-2 text-sm ${getTextColor()} opacity-75`}>💡 {errorInfo.suggestion}</p>

					{/* Action buttons */}
					<div className="mt-4 flex flex-wrap gap-3">
						{errorInfo.canRetry && onRetry && (
							<button
								type="button"
								onClick={handleRetry}
								disabled={isRetrying || cooldown > 0}
								className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${getButtonStyles()}`}
							>
								{isRetrying ? (
									<>
										<svg
											className="w-4 h-4 animate-spin"
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
										Nouvelle tentative...
									</>
								) : cooldown > 0 ? (
									`Patientez ${cooldown}s`
								) : (
									<>
										<svg
											className="w-4 h-4"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											aria-hidden="true"
										>
											<path d="M1 4v6h6" />
											<path d="M23 20v-6h-6" />
											<path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
										</svg>
										Réessayer
									</>
								)}
							</button>
						)}

						{onDismiss && (
							<button
								type="button"
								onClick={onDismiss}
								className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
									errorInfo.type === 'RATE_LIMITED' || errorInfo.type === 'TIMEOUT'
										? 'border-amber-300 text-amber-700 hover:bg-amber-100 focus:ring-amber-500'
										: errorInfo.type === 'NETWORK_ERROR'
											? 'border-blue-300 text-blue-700 hover:bg-blue-100 focus:ring-blue-500'
											: 'border-red-300 text-red-700 hover:bg-red-100 focus:ring-red-500'
								}`}
							>
								Fermer
							</button>
						)}
					</div>

					{/* Retry count indicator */}
					{retryCount > 0 && (
						<p className={`mt-2 text-xs ${getTextColor()} opacity-60`}>Tentatives : {retryCount}</p>
					)}
				</div>

				{/* Close button */}
				{onDismiss && (
					<button
						type="button"
						onClick={onDismiss}
						className={`shrink-0 p-1 rounded-md transition-colors hover:bg-black/5 focus:outline-none focus:ring-2 ${getTextColor()}`}
						aria-label="Fermer l'erreur"
					>
						<svg
							className="w-5 h-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							aria-hidden="true"
						>
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				)}
			</div>
		</div>
	)
})
