import { memo, useCallback, useEffect, useRef } from 'react'

interface ImageLightboxProps {
	isOpen: boolean
	imageUrl: string
	alt: string
	onClose: () => void
}

/**
 * Accessible image lightbox/modal for viewing images in full size
 * - Closes on Escape key
 * - Closes on backdrop click
 * - Traps focus within modal
 * - Prevents body scroll when open
 */
export const ImageLightbox = memo(function ImageLightbox({
	isOpen,
	imageUrl,
	alt,
	onClose,
}: ImageLightboxProps) {
	const dialogRef = useRef<HTMLDialogElement>(null)
	const closeButtonRef = useRef<HTMLButtonElement>(null)

	// Handle open/close state
	useEffect(() => {
		const dialog = dialogRef.current
		if (!dialog) return

		if (isOpen) {
			dialog.showModal()
			// Prevent body scroll
			document.body.style.overflow = 'hidden'
			// Focus close button for accessibility
			closeButtonRef.current?.focus()
		} else {
			dialog.close()
			document.body.style.overflow = ''
		}

		return () => {
			document.body.style.overflow = ''
		}
	}, [isOpen])

	// Handle Escape key
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.preventDefault()
				onClose()
			}
		},
		[onClose],
	)

	// Handle backdrop click
	const handleBackdropClick = useCallback(
		(e: React.MouseEvent) => {
			if (e.target === dialogRef.current) {
				onClose()
			}
		},
		[onClose],
	)

	if (!isOpen) return null

	return (
		<dialog
			ref={dialogRef}
			className="fixed inset-0 z-50 m-0 max-w-none max-h-none w-full h-full bg-black/90 backdrop:bg-black/90 p-0"
			onKeyDown={handleKeyDown}
			onClick={handleBackdropClick}
			aria-label="Image en plein écran"
		>
			<div className="relative w-full h-full flex items-center justify-center p-4 sm:p-8">
				{/* Close button */}
				<button
					ref={closeButtonRef}
					type="button"
					onClick={onClose}
					className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
					aria-label="Fermer l'image"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-6 w-6 text-white"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
						aria-hidden="true"
					>
						<title>Fermer</title>
						<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>

				{/* Image container */}
				<div className="max-w-full max-h-full overflow-auto">
					<img
						src={imageUrl}
						alt={alt}
						className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
					/>
				</div>

				{/* Image description */}
				{alt && (
					<div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-lg px-4 py-2 bg-black/60 rounded-lg">
						<p className="text-white text-sm text-center">{alt}</p>
					</div>
				)}

				{/* Instructions */}
				<div className="absolute bottom-4 right-4 text-white/60 text-xs">
					Appuyez sur Échap ou cliquez pour fermer
				</div>
			</div>
		</dialog>
	)
})
