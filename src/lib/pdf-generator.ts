import { jsPDF } from 'jspdf'
import type { Flashcard, PageImage } from './types/flashcard'

/**
 * PDF generation configuration
 */
interface PDFConfig {
	/** Page size (default: 'a6' for flashcard size) */
	pageSize?: 'a4' | 'a5' | 'a6' | 'letter'
	/** Orientation (default: 'landscape') */
	orientation?: 'portrait' | 'landscape'
	/** Font size for questions (default: 14) */
	questionFontSize?: number
	/** Font size for answers (default: 12) */
	answerFontSize?: number
	/** Page margin in mm (default: 10) */
	margin?: number
	/** Include difficulty badge (default: true) */
	showDifficulty?: boolean
	/** Include category (default: true) */
	showCategory?: boolean
	/** Include images in PDF (default: true) */
	showImages?: boolean
}

const DEFAULT_CONFIG: Required<PDFConfig> = {
	pageSize: 'a6',
	orientation: 'landscape',
	questionFontSize: 14,
	answerFontSize: 12,
	margin: 10,
	showDifficulty: true,
	showCategory: true,
	showImages: true,
}

/**
 * Difficulty colors for badges
 */
const DIFFICULTY_COLORS: Record<Flashcard['difficulty'], { r: number; g: number; b: number }> = {
	easy: { r: 34, g: 197, b: 94 }, // green-500
	medium: { r: 234, g: 179, b: 8 }, // yellow-500
	hard: { r: 239, g: 68, b: 68 }, // red-500
}

/**
 * Wraps text to fit within a given width
 */
function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
	return doc.splitTextToSize(text, maxWidth)
}

/**
 * Gets the image data URL for a page index
 */
function getImageDataUrl(
	pageImages: PageImage[] | undefined,
	pageIndex: number | undefined,
): string | null {
	if (pageIndex === undefined || !pageImages) return null
	const pageImage = pageImages.find((img) => img.pageIndex === pageIndex)
	if (!pageImage) return null
	return `data:${pageImage.mimeType};base64,${pageImage.base64}`
}

/**
 * Gets the image dimensions from a data URL
 */
function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.onload = () => resolve({ width: img.width, height: img.height })
		img.onerror = reject
		img.src = dataUrl
	})
}

/**
 * Draws a rounded rectangle
 */
function drawRoundedRect(
	doc: jsPDF,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number,
	style: 'S' | 'F' | 'FD' = 'S',
): void {
	doc.roundedRect(x, y, width, height, radius, radius, style)
}

/**
 * Draws the front of a flashcard (question side)
 * Note: Images are only shown on the back (answer) side
 */
function drawCardFront(
	doc: jsPDF,
	card: Flashcard,
	config: Required<PDFConfig>,
	pageWidth: number,
	pageHeight: number,
	_pageImages?: PageImage[],
): void {
	const { margin, questionFontSize, showDifficulty, showCategory } = config
	const contentWidth = pageWidth - margin * 2

	// Header with category and difficulty
	let headerY = margin

	if (showCategory || showDifficulty) {
		doc.setFontSize(9)
		doc.setTextColor(100, 100, 100)

		if (showCategory && card.category) {
			doc.text(card.category, margin, headerY + 4)
		}

		if (showDifficulty && card.difficulty) {
			const diffColor = DIFFICULTY_COLORS[card.difficulty] ?? DIFFICULTY_COLORS.medium
			const diffText = card.difficulty.toUpperCase()
			const diffWidth = doc.getTextWidth(diffText) + 6

			// Draw difficulty badge
			doc.setFillColor(diffColor.r, diffColor.g, diffColor.b)
			doc.setDrawColor(diffColor.r, diffColor.g, diffColor.b)
			drawRoundedRect(doc, pageWidth - margin - diffWidth, headerY, diffWidth, 6, 1, 'F')

			doc.setTextColor(255, 255, 255)
			doc.text(diffText, pageWidth - margin - diffWidth + 3, headerY + 4)
		}

		headerY += 10
	}

	// "QUESTION" label
	doc.setFontSize(8)
	doc.setTextColor(150, 150, 150)
	doc.text('QUESTION', margin, headerY + 4)
	headerY += 8

	// Question text (no image on front - images only on back)
	doc.setFontSize(questionFontSize)
	doc.setTextColor(0, 0, 0)
	doc.setFont('helvetica', 'bold')

	const questionText = card.front?.question ?? 'Question not available'
	const questionLines = wrapText(doc, questionText, contentWidth)
	const lineHeight = questionFontSize * 0.5

	// Center question vertically in remaining space
	const questionHeight = questionLines.length * lineHeight
	const availableHeight = pageHeight - headerY - margin
	const startY = headerY + Math.max(0, (availableHeight - questionHeight) / 2)

	questionLines.forEach((line, i) => {
		doc.text(line, margin, startY + i * lineHeight)
	})

	// Reset font
	doc.setFont('helvetica', 'normal')

	// Card number in corner
	doc.setFontSize(8)
	doc.setTextColor(200, 200, 200)
	doc.text('FRONT', pageWidth - margin - 15, pageHeight - margin)
}

/**
 * Calculates the required height for a card back page (two-column layout)
 */
async function calculateBackPageHeight(
	doc: jsPDF,
	card: Flashcard,
	config: Required<PDFConfig>,
	pageWidth: number,
	pageImages?: PageImage[],
): Promise<{
	height: number
	imageWidth: number
	imageHeight: number
	imageDataUrl: string | null
}> {
	const { margin, answerFontSize, showImages } = config
	const contentWidth = pageWidth - margin * 2
	const columnGap = 8
	const leftColumnWidth = (contentWidth - columnGap) * 0.4 // 40% for text
	const rightColumnWidth = (contentWidth - columnGap) * 0.6 // 60% for image

	// Check if we have an image for this card (use front.imagePageIndex as fallback)
	const imagePageIndex = card.back.imagePageIndex ?? card.front.imagePageIndex
	const imageDataUrl = showImages ? getImageDataUrl(pageImages, imagePageIndex) : null

	// Calculate image dimensions to fit right column
	let imageHeight = 0
	let imageWidth = rightColumnWidth
	if (imageDataUrl) {
		try {
			const dims = await getImageDimensions(imageDataUrl)
			const aspectRatio = dims.height / dims.width
			imageHeight = rightColumnWidth * aspectRatio
			imageWidth = rightColumnWidth
		} catch {
			imageHeight = 0
		}
	}

	// Calculate text height for left column
	let textHeight = margin + 12 // ANSWER label

	doc.setFontSize(answerFontSize)
	const answerText = card.back?.answer ?? 'Answer not available'
	const answerLines = wrapText(doc, answerText, imageDataUrl ? leftColumnWidth : contentWidth)
	const lineHeight = answerFontSize * 0.5
	textHeight += answerLines.length * lineHeight + 5

	if (card.back.details) {
		doc.setFontSize(10)
		const detailLines = wrapText(
			doc,
			card.back.details,
			imageDataUrl ? leftColumnWidth : contentWidth,
		)
		textHeight += detailLines.length * 5 + 5
	}

	// Image column height (image + caption)
	let imageColumnHeight = margin + 12 // Start at same Y as text
	if (imageHeight > 0) {
		imageColumnHeight += imageHeight + 3
		if (card.back.imageDescription || card.front.imageDescription) {
			imageColumnHeight += 10
		}
	}

	// Page height is the max of both columns + footer
	const totalHeight = Math.max(textHeight, imageColumnHeight) + 20

	return { height: totalHeight, imageWidth, imageHeight, imageDataUrl }
}

/**
 * Draws the back of a flashcard (answer side) - two-column layout
 * Left: Text answer and details
 * Right: Full-size image
 */
function drawCardBack(
	doc: jsPDF,
	card: Flashcard,
	config: Required<PDFConfig>,
	pageWidth: number,
	pageHeight: number,
	imageData: { imageWidth: number; imageHeight: number; imageDataUrl: string | null },
): void {
	const { margin, answerFontSize } = config
	const contentWidth = pageWidth - margin * 2
	const { imageWidth, imageHeight, imageDataUrl } = imageData
	const imageDescription = card.back.imageDescription || card.front.imageDescription

	// Two-column layout when image is present
	const hasImage = imageDataUrl && imageHeight > 0
	const columnGap = 8
	const leftColumnWidth = hasImage ? (contentWidth - columnGap) * 0.4 : contentWidth
	const rightColumnX = margin + leftColumnWidth + columnGap

	// "ANSWER" label
	doc.setFontSize(8)
	doc.setTextColor(150, 150, 150)
	doc.text('ANSWER', margin, margin + 4)
	let currentY = margin + 12

	// Answer text (left column)
	doc.setFontSize(answerFontSize)
	doc.setTextColor(0, 0, 0)
	doc.setFont('helvetica', 'bold')

	const answerText = card.back?.answer ?? 'Answer not available'
	const answerLines = wrapText(doc, answerText, leftColumnWidth)
	const lineHeight = answerFontSize * 0.5

	answerLines.forEach((line, i) => {
		doc.text(line, margin, currentY + i * lineHeight)
	})

	currentY += answerLines.length * lineHeight + 5

	// Details (left column, if present)
	if (card.back.details) {
		doc.setFont('helvetica', 'normal')
		doc.setFontSize(10)
		doc.setTextColor(80, 80, 80)

		const detailLines = wrapText(doc, card.back.details, leftColumnWidth)
		const detailLineHeight = 5

		detailLines.forEach((line, i) => {
			doc.text(line, margin, currentY + i * detailLineHeight)
		})

		currentY += detailLines.length * detailLineHeight + 5
	}

	// Draw image in right column (full size)
	if (hasImage) {
		try {
			const imageY = margin + 12 // Align with text start
			doc.addImage(
				imageDataUrl,
				'JPEG',
				rightColumnX,
				imageY,
				imageWidth,
				imageHeight,
				undefined,
				'MEDIUM',
			)

			// Image caption below image
			if (imageDescription) {
				doc.setFontSize(7)
				doc.setTextColor(100, 100, 100)
				doc.setFont('helvetica', 'italic')
				const captionWidth = imageWidth
				const caption = doc.splitTextToSize(imageDescription, captionWidth)
				const captionY = imageY + imageHeight + 5
				doc.text(caption[0] || '', rightColumnX + imageWidth / 2, captionY, { align: 'center' })
			}
		} catch {
			// Image failed to load, skip it
		}
	}

	// Reset font
	doc.setFont('helvetica', 'normal')

	// Card indicator (bottom right)
	doc.setFontSize(8)
	doc.setTextColor(200, 200, 200)
	doc.text('BACK', pageWidth - margin - 12, pageHeight - margin)
}

/**
 * Generates a PDF document containing flashcards
 *
 * Creates a double-sided printable PDF where:
 * - Odd pages contain the front (question) of each card
 * - Even pages contain the back (answer) of each card
 * - Images are displayed at full size on the answer page
 *
 * @param flashcards - Array of flashcard objects to include
 * @param config - PDF generation options
 * @param pageImages - Array of page images for embedding in PDF
 * @returns PDF as a Blob
 *
 * @example
 * ```ts
 * const blob = await generateFlashcardPDF(flashcards, {}, pageImages);
 * const url = URL.createObjectURL(blob);
 * // Download or display the PDF
 * ```
 */
export async function generateFlashcardPDF(
	flashcards: Flashcard[],
	config: PDFConfig = {},
	pageImages?: PageImage[],
): Promise<Blob> {
	const opts = { ...DEFAULT_CONFIG, ...config }

	// Create PDF with specified orientation
	const doc = new jsPDF({
		orientation: opts.orientation,
		unit: 'mm',
		format: opts.pageSize,
	})

	// Get page dimensions
	const pageWidth = doc.internal.pageSize.getWidth()
	const pageHeight = doc.internal.pageSize.getHeight()

	// Generate pages for each flashcard
	for (let index = 0; index < flashcards.length; index++) {
		const card = flashcards[index]

		// Add new page if not first card
		if (index > 0) {
			doc.addPage()
		}

		// Draw front of card (question) - standard page size
		drawCardFront(doc, card, opts, pageWidth, pageHeight, pageImages)

		// Calculate required height for back page (to fit full-size images)
		const backPageData = await calculateBackPageHeight(doc, card, opts, pageWidth, pageImages)
		const backPageHeight = Math.max(pageHeight, backPageData.height)

		// Add back page with custom height if needed
		doc.addPage([pageWidth, backPageHeight])
		drawCardBack(doc, card, opts, pageWidth, backPageHeight, {
			imageWidth: backPageData.imageWidth,
			imageHeight: backPageData.imageHeight,
			imageDataUrl: backPageData.imageDataUrl,
		})
	}

	// Return as Blob
	return doc.output('blob')
}

/**
 * Generates a PDF with cards arranged for double-sided printing
 *
 * Cards are arranged in a 2x2 grid on A4 pages. When printed double-sided
 * and cut, each front aligns with its corresponding back. The layout ensures
 * proper alignment when flipping horizontally.
 *
 * @param flashcards - Array of flashcard objects
 * @param config - PDF generation options
 * @param pageImages - Array of page images (not used in printable format due to size constraints)
 * @returns PDF as a Blob
 */
export async function generatePrintablePDF(
	flashcards: Flashcard[],
	config: PDFConfig = {},
	_pageImages?: PageImage[],
): Promise<Blob> {
	const opts = { ...DEFAULT_CONFIG, ...config }

	// Use A4 in portrait for printable layout
	const doc = new jsPDF({
		orientation: 'portrait',
		unit: 'mm',
		format: 'a4',
	})

	const pageWidth = doc.internal.pageSize.getWidth()
	const pageHeight = doc.internal.pageSize.getHeight()

	// Card dimensions (4 cards per A4 page = 2x2 grid)
	const cardsPerRow = 2
	const cardsPerCol = 2
	const cardsPerPage = cardsPerRow * cardsPerCol

	const cardWidth = (pageWidth - opts.margin * 2) / cardsPerRow - 2 // 2mm gap
	const cardHeight = (pageHeight - opts.margin * 2) / cardsPerCol - 2

	// Process cards in groups of 4
	for (let pageIndex = 0; pageIndex < Math.ceil(flashcards.length / cardsPerPage); pageIndex++) {
		const startIdx = pageIndex * cardsPerPage
		const pageCards = flashcards.slice(startIdx, startIdx + cardsPerPage)

		// Add front page (questions)
		if (pageIndex > 0) {
			doc.addPage()
		}

		// Draw cut lines (dashed)
		doc.setDrawColor(200, 200, 200)
		doc.setLineDashPattern([2, 2], 0)
		doc.line(pageWidth / 2, opts.margin, pageWidth / 2, pageHeight - opts.margin)
		doc.line(opts.margin, pageHeight / 2, pageWidth - opts.margin, pageHeight / 2)
		doc.setLineDashPattern([], 0)

		// Draw front of each card
		pageCards.forEach((card, idx) => {
			const row = Math.floor(idx / cardsPerRow)
			const col = idx % cardsPerRow

			const x = opts.margin + col * (cardWidth + 2)
			const y = opts.margin + row * (cardHeight + 2)

			// Draw card border
			doc.setDrawColor(220, 220, 220)
			doc.rect(x, y, cardWidth, cardHeight)

			// Draw card content
			drawCardFrontPrintable(doc, card, opts, x, y, cardWidth, cardHeight)
		})

		// Add back page (answers) - reversed horizontally for proper alignment
		doc.addPage()

		// Draw cut lines
		doc.setDrawColor(200, 200, 200)
		doc.setLineDashPattern([2, 2], 0)
		doc.line(pageWidth / 2, opts.margin, pageWidth / 2, pageHeight - opts.margin)
		doc.line(opts.margin, pageHeight / 2, pageWidth - opts.margin, pageHeight / 2)
		doc.setLineDashPattern([], 0)

		// Draw back of each card (reversed column order for double-sided printing)
		pageCards.forEach((card, idx) => {
			const row = Math.floor(idx / cardsPerRow)
			const col = idx % cardsPerRow

			// Reverse column for back side (so cards align when flipped)
			const reversedCol = cardsPerRow - 1 - col

			const x = opts.margin + reversedCol * (cardWidth + 2)
			const y = opts.margin + row * (cardHeight + 2)

			// Draw card border
			doc.setDrawColor(220, 220, 220)
			doc.rect(x, y, cardWidth, cardHeight)

			// Draw card content
			drawCardBackPrintable(doc, card, opts, x, y, cardWidth, cardHeight)
		})
	}

	return doc.output('blob')
}

/**
 * Draws the front of a card for printable layout (compact version)
 */
function drawCardFrontPrintable(
	doc: jsPDF,
	card: Flashcard,
	_config: Required<PDFConfig>,
	x: number,
	y: number,
	width: number,
	height: number,
): void {
	const padding = 5
	const contentWidth = width - padding * 2

	// Category and difficulty header
	doc.setFontSize(7)
	doc.setTextColor(100, 100, 100)
	doc.text(card.category ?? 'General', x + padding, y + padding + 3)

	const difficulty = card.difficulty ?? 'medium'
	const diffColor = DIFFICULTY_COLORS[difficulty] ?? DIFFICULTY_COLORS.medium
	const diffText = difficulty.charAt(0).toUpperCase()
	doc.setFillColor(diffColor.r, diffColor.g, diffColor.b)
	doc.circle(x + width - padding - 3, y + padding + 1.5, 3, 'F')
	doc.setTextColor(255, 255, 255)
	doc.setFontSize(6)
	doc.text(diffText, x + width - padding - 4, y + padding + 3)

	// Question
	doc.setFontSize(10)
	doc.setTextColor(0, 0, 0)
	doc.setFont('helvetica', 'bold')

	const questionText = card.front?.question ?? 'Question not available'
	const questionLines = wrapText(doc, questionText, contentWidth)
	const lineHeight = 5
	const startY = y + padding + 12

	questionLines.slice(0, Math.floor((height - 25) / lineHeight)).forEach((line, i) => {
		doc.text(line, x + padding, startY + i * lineHeight)
	})

	doc.setFont('helvetica', 'normal')
}

/**
 * Draws the back of a card for printable layout (compact version)
 */
function drawCardBackPrintable(
	doc: jsPDF,
	card: Flashcard,
	_config: Required<PDFConfig>,
	x: number,
	y: number,
	width: number,
	height: number,
): void {
	const padding = 5
	const contentWidth = width - padding * 2

	// Answer header
	doc.setFontSize(7)
	doc.setTextColor(100, 100, 100)
	doc.text('ANSWER', x + padding, y + padding + 3)

	// Answer text
	doc.setFontSize(9)
	doc.setTextColor(0, 0, 0)
	doc.setFont('helvetica', 'bold')

	const answerText = card.back?.answer ?? 'Answer not available'
	const answerLines = wrapText(doc, answerText, contentWidth)
	const lineHeight = 4.5
	let currentY = y + padding + 10

	answerLines.slice(0, Math.floor((height - 30) / lineHeight)).forEach((line, i) => {
		doc.text(line, x + padding, currentY + i * lineHeight)
		currentY = y + padding + 10 + (i + 1) * lineHeight
	})

	// Details (if space permits)
	if (card.back.details && currentY < y + height - 15) {
		doc.setFont('helvetica', 'normal')
		doc.setFontSize(7)
		doc.setTextColor(80, 80, 80)
		currentY += 3

		const detailLines = wrapText(doc, card.back.details, contentWidth)
		const detailHeight = 3.5
		detailLines
			.slice(0, Math.floor((y + height - currentY - 5) / detailHeight))
			.forEach((line, i) => {
				doc.text(line, x + padding, currentY + i * detailHeight)
			})
	}

	doc.setFont('helvetica', 'normal')
}

/**
 * Generates a PDF optimized for digital viewing (single page per card)
 *
 * @param flashcards - Array of flashcard objects
 * @param config - PDF generation options
 * @param pageImages - Array of page images for embedding in PDF
 * @returns PDF as a Blob
 */
export async function generateDigitalPDF(
	flashcards: Flashcard[],
	config: PDFConfig = {},
	pageImages?: PageImage[],
): Promise<Blob> {
	return generateFlashcardPDF(
		flashcards,
		{
			...config,
			pageSize: 'a5',
			orientation: 'landscape',
		},
		pageImages,
	)
}
