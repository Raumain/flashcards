import { memo, useCallback, useRef, useState } from 'react'

interface PDFDropzoneProps {
	onFileSelect: (file: File) => void
	isUploading?: boolean
	uploadProgress?: number
	maxSizeMB?: number
}

type DropzoneState = 'idle' | 'dragover' | 'error' | 'uploading'

interface FileError {
	type: 'invalid-type' | 'too-large'
	message: string
}

const MAX_FILE_SIZE_MB = 20
const ACCEPTED_TYPE = 'application/pdf'

/**
 * Memoized PDFDropzone component
 * Handles file upload with drag-and-drop support
 */
export const PDFDropzone = memo(function PDFDropzone({
	onFileSelect,
	isUploading = false,
	uploadProgress = 0,
	maxSizeMB = MAX_FILE_SIZE_MB,
}: PDFDropzoneProps) {
	const [state, setState] = useState<DropzoneState>('idle')
	const [error, setError] = useState<FileError | null>(null)
	const [fileName, setFileName] = useState<string | null>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const maxSizeBytes = maxSizeMB * 1024 * 1024

	const validateFile = useCallback(
		(file: File): FileError | null => {
			if (file.type !== ACCEPTED_TYPE) {
				return {
					type: 'invalid-type',
					message: 'Seuls les fichiers PDF sont acceptés',
				}
			}

			if (file.size > maxSizeBytes) {
				return {
					type: 'too-large',
					message: `La taille du fichier doit être inférieure à ${maxSizeMB}Mo`,
				}
			}

			return null
		},
		[maxSizeBytes, maxSizeMB],
	)

	const handleFile = useCallback(
		(file: File) => {
			const validationError = validateFile(file)

			if (validationError) {
				setError(validationError)
				setState('error')
				setFileName(null)
				return
			}

			setError(null)
			setFileName(file.name)
			setState('idle')
			onFileSelect(file)
		},
		[validateFile, onFileSelect],
	)

	const handleDragOver = useCallback((e: React.DragEvent<HTMLElement>) => {
		e.preventDefault()
		e.stopPropagation()
		setState('dragover')
	}, [])

	const handleDragLeave = useCallback((e: React.DragEvent<HTMLElement>) => {
		e.preventDefault()
		e.stopPropagation()
		setState('idle')
	}, [])

	const handleDrop = useCallback(
		(e: React.DragEvent<HTMLElement>) => {
			e.preventDefault()
			e.stopPropagation()
			setState('idle')

			const files = e.dataTransfer.files
			if (files.length > 0) {
				handleFile(files[0])
			}
		},
		[handleFile],
	)

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files
			if (files && files.length > 0) {
				handleFile(files[0])
			}
		},
		[handleFile],
	)

	const handleClick = useCallback(
		(e: React.MouseEvent<HTMLButtonElement>) => {
			// Prevent default button behavior and trigger file input
			e.preventDefault()
			if (!isUploading) {
				inputRef.current?.click()
			}
		},
		[isUploading],
	)

	const getStateStyles = (): string => {
		const baseStyles =
			'relative border-2 border-dashed rounded-lg p-6 sm:p-8 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'

		if (isUploading) {
			return `${baseStyles} border-blue-300 bg-blue-50 cursor-not-allowed`
		}

		switch (state) {
			case 'dragover':
				return `${baseStyles} border-blue-500 bg-blue-50`
			case 'error':
				return `${baseStyles} border-red-400 bg-red-50`
			default:
				return `${baseStyles} border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50`
		}
	}

	return (
		<button
			type="button"
			className={getStateStyles()}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			onClick={handleClick}
			disabled={isUploading}
			aria-label="Télécharger un fichier PDF"
			aria-describedby={error ? 'dropzone-error' : 'dropzone-hint'}
			aria-busy={isUploading}
		>
			<input
				ref={inputRef}
				type="file"
				accept=".pdf,application/pdf"
				onChange={handleInputChange}
				className="sr-only"
				tabIndex={-1}
				disabled={isUploading}
			/>

			<div className="flex flex-col items-center gap-4">
				{/* Icon */}
				<div
					className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full transition-colors ${
						state === 'dragover'
							? 'bg-blue-100 text-blue-600'
							: state === 'error'
								? 'bg-red-100 text-red-600'
								: isUploading
									? 'bg-blue-100 text-blue-600'
									: 'bg-gray-100 text-gray-500'
					}`}
				>
					{isUploading ? (
						<UploadingIcon className="w-6 h-6 animate-pulse" />
					) : state === 'error' ? (
						<ErrorIcon className="w-6 h-6" />
					) : (
						<PDFIcon className="w-6 h-6" />
					)}
				</div>

				{/* Text Content */}
				<div className="text-center">
					{isUploading ? (
						<>
							<p className="text-sm font-medium text-blue-700">Téléchargement de {fileName}...</p>
							<p className="text-xs text-blue-600 mt-1">{Math.round(uploadProgress)}% terminé</p>
						</>
					) : fileName && !error ? (
						<>
							<p className="text-sm font-medium text-gray-900">{fileName}</p>
							<p className="text-xs text-gray-500 mt-1">Cliquez ou déposez pour remplacer</p>
						</>
					) : (
						<>
							<p className="text-sm font-medium text-gray-700">
								<span className="text-blue-600">Cliquez pour télécharger</span> ou glissez-déposez
							</p>
							<p id="dropzone-hint" className="text-xs text-gray-500 mt-1">
								Fichiers PDF uniquement, jusqu'à {maxSizeMB}Mo
							</p>
						</>
					)}
				</div>

				{/* Error Message */}
				{error && (
					<p id="dropzone-error" className="text-sm text-red-600 font-medium" role="alert">
						{error.message}
					</p>
				)}

				{/* Progress Bar */}
				{isUploading && (
					<div className="w-full max-w-xs">
						<div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
							<div
								className="h-full bg-blue-600 rounded-full transition-all duration-300"
								style={{ width: `${uploadProgress}%` }}
								role="progressbar"
								aria-valuenow={uploadProgress}
								aria-valuemin={0}
								aria-valuemax={100}
							/>
						</div>
					</div>
				)}
			</div>
		</button>
	)
})

// Icon Components
function PDFIcon({ className }: { className?: string }) {
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
			<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
			<polyline points="14 2 14 8 20 8" />
			<line x1="16" y1="13" x2="8" y2="13" />
			<line x1="16" y1="17" x2="8" y2="17" />
			<polyline points="10 9 9 9 8 9" />
		</svg>
	)
}

function UploadingIcon({ className }: { className?: string }) {
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
			<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
			<polyline points="17 8 12 3 7 8" />
			<line x1="12" y1="3" x2="12" y2="15" />
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
