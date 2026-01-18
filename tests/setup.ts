import '@testing-library/dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock environment variables
vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY', 'test-api-key')

// Mock fetch globally
global.fetch = vi.fn()

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

// Mock console.error to suppress expected React warnings in tests
// Only suppresses specific known messages to avoid hiding real errors
const originalError = console.error
const SUPPRESSED_PATTERNS = [
  'React error boundary',
  'Warning: ReactDOM.render',
  'Warning: An update to .* inside a test was not wrapped in act',
  'Warning: Cannot update a component',
]

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const message = typeof args[0] === 'string' ? args[0] : ''
    const shouldSuppress = SUPPRESSED_PATTERNS.some(pattern =>
      new RegExp(pattern).test(message)
    )

    if (shouldSuppress) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
