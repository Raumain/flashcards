/**
 * Unit tests for flashcard types and schemas
 */
import { describe, expect, it } from 'vitest'
import { type Flashcard, FlashcardSchema, GenerationResultSchema } from '~/lib/types/flashcard'

describe('Flashcard Schema', () => {
	const validFlashcard: Flashcard = {
		id: 'card-1',
		front: {
			question: 'What is the function of the mitochondria?',
		},
		back: {
			answer: 'The mitochondria is the powerhouse of the cell, responsible for ATP production.',
			details: 'It produces energy through cellular respiration.',
		},
		category: 'Biology',
		difficulty: 'medium',
	}

	it('should validate a correct flashcard', () => {
		const result = FlashcardSchema.safeParse(validFlashcard)
		expect(result.success).toBe(true)
	})

	it('should reject flashcard with short question', () => {
		const invalid = { ...validFlashcard, front: { question: 'Short?' } }
		const result = FlashcardSchema.safeParse(invalid)
		expect(result.success).toBe(false)
	})

	it('should reject flashcard with invalid difficulty', () => {
		const invalid = { ...validFlashcard, difficulty: 'extreme' }
		const result = FlashcardSchema.safeParse(invalid)
		expect(result.success).toBe(false)
	})

	it('should accept all valid difficulty levels', () => {
		for (const difficulty of ['easy', 'medium', 'hard']) {
			const card = { ...validFlashcard, difficulty }
			const result = FlashcardSchema.safeParse(card)
			expect(result.success).toBe(true)
		}
	})
})

describe('GenerationResult Schema', () => {
	// Create valid test data with 9 flashcards (3 per difficulty level)
	const createFlashcard = (id: string, difficulty: 'easy' | 'medium' | 'hard') => ({
		id,
		front: { question: 'What is the function of the mitochondria?' },
		back: { answer: 'The mitochondria produces ATP for cellular energy.' },
		category: 'Biology',
		difficulty,
	})

	const validResult = {
		flashcards: [
			createFlashcard('card-1', 'easy'),
			createFlashcard('card-2', 'easy'),
			createFlashcard('card-3', 'easy'),
			createFlashcard('card-4', 'medium'),
			createFlashcard('card-5', 'medium'),
			createFlashcard('card-6', 'medium'),
			createFlashcard('card-7', 'hard'),
			createFlashcard('card-8', 'hard'),
			createFlashcard('card-9', 'hard'),
		],
		metadata: {
			subject: 'Cell Biology',
			totalConcepts: 5,
			recommendations: 'Focus on organelle functions',
		},
	}

	it('should validate a correct generation result', () => {
		const result = GenerationResultSchema.safeParse(validResult)
		expect(result.success).toBe(true)
	})

	it('should reject empty flashcards array', () => {
		const invalid = { ...validResult, flashcards: [] }
		const result = GenerationResultSchema.safeParse(invalid)
		expect(result.success).toBe(false)
	})

	it('should allow optional recommendations in metadata', () => {
		const noRecs = {
			flashcards: validResult.flashcards,
			metadata: { subject: 'Biology', totalConcepts: 3 },
		}
		const result = GenerationResultSchema.safeParse(noRecs)
		expect(result.success).toBe(true)
	})
})
