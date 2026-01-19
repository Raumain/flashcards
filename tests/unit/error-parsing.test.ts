/**
 * Unit tests for ErrorAlert utility functions
 */
import { describe, expect, it } from 'vitest'
import { parseError } from '~/components/ui/ErrorAlert'

describe('parseError', () => {
	it('should parse INVALID_FILE errors', () => {
		const result = parseError({ code: 'INVALID_FILE', message: 'Not a PDF' })
		expect(result.type).toBe('INVALID_FILE')
		expect(result.title).toBe('Fichier PDF invalide')
		expect(result.canRetry).toBe(false)
	})

	it('should parse rate limit errors from message', () => {
		const result = parseError('Rate limit exceeded, quota reached')
		expect(result.type).toBe('RATE_LIMITED')
		expect(result.canRetry).toBe(true)
	})

	it('should parse network errors from message', () => {
		const result = parseError('Network connection failed')
		expect(result.type).toBe('NETWORK_ERROR')
		expect(result.canRetry).toBe(true)
	})

	it('should parse content filtered errors', () => {
		const result = parseError('Content was blocked by safety filters')
		expect(result.type).toBe('CONTENT_FILTERED')
		expect(result.canRetry).toBe(false)
	})

	it('should parse timeout errors', () => {
		const result = parseError('Request timed out')
		expect(result.type).toBe('TIMEOUT')
		expect(result.canRetry).toBe(true)
	})

	it('should parse processing errors', () => {
		const result = parseError({ code: 'PROCESSING_ERROR', message: 'Conversion failed' })
		expect(result.type).toBe('PROCESSING_ERROR')
		expect(result.canRetry).toBe(true)
	})

	it('should parse AI errors', () => {
		const result = parseError({ code: 'AI_ERROR', message: 'Generation failed' })
		expect(result.type).toBe('AI_ERROR')
		expect(result.canRetry).toBe(true)
	})

	it('should default to UNKNOWN for unrecognized errors', () => {
		const result = parseError('Something completely unexpected happened')
		expect(result.type).toBe('UNKNOWN')
		expect(result.canRetry).toBe(true)
	})

	it('should handle empty error message with fallback', () => {
		const result = parseError('')
		expect(result.type).toBe('UNKNOWN')
		// Empty string gets default message
		expect(result.message).toBeDefined()
	})

	it('should include suggestion for all error types', () => {
		const errors = [
			{ code: 'INVALID_FILE', message: 'test' },
			{ code: 'FILE_TOO_LARGE', message: 'test' },
			{ code: 'RATE_LIMITED', message: 'test' },
			{ code: 'CONTENT_FILTERED', message: 'test' },
			{ code: 'NETWORK_ERROR', message: 'test' },
			{ code: 'TIMEOUT', message: 'test' },
			{ code: 'PROCESSING_ERROR', message: 'test' },
			{ code: 'AI_ERROR', message: 'test' },
		]

		for (const error of errors) {
			const result = parseError(error)
			expect(result.suggestion).toBeTruthy()
			expect(result.suggestion.length).toBeGreaterThan(10)
		}
	})
})
