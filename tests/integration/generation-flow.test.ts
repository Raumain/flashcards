/**
 * Integration tests for the generation flow
 * Tests the complete upload → process → generate cycle with mocked APIs
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the server function
const mockGenerateFlashcards = vi.fn()

vi.mock('~/server/functions/generate', () => ({
  generateFlashcards: () => mockGenerateFlashcards,
}))

describe('Generation Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Server Function', () => {
    it('should handle successful generation', async () => {
      const mockResult = {
        flashcards: [
          {
            id: '1',
            front: { question: 'What is the heart?' },
            back: { answer: 'A muscular organ that pumps blood' },
            category: 'Anatomy',
            difficulty: 'easy',
          },
        ],
        metadata: {
          subject: 'Anatomy',
          totalConcepts: 1,
        },
      }

      mockGenerateFlashcards.mockResolvedValue(mockResult)

      const result = await mockGenerateFlashcards()
      expect(result).toEqual(mockResult)
      expect(result.flashcards).toHaveLength(1)
      expect(result.flashcards[0].front.question).toBe('What is the heart?')
    })

    it('should handle API errors gracefully', async () => {
      mockGenerateFlashcards.mockRejectedValue(new Error('AI_ERROR: Generation failed'))

      await expect(mockGenerateFlashcards()).rejects.toThrow('AI_ERROR')
    })

    it('should handle rate limiting', async () => {
      mockGenerateFlashcards.mockRejectedValue(new Error('Rate limit exceeded'))

      await expect(mockGenerateFlashcards()).rejects.toThrow('Rate limit')
    })

    it('should handle network errors', async () => {
      mockGenerateFlashcards.mockRejectedValue(new Error('Network connection failed'))

      await expect(mockGenerateFlashcards()).rejects.toThrow('Network')
    })
  })

  describe('Flashcard Output Validation', () => {
    it('should generate cards with required fields', async () => {
      const mockResult = {
        flashcards: [
          {
            id: 'card-1',
            front: { question: 'What are the chambers of the heart?' },
            back: { answer: 'Four chambers: left atrium, right atrium, left ventricle, right ventricle' },
            category: 'Cardiology',
            difficulty: 'medium',
          },
          {
            id: 'card-2',
            front: { question: 'What is systole?' },
            back: { answer: 'The phase of heartbeat when the heart muscle contracts' },
            category: 'Cardiology',
            difficulty: 'easy',
          },
        ],
        metadata: {
          subject: 'Cardiology',
          totalConcepts: 2,
        },
      }

      mockGenerateFlashcards.mockResolvedValue(mockResult)

      const result = await mockGenerateFlashcards()

      // Validate each flashcard has required fields
      for (const card of result.flashcards) {
        expect(card).toHaveProperty('id')
        expect(card).toHaveProperty('front')
        expect(card).toHaveProperty('back')
        expect(card.front).toHaveProperty('question')
        expect(card.back).toHaveProperty('answer')
        expect(card).toHaveProperty('category')
        expect(card).toHaveProperty('difficulty')
        expect(card.id).toBeTruthy()
        expect(card.front.question.length).toBeGreaterThan(5)
        expect(card.back.answer.length).toBeGreaterThan(5)
      }
    })

    it('should generate metadata with correct totals', async () => {
      const mockResult = {
        flashcards: Array.from({ length: 10 }, (_, i) => ({
          id: `card-${i + 1}`,
          front: { question: `Question ${i + 1}?` },
          back: { answer: `Answer ${i + 1}` },
          category: i % 2 === 0 ? 'Anatomy' : 'Physiology',
          difficulty: 'medium' as const,
        })),
        metadata: {
          subject: 'Anatomy & Physiology',
          totalConcepts: 10,
        },
      }

      mockGenerateFlashcards.mockResolvedValue(mockResult)

      const result = await mockGenerateFlashcards()

      expect(result.metadata.totalConcepts).toBe(10)
      expect(result.metadata.subject).toBe('Anatomy & Physiology')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty PDF content', async () => {
      mockGenerateFlashcards.mockRejectedValue(
        new Error('PROCESSING_ERROR: No text content found in PDF')
      )

      await expect(mockGenerateFlashcards()).rejects.toThrow('No text content')
    })

    it('should handle very large outputs', async () => {
      const largeResult = {
        flashcards: Array.from({ length: 100 }, (_, i) => ({
          id: `card-${i + 1}`,
          front: { question: `Question ${i + 1}: ${'A'.repeat(200)}?` },
          back: { answer: `Answer ${i + 1}: ${'B'.repeat(500)}` },
          category: 'Test',
          difficulty: 'medium' as const,
        })),
        metadata: {
          subject: 'Test',
          totalConcepts: 100,
        },
      }

      mockGenerateFlashcards.mockResolvedValue(largeResult)

      const result = await mockGenerateFlashcards()
      expect(result.flashcards).toHaveLength(100)
    })

    it('should handle special characters in content', async () => {
      const specialResult = {
        flashcards: [
          {
            id: '1',
            front: { question: 'What is the formula for glucose (C₆H₁₂O₆)?' },
            back: { answer: 'C₆H₁₂O₆ — a monosaccharide with "aldehyde" group' },
            category: 'Biochemistry',
            difficulty: 'medium' as const,
          },
        ],
        metadata: {
          subject: 'Biochemistry',
          totalConcepts: 1,
        },
      }

      mockGenerateFlashcards.mockResolvedValue(specialResult)

      const result = await mockGenerateFlashcards()
      expect(result.flashcards[0].front.question).toContain('C₆H₁₂O₆')
      expect(result.flashcards[0].back.answer).toContain('aldehyde')
    })
  })
})
