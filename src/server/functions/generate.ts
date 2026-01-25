import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { db } from '~/lib/db'
import { flashcards, thematics } from '~/lib/db/schema'
import {
  awaitStreamResult,
  extractThematicFromImages,
  GeminiError,
  streamFlashcardsFromImages,
} from '../../lib/gemini'
import { PDFProcessingError, pdfToImages } from '../../lib/pdf-processor'
import type { GenerationResult } from '../../lib/types/flashcard'
import { type AuthContext, authMiddleware } from '../middleware/auth'

/**
 * Maximum file size in bytes (20MB)
 */
const MAX_FILE_SIZE = 20 * 1024 * 1024

/**
 * Maximum pages to process
 */
const MAX_PAGES = 50

/**
 * Rate limit configuration
 */
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10 // 10 requests per minute
const MAX_CONCURRENT_REQUESTS_PER_IP = 2 // Max concurrent requests per IP

/**
 * Rate limiter entry for tracking requests per IP
 */
interface RateLimitEntry {
  count: number
  resetAt: number
  activeRequests: number
}

/**
 * In-memory rate limiter store
 * Note: For production, replace with Redis for distributed rate limiting
 */
const rateLimiter = new Map<string, RateLimitEntry>()

/**
 * Request queue for managing concurrent requests per IP
 */
const requestQueues = new Map<string, Array<() => void>>()

/**
 * Cleanup old rate limit entries every 5 minutes
 */
setInterval(
  () => {
    const now = Date.now()
    for (const [ip, entry] of rateLimiter.entries()) {
      if (entry.resetAt < now && entry.activeRequests === 0) {
        rateLimiter.delete(ip)
      }
    }
  },
  5 * 60 * 1000,
)

/**
 * Extracts client IP from request headers
 */
function getClientIP(request: Request | undefined): string {
  if (!request) return 'unknown'

  // Check common proxy headers
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  return 'unknown'
}

/**
 * Checks rate limit for an IP address
 * @returns true if request is allowed, false if rate limited
 */
function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const entry = rateLimiter.get(ip)

  if (!entry) {
    // First request from this IP
    rateLimiter.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
      activeRequests: 0,
    })
    return { allowed: true }
  }

  // Reset if window expired
  if (now >= entry.resetAt) {
    entry.count = 1
    entry.resetAt = now + RATE_LIMIT_WINDOW_MS
    return { allowed: true }
  }

  // Check if limit exceeded
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, retryAfter }
  }

  // Increment count
  entry.count++
  return { allowed: true }
}

/**
 * Acquires a slot for concurrent request processing
 * Returns a release function to call when request completes
 */
async function acquireConcurrencySlot(ip: string): Promise<() => void> {
  return new Promise((resolve) => {
    const entry = rateLimiter.get(ip)

    if (!entry) {
      // Should not happen, but handle gracefully
      resolve(() => { })
      return
    }

    const tryAcquire = () => {
      if (entry.activeRequests < MAX_CONCURRENT_REQUESTS_PER_IP) {
        entry.activeRequests++
        resolve(() => {
          entry.activeRequests--
          // Process next queued request
          const queue = requestQueues.get(ip)
          if (queue && queue.length > 0) {
            const next = queue.shift()
            next?.()
          }
        })
      } else {
        // Queue this request
        let queue = requestQueues.get(ip)
        if (!queue) {
          queue = []
          requestQueues.set(ip, queue)
        }
        queue.push(tryAcquire)
      }
    }

    tryAcquire()
  })
}

/**
 * Logger utility for consistent server-side logging
 */
function log(level: 'info' | 'warn' | 'error', message: string, data?: unknown) {
  const timestamp = new Date().toISOString()
  const prefix = `[Server ${level.toUpperCase()}] ${timestamp}`
  if (data !== undefined) {
    console[level](`${prefix} ${message}`, data)
  } else {
    console[level](`${prefix} ${message}`)
  }
}

/**
 * API Error codes
 */
export type APIErrorCode =
  | 'INVALID_FILE'
  | 'FILE_TOO_LARGE'
  | 'PAYLOAD_TOO_LARGE'
  | 'PROCESSING_ERROR'
  | 'AI_ERROR'
  | 'TIMEOUT'
  | 'RATE_LIMITED'

/**
 * Standardized API error response
 */
export interface APIError {
  code: APIErrorCode
  message: string
  details?: { error: string }
  retryAfter?: number
}

/**
 * Generation response type
 */
export type GenerateResponse =
  | { success: true; data: GenerationResult }
  | { success: false; error: APIError }

/**
 * Maps internal errors to API error codes
 */
function mapErrorToAPIError(error: unknown): APIError {
  if (error instanceof PDFProcessingError) {
    switch (error.code) {
      case 'INVALID_PDF':
      case 'EMPTY_PDF':
        return {
          code: 'INVALID_FILE',
          message: error.message,
          details: error.details ? { error: String(error.details) } : undefined,
        }
      case 'TOO_MANY_PAGES':
        return {
          code: 'INVALID_FILE',
          message: error.message,
          details: error.details ? { error: String(error.details) } : undefined,
        }
      case 'CONVERSION_FAILED':
        return {
          code: 'PROCESSING_ERROR',
          message: error.message,
          details: error.details ? { error: String(error.details) } : undefined,
        }
    }
  }

  if (error instanceof GeminiError) {
    if (error.code === 'TIMEOUT') {
      return {
        code: 'TIMEOUT',
        message: 'La génération a pris trop de temps. Essayez avec un PDF plus court.',
        details: error.details ? { error: String(error.details) } : undefined,
      }
    }
    if (error.code === 'PAYLOAD_TOO_LARGE') {
      return {
        code: 'PAYLOAD_TOO_LARGE',
        message: error.message,
        details: error.details ? { error: String(error.details) } : undefined,
      }
    }
    return {
      code: 'AI_ERROR',
      message: error.message,
      details: error.details ? { error: String(error.details) } : undefined,
    }
  }

  if (error instanceof Error) {
    return { code: 'PROCESSING_ERROR', message: error.message }
  }

  return { code: 'PROCESSING_ERROR', message: 'An unexpected error occurred' }
}

/**
 * Server function to generate flashcards from a PDF file
 *
 * @description
 * This function:
 * 1. Extracts and validates the PDF from FormData
 * 2. Converts PDF pages to images
 * 3. Sends images to Gemini for flashcard generation
 * 4. Returns structured flashcard data
 *
 * @example
 * ```tsx
 * const formData = new FormData();
 * formData.append('pdf', file);
 * const result = await generateFlashcards({ data: formData });
 * ```
 */
export const generateFlashcards = createServerFn({ method: 'POST' })
  .inputValidator((data: FormData) => {
    if (!(data instanceof FormData)) {
      throw new Error('Expected FormData')
    }

    const file = data.get('pdf')

    if (!file || !(file instanceof File)) {
      throw new Error('No PDF file provided')
    }

    if (file.type !== 'application/pdf') {
      throw new Error('File must be a PDF')
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    return { file }
  })
  .handler(async ({ data }): Promise<GenerateResponse> => {
    const startTime = Date.now()

    // Get client IP for rate limiting
    const request = getRequest()
    const clientIP = getClientIP(request)
    log('info', `=== Starting flashcard generation for IP: ${clientIP} ===`)

    // Check rate limit
    const rateLimitResult = checkRateLimit(clientIP)
    if (!rateLimitResult.allowed) {
      log(
        'warn',
        `Rate limit exceeded for IP: ${clientIP}. Retry after ${rateLimitResult.retryAfter}s`,
      )
      return {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: `Trop de requêtes. Veuillez réessayer dans ${rateLimitResult.retryAfter} secondes.`,
          retryAfter: rateLimitResult.retryAfter,
        },
      }
    }

    // Acquire concurrency slot (queues if too many concurrent requests)
    const releaseSlot = await acquireConcurrencySlot(clientIP)
    log('info', 'Concurrency slot acquired')

    try {
      const { file } = data
      log('info', `Processing file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)

      // Convert file to ArrayBuffer
      log('info', 'Step 1/4: Converting file to ArrayBuffer...')
      const bufferStart = Date.now()
      const buffer = await file.arrayBuffer()
      log('info', `Step 1/4 completed in ${Date.now() - bufferStart}ms`)

      // Convert PDF to images
      log('info', 'Step 2/4: Converting PDF to images...')
      const pdfStart = Date.now()
      const images = await pdfToImages(buffer, { maxPages: MAX_PAGES })
      log(
        'info',
        `Step 2/4 completed in ${Date.now() - pdfStart}ms - ${images.length} pages converted`,
      )

      // Generate flashcards using Gemini
      log('info', 'Step 3/4: Calling Gemini AI for flashcard generation...')
      const aiStart = Date.now()
      const streamData = await streamFlashcardsFromImages(images)

      // Wait for the complete result with timeout handling
      log('info', 'Step 3/4: Waiting for AI response...')
      const result = await awaitStreamResult(streamData)
      log(
        'info',
        `Step 3/4 completed in ${Date.now() - aiStart}ms - ${result.flashcards?.length ?? 0} flashcards generated`,
      )

      // Attach page images for flashcards that reference them
      log('info', 'Step 4/4: Attaching page images...')
      const pageImages = images.map((img, index) => ({
        pageIndex: index,
        base64: img.base64,
        mimeType: img.mimeType,
      }))

      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2)
      log('info', `=== Generation completed successfully in ${totalTime}s ===`)

      return {
        success: true,
        data: {
          ...result,
          pageImages,
        },
      }
    } catch (error) {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2)
      log('error', `=== Generation failed after ${totalTime}s ===`, error)
      return {
        success: false,
        error: mapErrorToAPIError(error),
      }
    } finally {
      // Always release the concurrency slot
      releaseSlot()
      log('info', 'Concurrency slot released')
    }
  })

/**
 * Server function to generate flashcards with streaming response
 *
 * Uses async generator to yield partial flashcard results
 * for real-time UI updates during generation.
 *
 * @example
 * ```tsx
 * const formData = new FormData();
 * formData.append('pdf', file);
 *
 * for await (const partial of await generateFlashcardsStreaming({ data: formData })) {
 *   console.log('Partial result:', partial);
 * }
 * ```
 */
export const generateFlashcardsStreaming = createServerFn({ method: 'POST' })
  .inputValidator((data: FormData) => {
    if (!(data instanceof FormData)) {
      throw new Error('Expected FormData')
    }

    const file = data.get('pdf')

    if (!file || !(file instanceof File)) {
      throw new Error('No PDF file provided')
    }

    if (file.type !== 'application/pdf') {
      throw new Error('File must be a PDF')
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    return { file }
  })
  .handler(async function* ({ data }) {
    // Get client IP for rate limiting
    const request = getRequest()
    const clientIP = getClientIP(request)
    log('info', `=== Starting streaming flashcard generation for IP: ${clientIP} ===`)

    // Check rate limit
    const rateLimitResult = checkRateLimit(clientIP)
    if (!rateLimitResult.allowed) {
      log(
        'warn',
        `Rate limit exceeded for IP: ${clientIP}. Retry after ${rateLimitResult.retryAfter}s`,
      )
      throw new Error(`RATE_LIMITED:${rateLimitResult.retryAfter}`)
    }

    // Acquire concurrency slot
    const releaseSlot = await acquireConcurrencySlot(clientIP)
    log('info', 'Concurrency slot acquired for streaming')

    try {
      const { file } = data

      // Convert file to ArrayBuffer
      const buffer = await file.arrayBuffer()

      // Convert PDF to images
      const images = await pdfToImages(buffer, { maxPages: MAX_PAGES })

      // Stream flashcard generation
      const streamData = await streamFlashcardsFromImages(images)

      // Yield partial results as they come in
      for await (const partial of streamData.result.partialObjectStream) {
        yield partial
      }
    } finally {
      releaseSlot()
      log('info', 'Concurrency slot released for streaming')
    }
  })

// ==========================================
// AUTHENTICATED GENERATION WITH PERSISTENCE
// ==========================================

/**
 * Response type for authenticated generation
 */
export interface GenerateAndSaveResponse {
  success: boolean
  thematic?: {
    id: string
    name: string
    description: string | null
    color: string | null
    icon: string | null
    pdfName: string | null
  }
  flashcards?: Array<{
    id: string
    front: { question: string; imageDescription?: string }
    back: { answer: string; details?: string; imageDescription?: string }
    category: string | null
    difficulty: string
  }>
  metadata?: {
    subject: string
    totalConcepts: number
    recommendations?: string
  }
  pageImages?: Array<{
    pageIndex: number
    base64: string
    mimeType: string
  }>
  error?: APIError
}

/**
 * Server function to generate flashcards from a PDF and save to database
 *
 * This authenticated version:
 * 1. Extracts and validates the PDF from FormData
 * 2. Converts PDF pages to images
 * 3. Extracts thematic information using AI
 * 4. Creates thematic in database
 * 5. Generates flashcards using Gemini
 * 6. Saves flashcards to database
 * 7. Returns persisted data with IDs
 *
 * @requires Authentication via authMiddleware
 */
export const generateAndSaveFlashcards = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: FormData) => {
    if (!(data instanceof FormData)) {
      throw new Error('Expected FormData')
    }

    const file = data.get('pdf')

    if (!file || !(file instanceof File)) {
      throw new Error('No PDF file provided')
    }

    if (file.type !== 'application/pdf') {
      throw new Error('File must be a PDF')
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    return { file }
  })
  .handler(async ({ context, data }): Promise<GenerateAndSaveResponse> => {
    const startTime = Date.now()
    const { user } = context as AuthContext
    const userId = user.id

    // Get client IP for rate limiting
    const request = getRequest()
    const clientIP = getClientIP(request)
    log('info', `=== Starting authenticated flashcard generation for user: ${userId} ===`)

    // Check rate limit
    const rateLimitResult = checkRateLimit(clientIP)
    if (!rateLimitResult.allowed) {
      log(
        'warn',
        `Rate limit exceeded for IP: ${clientIP}. Retry after ${rateLimitResult.retryAfter}s`,
      )
      return {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: `Trop de requêtes. Veuillez réessayer dans ${rateLimitResult.retryAfter} secondes.`,
          retryAfter: rateLimitResult.retryAfter,
        },
      }
    }

    // Acquire concurrency slot
    const releaseSlot = await acquireConcurrencySlot(clientIP)
    log('info', 'Concurrency slot acquired')

    try {
      const { file } = data
      log('info', `Processing file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)

      // Step 1: Convert PDF to images
      log('info', 'Step 1/5: Converting PDF to images...')
      const pdfStart = Date.now()
      const buffer = await file.arrayBuffer()
      const images = await pdfToImages(buffer, { maxPages: MAX_PAGES })
      log('info', `Step 1/5 completed in ${Date.now() - pdfStart}ms - ${images.length} pages`)

      // Step 2: Extract thematic from first pages
      log('info', 'Step 2/5: Extracting thematic...')
      const thematicStart = Date.now()
      const thematicData = await extractThematicFromImages(images.slice(0, 2))
      log('info', `Step 2/5 completed in ${Date.now() - thematicStart}ms - "${thematicData.name}"`)

      // Step 3: Create thematic in database
      log('info', 'Step 3/5: Creating thematic in database...')
      const dbThematicStart = Date.now()
      const [insertedThematic] = await db
        .insert(thematics)
        .values({
          userId,
          name: thematicData.name,
          description: thematicData.description ?? null,
          color: thematicData.color,
          icon: thematicData.icon,
          pdfName: file.name,
        })
        .returning()
      log(
        'info',
        `Step 3/5 completed in ${Date.now() - dbThematicStart}ms - ID: ${insertedThematic.id}`,
      )

      // Step 4: Generate flashcards using Gemini
      log('info', 'Step 4/5: Generating flashcards with AI...')
      const aiStart = Date.now()
      const streamData = await streamFlashcardsFromImages(images)
      const generationResult = await awaitStreamResult(streamData)
      log(
        'info',
        `Step 4/5 completed in ${Date.now() - aiStart}ms - ${generationResult.flashcards?.length ?? 0} flashcards`,
      )

      // Step 5: Save flashcards to database
      log('info', 'Step 5/5: Saving flashcards to database...')
      const dbFlashcardsStart = Date.now()

      const flashcardsToInsert = (generationResult.flashcards ?? []).map((card) => ({
        thematicId: insertedThematic.id,
        userId,
        front: {
          question: card.front.question,
          imageDescription: card.front.imageDescription,
        },
        back: {
          answer: card.back.answer,
          details: card.back.details,
          imageDescription: card.back.imageDescription,
        },
        category: card.category ?? null,
        difficulty: card.difficulty ?? 'medium',
      }))

      const insertedFlashcards = await db.insert(flashcards).values(flashcardsToInsert).returning()
      log(
        'info',
        `Step 5/5 completed in ${Date.now() - dbFlashcardsStart}ms - ${insertedFlashcards.length} saved`,
      )

      // Prepare page images for response
      const pageImages = images.map((img, index) => ({
        pageIndex: index,
        base64: img.base64,
        mimeType: img.mimeType,
      }))

      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2)
      log('info', `=== Generation completed successfully in ${totalTime}s ===`)

      return {
        success: true,
        thematic: {
          id: insertedThematic.id,
          name: insertedThematic.name,
          description: insertedThematic.description,
          color: insertedThematic.color,
          icon: insertedThematic.icon,
          pdfName: insertedThematic.pdfName,
        },
        flashcards: insertedFlashcards.map((card) => ({
          id: card.id,
          front: card.front,
          back: card.back,
          category: card.category,
          difficulty: card.difficulty,
        })),
        metadata: generationResult.metadata,
        pageImages,
      }
    } catch (error) {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2)
      log('error', `=== Generation failed after ${totalTime}s ===`, error)
      return {
        success: false,
        error: mapErrorToAPIError(error),
      }
    } finally {
      releaseSlot()
      log('info', 'Concurrency slot released')
    }
  })
