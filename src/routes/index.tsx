import { createFileRoute, Link } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FlashcardGrid } from '~/components/flashcards'
import { GenerationProgress, type GenerationStep } from '~/components/generation'
import {
	DownloadButton,
	ErrorAlert,
	PulsingDot,
	SkeletonFlashcardGrid,
	SkeletonMetadata,
} from '~/components/ui'
import { PDFDropzone } from '~/components/upload'
import { useSession } from '~/lib/auth-client'
import type { Flashcard, GenerationMetadata, PageImage } from '~/lib/types/flashcard'

/**
 * Application state machine
 * idle → uploading → processing → generating → complete
 *                                            → error
 */
type AppState = 'idle' | 'uploading' | 'processing' | 'generating' | 'complete' | 'error'

/**
 * Maps app state to GenerationStep for the progress component
 */
function appStateToGenerationStep(state: AppState): GenerationStep | null {
	switch (state) {
		case 'idle':
			return null
		case 'uploading':
			return 'uploading'
		case 'processing':
			return 'processing'
		case 'generating':
			return 'generating'
		case 'complete':
			return 'complete'
		case 'error':
			return null
		default:
			return null
	}
}

export const Route = createFileRoute('/')({
	component: Home,
})

function Home() {
	// Auth state
	const { data: session } = useSession()
	const isAuthenticated = !!session?.user

	// Core state
	const [appState, setAppState] = useState<AppState>('idle')
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [uploadProgress, setUploadProgress] = useState(0)

	// Generation state
	const [flashcards, setFlashcards] = useState<Flashcard[]>([])
	const [pageImages, setPageImages] = useState<PageImage[]>([])
	const [metadata, setMetadata] = useState<GenerationMetadata | null>(null)
	const [streamingText, setStreamingText] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [isRetrying, setIsRetrying] = useState(false)
	const [isLoadingResults, setIsLoadingResults] = useState(false)
	const [savedThematicId, setSavedThematicId] = useState<string | null>(null)

	// Refs for cancellation and retry
	const abortControllerRef = useRef<AbortController | null>(null)
	const lastFileRef = useRef<File | null>(null)
	const isProcessingRef = useRef(false)
	const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	// Refs for focus management (accessibility)
	const resultsHeadingRef = useRef<HTMLHeadingElement>(null)
	const errorAlertRef = useRef<HTMLDivElement>(null)

	/**
	 * Resets all state to initial values
	 */
	const resetState = useCallback(() => {
		setAppState('idle')
		setSelectedFile(null)
		setUploadProgress(0)
		setFlashcards([])
		setPageImages([])
		setMetadata(null)
		setStreamingText('')
		setError(null)
		setSavedThematicId(null)
		isProcessingRef.current = false
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current)
			debounceTimeoutRef.current = null
		}
		if (abortControllerRef.current) {
			abortControllerRef.current.abort()
			abortControllerRef.current = null
		}
	}, [])

	/**
	 * Handles file selection and starts the generation pipeline
	 * Includes debouncing and duplicate request prevention
	 */
	const handleFileSelect = useCallback(
		async (file: File) => {
			// Prevent duplicate submissions while processing
			if (isProcessingRef.current) {
				console.log('[handleFileSelect] Request ignored - already processing')
				return
			}

			// Clear any pending debounce
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current)
				debounceTimeoutRef.current = null
			}

			// Mark as processing immediately to prevent rapid re-submissions
			isProcessingRef.current = true

			// Validate file size before starting (20MB limit)
			const MAX_FILE_SIZE_MB = 20
			const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024
			if (file.size > maxBytes) {
				setError(
					`La taille du fichier doit être inférieure à ${MAX_FILE_SIZE_MB}Mo. Votre fichier fait ${(file.size / 1024 / 1024).toFixed(1)}Mo.`,
				)
				setAppState('error')
				isProcessingRef.current = false
				return
			}

			// Validate file type
			if (file.type !== 'application/pdf') {
				setError('Veuillez télécharger un fichier PDF.')
				setAppState('error')
				isProcessingRef.current = false
				return
			}

			// Reset previous state (but keep processing flag true)
			resetState()
			isProcessingRef.current = true // Re-set after resetState clears it
			setSelectedFile(file)
			lastFileRef.current = file
			setAppState('uploading')

			// Create abort controller for this generation
			const abortController = new AbortController()
			abortControllerRef.current = abortController
			const signal = abortController.signal

			try {
				// Simulate upload progress with adaptive timing based on file size
				// Smaller files = faster progress, larger files = slower progress
				const fileSizeMB = file.size / (1024 * 1024)
				const baseInterval = Math.min(150, Math.max(50, fileSizeMB * 15)) // 50-150ms based on size
				const progressIncrement = Math.max(5, Math.min(15, 20 - fileSizeMB)) // 5-15% per tick

				const progressInterval = setInterval(() => {
					setUploadProgress((prev) => {
						if (prev >= 90) {
							clearInterval(progressInterval)
							return 90
						}
						// Add slight randomness to feel more natural
						const variance = Math.random() * 3 - 1.5
						return Math.min(90, prev + progressIncrement + variance)
					})
				}, baseInterval)

				// Estimated upload time based on file size (larger = longer)
				const estimatedTime = Math.min(2000, Math.max(500, fileSizeMB * 200))
				await new Promise((resolve) => setTimeout(resolve, estimatedTime))
				clearInterval(progressInterval)
				setUploadProgress(100)

				// Check for cancellation
				if (signal.aborted) {
					isProcessingRef.current = false
					return
				}

				// Move to processing state
				setAppState('processing')
				setStreamingText('Préparation du PDF pour analyse...\n')

				// Build FormData for the server
				const formData = new FormData()
				formData.append('pdf', file)

				// Simulate processing delay (PDF → images conversion)
				await new Promise((resolve) => setTimeout(resolve, 1500))

				if (signal.aborted) {
					isProcessingRef.current = false
					return
				}

				// Move to generating state
				setAppState('generating')
				setStreamingText((prev) => `${prev}Conversion des pages PDF en images...\n`)

				// Check for cancellation before starting AI call
				if (signal.aborted) {
					isProcessingRef.current = false
					return
				}

				// Call the appropriate server function based on auth status
				setStreamingText(
					(prev) =>
						`${prev}Analyse du contenu médical avec l'IA...\nGénération des flashcards...\n`,
				)

				let result: {
					success: boolean
					data?: {
						flashcards: Flashcard[]
						metadata: GenerationMetadata
						pageImages?: PageImage[]
					}
					thematic?: { id: string }
					flashcards?: Array<{
						id: string
						front: { question: string; imageDescription?: string }
						back: { answer: string; details?: string; imageDescription?: string }
						category: string | null
						difficulty: string
					}>
					metadata?: { subject: string; totalConcepts: number; recommendations?: string }
					pageImages?: Array<{ pageIndex: number; base64: string; mimeType: string }>
					error?: { message: string }
				}

				if (isAuthenticated) {
					// Authenticated: use generateAndSaveFlashcards (persists to DB)
					const { generateAndSaveFlashcards } = await import('~/server/functions/generate')
					const authResult = await Promise.race([
						generateAndSaveFlashcards({ data: formData }),
						new Promise<never>((_, reject) => {
							if (signal.aborted) {
								reject(new DOMException('Generation cancelled by user', 'AbortError'))
								return
							}
							signal.addEventListener('abort', () => {
								reject(new DOMException('Generation cancelled by user', 'AbortError'))
							})
						}),
					])

					// Transform authenticated response to common format
					if (authResult.success && authResult.flashcards) {
						setSavedThematicId(authResult.thematic?.id ?? null)
						result = {
							success: true,
							data: {
								flashcards: authResult.flashcards.map((f) => ({
									id: f.id,
									front: {
										question: f.front.question,
										imageDescription: f.front.imageDescription,
									},
									back: {
										answer: f.back.answer,
										details: f.back.details,
										imageDescription: f.back.imageDescription,
									},
									category: f.category ?? 'General',
									difficulty: f.difficulty as 'easy' | 'medium' | 'hard',
								})),
								metadata: authResult.metadata ?? {
									subject: 'Unknown',
									totalConcepts: authResult.flashcards.length,
								},
								pageImages: authResult.pageImages?.map((p) => ({
									...p,
									mimeType: p.mimeType as 'image/jpeg',
								})),
							},
						}
					} else {
						result = {
							success: false,
							error: authResult.error ?? { message: 'Erreur inconnue' },
						}
					}
				} else {
					// Anonymous: use generateFlashcards (no persistence)
					const { generateFlashcards } = await import('~/server/functions/generate')
					result = await Promise.race([
						generateFlashcards({ data: formData }),
						new Promise<never>((_, reject) => {
							if (signal.aborted) {
								reject(new DOMException('Generation cancelled by user', 'AbortError'))
								return
							}
							signal.addEventListener('abort', () => {
								reject(new DOMException('Generation cancelled by user', 'AbortError'))
							})
						}),
					])
				}

				// Double-check cancellation after await (in case abort happened during the call)
				if (signal.aborted) {
					isProcessingRef.current = false
					return
				}

				if (!result.success) {
					throw new Error(result.error?.message ?? 'Erreur inconnue')
				}

				if (!result.data) {
					throw new Error('Aucune donnée reçue')
				}

				// Set all data including page images
				setFlashcards(result.data.flashcards)
				setMetadata(result.data.metadata)
				if (result.data.pageImages) {
					setPageImages(result.data.pageImages as PageImage[])
				}

				// Final update
				setStreamingText(
					(prev) =>
						`${prev}✓ Terminé : ${result.data?.flashcards.length ?? 0} flashcards générées à partir de ${result.data?.metadata.totalConcepts ?? 0} concepts\n`,
				)
				setAppState('complete')
				setIsLoadingResults(false)
				isProcessingRef.current = false
			} catch (err) {
				// Handle user cancellation - silently return without showing error
				if (signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
					isProcessingRef.current = false
					return
				}

				const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
				setError(errorMessage)
				setStreamingText((prev) => `${prev}❌ Error: ${errorMessage}\n`)
				setAppState('error')
				isProcessingRef.current = false
			}
		},
		[resetState, isAuthenticated],
	)

	/**
	 * Cancels the current generation
	 *
	 * Note: This aborts the client-side operation and resets UI state.
	 * Server-side streaming will continue until completion, but results
	 * will be discarded. True server-side cancellation would require
	 * additional infrastructure (e.g., AbortSignal propagation to the
	 * AI SDK, which is not currently supported in TanStack Start generators).
	 */
	const handleCancelGeneration = useCallback(() => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort()
		}
		isProcessingRef.current = false
		resetState()
	}, [resetState])

	/**
	 * Handles retry after an error
	 */
	const handleRetry = useCallback(() => {
		if (!lastFileRef.current) return
		setIsRetrying(true)
		handleFileSelect(lastFileRef.current).finally(() => {
			setIsRetrying(false)
		})
	}, [handleFileSelect])

	/**
	 * Dismisses the error and returns to idle state
	 */
	const handleDismissError = useCallback(() => {
		setError(null)
		setAppState('idle')
	}, [])

	/**
	 * Focus management for accessibility
	 * Moves focus to results heading when generation completes,
	 * or to error alert when an error occurs
	 */
	useEffect(() => {
		if (appState === 'complete' && !isLoadingResults && flashcards.length > 0) {
			resultsHeadingRef.current?.focus()
		}
	}, [appState, isLoadingResults, flashcards.length])

	useEffect(() => {
		if (appState === 'error' && error) {
			errorAlertRef.current?.focus()
		}
	}, [appState, error])

	// Derived state
	const generationStep = appStateToGenerationStep(appState)
	const isUploading = appState === 'uploading'
	const isComplete = appState === 'complete'
	const isError = appState === 'error'
	const isGenerating = appState === 'generating' || appState === 'processing'

	return (
		<main className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4">
			<div className={`mx-auto ${isComplete ? 'max-w-5xl' : 'max-w-2xl'}`}>
				<header className="text-center mb-6 sm:mb-8">
					<h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">MedFlash</h1>
					<p className="text-base sm:text-lg text-gray-600">
						Générateur de flashcards médicales par IA
					</p>
				</header>

				{/* Error Alert - Show when error occurs */}
				{isError && error && (
					<ErrorAlert
						ref={errorAlertRef}
						error={error}
						onRetry={handleRetry}
						onDismiss={handleDismissError}
						isRetrying={isRetrying}
						className="mb-6"
					/>
				)}

				{/* Upload Section - Show when idle or error */}
				{(appState === 'idle' || isError) && (
					<section aria-labelledby="upload-section">
						<h2 id="upload-section" className="sr-only">
							Télécharger un PDF
						</h2>
						{!isAuthenticated && (
							<div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
								<p className="text-sm text-amber-800">
									<span className="font-medium">Mode anonyme :</span> Vos flashcards ne seront pas
									sauvegardées.{' '}
									<Link to="/signin" className="underline hover:text-amber-900">
										Connectez-vous
									</Link>{' '}
									pour les conserver.
								</p>
							</div>
						)}
						<PDFDropzone
							onFileSelect={handleFileSelect}
							isUploading={isUploading}
							uploadProgress={uploadProgress}
						/>
					</section>
				)}

				{/* Generation Progress - Show during upload/processing/generating */}
				{generationStep && !isError && (
					<section aria-labelledby="generation-section">
						<h2 id="generation-section" className="sr-only">
							Progression de la génération
						</h2>
						<GenerationProgress
							currentStep={generationStep}
							streamingText={streamingText}
							onCancel={isGenerating || isUploading ? handleCancelGeneration : undefined}
							isComplete={isComplete}
							error={isError ? (error ?? undefined) : undefined}
						/>
					</section>
				)}

				{/* File Info - Show after selection before generation starts */}
				{selectedFile && appState === 'idle' && (
					<div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
						<p className="text-sm text-gray-600">
							<span className="font-medium text-gray-900">Sélectionné :</span> {selectedFile.name}
						</p>
						<p className="text-xs text-gray-500 mt-1">
							Taille : {(selectedFile.size / 1024 / 1024).toFixed(2)} Mo
						</p>
					</div>
				)}

				{/* Loading Results State - Show skeleton while transitioning */}
				{isComplete && isLoadingResults && (
					<>
						<div className="mt-6 flex items-center gap-2 text-sm text-blue-600">
							<PulsingDot />
							<span>Préparation de vos flashcards...</span>
						</div>
						<SkeletonMetadata className="mt-4" />
						<SkeletonFlashcardGrid count={6} className="mt-8" />
					</>
				)}

				{/* Metadata Summary - Show after completion */}
				{isComplete && !isLoadingResults && metadata && (
					<div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
						<p className="text-sm text-blue-800">
							<span className="font-medium">Sujet :</span> {metadata.subject}
						</p>
						<p className="text-sm text-blue-800 mt-1">
							<span className="font-medium">Concepts identifiés :</span> {metadata.totalConcepts}
						</p>
						{metadata.recommendations && (
							<p className="text-xs text-blue-600 mt-2">{metadata.recommendations}</p>
						)}
					</div>
				)}

				{/* Action Buttons - Show after completion */}
				{isComplete && !isLoadingResults && flashcards.length > 0 && (
					<div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
						<DownloadButton flashcards={flashcards} pageImages={pageImages} />
						{isAuthenticated && savedThematicId && (
							<Link
								to="/dashboard/flashcards"
								className="px-6 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
							>
								Voir dans le dashboard →
							</Link>
						)}
						<button
							type="button"
							onClick={resetState}
							className="px-6 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
						>
							Uploader un autre PDF
						</button>
					</div>
				)}

				{/* Flashcard Grid - Show after generation complete */}
				{isComplete && !isLoadingResults && flashcards.length > 0 && (
					<section aria-labelledby="flashcards-section" id="main-content" className="mt-8">
						<h2
							id="flashcards-section"
							ref={resultsHeadingRef}
							tabIndex={-1}
							className="text-xl font-semibold text-gray-900 mb-4 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
						>
							Flashcards générées ({flashcards.length})
						</h2>
						<FlashcardGrid flashcards={flashcards} pageImages={pageImages} />
					</section>
				)}

				{/* Empty State - Show if complete but no flashcards */}
				{isComplete && !isLoadingResults && flashcards.length === 0 && (
					<div className="mt-6 p-8 bg-white rounded-lg border border-gray-200 text-center">
						<p className="text-gray-600">Aucune flashcard n'a été générée à partir de ce PDF.</p>
						<button
							type="button"
							onClick={resetState}
							className="mt-4 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
						>
							Essayer un autre PDF
						</button>
					</div>
				)}
			</div>
		</main>
	)
}
