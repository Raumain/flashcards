import { useCallback, useState } from 'react'
import type { Flashcard, PageImage } from '~/lib/types/flashcard'
import { ButtonSpinner } from './Loading'

type PDFFormat = 'standard' | 'printable' | 'digital'

interface DownloadButtonProps {
	flashcards: Flashcard[]
	pageImages?: PageImage[]
	disabled?: boolean
}

interface FormatOption {
	id: PDFFormat
	label: string
	description: string
}

const FORMAT_OPTIONS: FormatOption[] = [
	{
		id: 'standard',
		label: 'Standard (A6)',
		description: 'Pages format flashcard, recto-verso',
	},
	{
		id: 'printable',
		label: 'Impression',
		description: 'Optimisé pour impression recto-verso',
	},
	{
		id: 'digital',
		label: 'Numérique (A5)',
		description: 'Format plus grand pour écran',
	},
]

/**
 * Dynamically imports PDF generator to reduce initial bundle size
 * jsPDF + html2canvas are ~360KB combined, loaded only when needed
 */
async function loadPDFGenerator(format: PDFFormat) {
	const pdfModule = await import('~/lib/pdf-generator')
	switch (format) {
		case 'standard':
			return pdfModule.generateFlashcardPDF
		case 'printable':
			return pdfModule.generatePrintablePDF
		case 'digital':
			return pdfModule.generateDigitalPDF
		default:
			return pdfModule.generateFlashcardPDF
	}
}

export function DownloadButton({ flashcards, pageImages, disabled = false }: DownloadButtonProps) {
	const [isLoading, setIsLoading] = useState(false)
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const [selectedFormat, setSelectedFormat] = useState<PDFFormat>('standard')
	const [error, setError] = useState<string | null>(null)

	const handleDownload = useCallback(async () => {
		if (flashcards.length === 0 || isLoading) return

		setIsLoading(true)
		setError(null)

		try {
			// Dynamically load PDF generator (reduces initial bundle by ~360KB)
			const generator = await loadPDFGenerator(selectedFormat)
			const blob = await generator(flashcards, {}, pageImages)

			// Create download link
			const url = URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = url
			link.download = `flashcards-${selectedFormat}-${Date.now()}.pdf`
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
			URL.revokeObjectURL(url)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Échec de la génération du PDF')
		} finally {
			setIsLoading(false)
		}
	}, [flashcards, pageImages, selectedFormat, isLoading])

	const handleFormatSelect = useCallback((format: PDFFormat) => {
		setSelectedFormat(format)
		setIsMenuOpen(false)
	}, [])

	const toggleMenu = useCallback(() => {
		setIsMenuOpen((prev) => !prev)
	}, [])

	const isDisabled = disabled || flashcards.length === 0 || isLoading

	return (
		<div className="relative inline-block">
			{/* Main button group */}
			<div className="flex">
				{/* Download button */}
				<button
					type="button"
					onClick={handleDownload}
					disabled={isDisabled}
					className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-l-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
						isDisabled
							? 'bg-gray-300 text-gray-500 cursor-not-allowed'
							: 'bg-blue-600 text-white hover:bg-blue-700'
					}`}
					aria-label={`Télécharger ${flashcards.length} flashcards en PDF`}
				>
					{isLoading ? (
						<>
							<ButtonSpinner className="w-4 h-4" />
							<span>Génération...</span>
						</>
					) : (
						<>
							<DownloadIcon className="w-4 h-4" />
							<span>Télécharger PDF</span>
						</>
					)}
				</button>

				{/* Format dropdown toggle */}
				<button
					type="button"
					onClick={toggleMenu}
					disabled={isDisabled}
					className={`px-2 py-2.5 rounded-r-lg border-l transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
						isDisabled
							? 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed'
							: 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700'
					}`}
					aria-expanded={isMenuOpen}
					aria-haspopup="listbox"
					aria-label="Sélectionner le format PDF"
				>
					<ChevronDownIcon
						className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
					/>
				</button>
			</div>

			{/* Format dropdown menu */}
			{isMenuOpen && (
				<div
					className="absolute right-0 left-0 sm:left-auto mt-2 w-full sm:w-64 bg-white rounded-lg border border-gray-200 shadow-lg z-10 py-1"
					role="menu"
					aria-label="Options de format PDF"
				>
					{FORMAT_OPTIONS.map((option) => (
						<button
							key={option.id}
							type="button"
							onClick={() => handleFormatSelect(option.id)}
							className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
								selectedFormat === option.id ? 'bg-blue-50' : ''
							}`}
							role="menuitemradio"
							aria-checked={selectedFormat === option.id}
						>
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium text-gray-900">{option.label}</span>
								{selectedFormat === option.id && <CheckIcon className="w-4 h-4 text-blue-600" />}
							</div>
							<p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
						</button>
					))}
				</div>
			)}

			{/* Error message */}
			{error && (
				<p className="absolute left-0 right-0 mt-2 text-sm text-red-600 text-center" role="alert">
					{error}
				</p>
			)}
		</div>
	)
}

// Icon Components
function DownloadIcon({ className }: { className?: string }) {
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
			<polyline points="7 10 12 15 17 10" />
			<line x1="12" y1="15" x2="12" y2="3" />
		</svg>
	)
}

function ChevronDownIcon({ className }: { className?: string }) {
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
			<polyline points="6 9 12 15 18 9" />
		</svg>
	)
}

function CheckIcon({ className }: { className?: string }) {
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
			<polyline points="20 6 9 17 4 12" />
		</svg>
	)
}
