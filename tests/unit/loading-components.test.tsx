/**
 * Unit tests for Loading components
 */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
	LoadingSpinner,
	ProgressBar,
	PulsingDot,
	Skeleton,
	SkeletonFlashcard,
	SkeletonFlashcardGrid,
	SkeletonMetadata,
} from '~/components/ui/Loading'

describe('Loading Components', () => {
	afterEach(() => {
		cleanup()
	})

	describe('Skeleton', () => {
		it('should render with default classes', () => {
			const { container } = render(<Skeleton />)
			const skeleton = container.querySelector('[role="status"]')
			expect(skeleton).toBeDefined()
			expect(skeleton?.className).toContain('animate-pulse')
			expect(skeleton?.className).toContain('bg-gray-200')
		})

		it('should accept custom className', () => {
			const { container } = render(<Skeleton className="custom-class" />)
			const skeleton = container.querySelector('[role="status"]')
			expect(skeleton?.className).toContain('custom-class')
		})
	})

	describe('SkeletonFlashcard', () => {
		it('should render skeleton card structure', () => {
			const { container } = render(<SkeletonFlashcard />)
			const card = container.querySelector('[aria-label="Loading flashcard..."]')
			expect(card).toBeDefined()
		})
	})

	describe('SkeletonFlashcardGrid', () => {
		it('should render default 6 skeleton cards', () => {
			const { container } = render(<SkeletonFlashcardGrid />)
			const cards = container.querySelectorAll('[aria-label="Loading flashcard..."]')
			expect(cards.length).toBe(6)
		})

		it('should render specified count of cards', () => {
			const { container } = render(<SkeletonFlashcardGrid count={3} />)
			const cards = container.querySelectorAll('[aria-label="Loading flashcard..."]')
			expect(cards.length).toBe(3)
		})
	})

	describe('SkeletonMetadata', () => {
		it('should render metadata skeleton', () => {
			const { container } = render(<SkeletonMetadata />)
			const meta = container.querySelector('[aria-label="Loading metadata..."]')
			expect(meta).toBeDefined()
		})
	})

	describe('LoadingSpinner', () => {
		it('should render with default medium size', () => {
			const { container } = render(<LoadingSpinner />)
			const spinner = container.querySelector('svg')
			expect(spinner?.className).toContain('h-8')
			expect(spinner?.className).toContain('w-8')
		})

		it('should render small size', () => {
			const { container } = render(<LoadingSpinner size="sm" />)
			const spinner = container.querySelector('svg')
			expect(spinner?.className).toContain('h-4')
			expect(spinner?.className).toContain('w-4')
		})

		it('should render large size', () => {
			const { container } = render(<LoadingSpinner size="lg" />)
			const spinner = container.querySelector('svg')
			expect(spinner?.className).toContain('h-12')
			expect(spinner?.className).toContain('w-12')
		})

		it('should render with default blue color', () => {
			const { container } = render(<LoadingSpinner />)
			const spinner = container.querySelector('svg')
			expect(spinner?.className).toContain('text-blue-600')
		})
	})

	describe('PulsingDot', () => {
		it('should render with default blue color', () => {
			const { container } = render(<PulsingDot />)
			const dot = container.querySelector('.bg-blue-500')
			expect(dot).toBeDefined()
			expect(dot).not.toBeNull()
		})

		it('should render with animation', () => {
			const { container } = render(<PulsingDot />)
			const pingDot = container.querySelector('.animate-ping')
			expect(pingDot).toBeDefined()
			expect(pingDot).not.toBeNull()
		})
	})

	describe('ProgressBar', () => {
		it('should render with 0% progress', () => {
			const { container } = render(<ProgressBar progress={0} />)
			const bar = container.querySelector('[style*="width"]')
			expect(bar?.getAttribute('style')).toContain('0%')
		})

		it('should render with 50% progress', () => {
			const { container } = render(<ProgressBar progress={50} />)
			const bar = container.querySelector('[style*="width"]')
			expect(bar?.getAttribute('style')).toContain('50%')
		})

		it('should render with 100% progress', () => {
			const { container } = render(<ProgressBar progress={100} />)
			const bar = container.querySelector('[style*="width"]')
			expect(bar?.getAttribute('style')).toContain('100%')
		})

		it('should show label when showLabel is true', () => {
			render(<ProgressBar progress={75} showLabel />)
			const label = screen.getByText('75%')
			expect(label).toBeDefined()
		})
	})
})
