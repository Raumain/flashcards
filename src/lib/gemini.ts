import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObject, streamObject } from 'ai'
import { FLASHCARD_SYSTEM_PROMPT } from './prompts/flashcard-generator'
import { type GenerationResult, GenerationResultSchema } from './types/flashcard'

/**
 * Configuration for Gemini API
 */
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

/**
 * The model to use for flashcard generation
 * gemini-2.0-flash is optimized for speed with vision capabilities
 */
const model = google('gemini-2.0-flash')

/**
 * Timeout for AI generation (3 minutes)
 */
const GENERATION_TIMEOUT_MS = 180_000

/**
 * Maximum total payload size for images (50MB)
 * Prevents memory exhaustion and request timeout
 */
const MAX_PAYLOAD_SIZE_BYTES = 50 * 1024 * 1024

/**
 * Logger utility for consistent formatting
 */
function log(level: 'info' | 'warn' | 'error', message: string, data?: unknown) {
  const timestamp = new Date().toISOString()
  const prefix = `[Gemini ${level.toUpperCase()}] ${timestamp}`
  if (data !== undefined) {
    console[level](`${prefix} ${message}`, data)
  } else {
    console[level](`${prefix} ${message}`)
  }
}

/**
 * Error class for Gemini API errors
 */
export class GeminiError extends Error {
  constructor(
    public code:
      | 'API_KEY_MISSING'
      | 'RATE_LIMITED'
      | 'CONTENT_FILTERED'
      | 'GENERATION_FAILED'
      | 'TIMEOUT'
      | 'PAYLOAD_TOO_LARGE',
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'GeminiError'
  }
}

/**
 * Validates total payload size of images before sending to API
 * @throws GeminiError if total size exceeds MAX_PAYLOAD_SIZE_BYTES
 */
function validatePayloadSize(images: { base64: string; mimeType: 'image/jpeg' }[]): void {
  const totalBytes = images.reduce((sum, img) => sum + img.base64.length, 0)
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2)

  log('info', `Total payload size: ${totalMB}MB (${images.length} images)`)

  if (totalBytes > MAX_PAYLOAD_SIZE_BYTES) {
    const maxMB = MAX_PAYLOAD_SIZE_BYTES / (1024 * 1024)
    log('error', `Payload size ${totalMB}MB exceeds limit of ${maxMB}MB`)
    throw new GeminiError(
      'PAYLOAD_TOO_LARGE',
      `La taille totale des images (${totalMB}Mo) dépasse la limite de ${maxMB}Mo. Essayez avec un PDF plus court ou de moindre qualité.`,
      { totalBytes, maxBytes: MAX_PAYLOAD_SIZE_BYTES, imageCount: images.length },
    )
  }
}

/**
 * Builds the message content array for Gemini
 * Uses Vercel AI SDK's expected content format
 */
function buildMessageContent(images: { base64: string; mimeType: 'image/jpeg' }[]) {
  const content: Array<
    { type: 'text'; text: string } | { type: 'image'; image: string; mimeType: 'image/jpeg' }
  > = []

  // Add instruction text
  content.push({
    type: 'text',
    text: 'Analyse ces pages PDF et génère des flashcards. Retourne UNIQUEMENT du JSON valide.',
  })

  // Add each image
  for (const img of images) {
    content.push({
      type: 'image',
      image: img.base64,
      mimeType: img.mimeType,
    })
  }

  log('info', `Built message content with ${images.length} images`)
  return content
}

/**
 * Generates flashcards from PDF page images (non-streaming)
 *
 * @param images - Array of base64-encoded JPEG images
 * @returns Promise resolving to validated flashcard generation result
 */
export async function generateFlashcardsFromImages(
  images: { base64: string; mimeType: 'image/jpeg' }[],
): Promise<GenerationResult> {
  const startTime = Date.now()
  log('info', `Starting flashcard generation with ${images.length} images`)

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    log('error', 'API key is missing')
    throw new GeminiError(
      'API_KEY_MISSING',
      'GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set',
    )
  }

  if (images.length === 0) {
    log('error', 'No images provided')
    throw new GeminiError('GENERATION_FAILED', 'No images provided for flashcard generation')
  }

  // Validate total payload size before API call
  validatePayloadSize(images)

  try {
    log('info', 'Calling Gemini API...')

    const result = await generateObject({
      model,
      schema: GenerationResultSchema,
      system: FLASHCARD_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildMessageContent(images),
        },
      ],
    })

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    log(
      'info',
      `Generation completed in ${duration}s - ${result.object.flashcards?.length ?? 0} flashcards`,
    )

    return result.object
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    log('error', `Generation failed after ${duration}s`, error)

    if (error instanceof Error) {
      if (error.message.includes('RATE_LIMIT')) {
        throw new GeminiError(
          'RATE_LIMITED',
          'API rate limit exceeded. Please try again later.',
          error,
        )
      }
      if (error.message.includes('SAFETY') || error.message.includes('blocked')) {
        throw new GeminiError('CONTENT_FILTERED', 'Content was filtered by safety settings.', error)
      }
    }
    throw new GeminiError('GENERATION_FAILED', 'Failed to generate flashcards', error)
  }
}

/**
 * Streams flashcard generation from PDF page images
 *
 * @param images - Array of base64-encoded JPEG images
 * @returns The stream result object from Vercel AI SDK
 */
export async function streamFlashcardsFromImages(
  images: { base64: string; mimeType: 'image/jpeg' }[],
) {
  const startTime = Date.now()
  log('info', `Starting streaming flashcard generation with ${images.length} images`)

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    log('error', 'API key is missing')
    throw new GeminiError(
      'API_KEY_MISSING',
      'GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set',
    )
  }

  if (images.length === 0) {
    log('error', 'No images provided')
    throw new GeminiError('GENERATION_FAILED', 'No images provided for flashcard generation')
  }

  // Validate total payload size before API call
  validatePayloadSize(images)

  try {
    log('info', 'Initiating streaming call to Gemini API...')

    const result = streamObject({
      model,
      schema: GenerationResultSchema,
      system: FLASHCARD_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildMessageContent(images),
        },
      ],
    })

    log('info', 'Stream initiated successfully')

    // Return the stream result directly - no timeout wrapper
    // The caller will await result.object directly
    return {
      result,
      startTime,
    }
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    log('error', `Stream setup failed after ${duration}s`, error)

    if (error instanceof Error) {
      if (error.message.includes('RATE_LIMIT')) {
        throw new GeminiError(
          'RATE_LIMITED',
          'API rate limit exceeded. Please try again later.',
          error,
        )
      }
      if (error.message.includes('SAFETY') || error.message.includes('blocked')) {
        throw new GeminiError('CONTENT_FILTERED', 'Content was filtered by safety settings.', error)
      }
    }
    throw new GeminiError('GENERATION_FAILED', 'Failed to stream flashcards', error)
  }
}

/**
 * Awaits the complete result from a stream with timeout handling
 *
 * IMPORTANT: The Vercel AI SDK requires consuming the stream to avoid backpressure issues.
 * Simply awaiting result.object without consuming partialObjectStream will hang indefinitely.
 */
export async function awaitStreamResult(streamData: {
  result: ReturnType<typeof streamObject<typeof GenerationResultSchema>>
  startTime: number
}): Promise<GenerationResult> {
  const { result, startTime } = streamData

  log('info', 'Awaiting complete object from stream...')

  // Create timeout handling
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let isTimedOut = false

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      isTimedOut = true
      reject(
        new GeminiError(
          'TIMEOUT',
          `AI generation timed out after ${GENERATION_TIMEOUT_MS / 1000}s`,
        ),
      )
    }, GENERATION_TIMEOUT_MS)
  })

  try {
    // CRITICAL FIX: Consume the stream to avoid backpressure issues
    // The Vercel AI SDK requires the stream to be consumed for result.object to resolve
    // See: https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data
    const consumeStream = async (): Promise<GenerationResult> => {
      let flashcardCount = 0

      for await (const partial of result.partialObjectStream) {
        if (isTimedOut) break
        // Log progress periodically (only when count changes)
        const currentCount = partial.flashcards?.length ?? 0
        if (currentCount > flashcardCount) {
          flashcardCount = currentCount
          log('info', `Streaming progress: ${flashcardCount} flashcards received so far`)
        }
      }

      // After consuming the stream, result.object should be immediately available
      return await result.object
    }

    const obj = await Promise.race([consumeStream(), timeoutPromise])
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    log('info', `Stream completed in ${duration}s - ${obj.flashcards?.length ?? 0} flashcards`)
    return obj
  } finally {
    // Always clear timeout to prevent memory leaks
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

/**
 * Estimates token usage for a set of images
 * Useful for cost estimation before generation
 *
 * @param imageCount - Number of images
 * @param avgSizeKB - Average image size in KB
 * @returns Estimated token count
 */
export function estimateTokenUsage(imageCount: number, avgSizeKB = 100): number {
  // Gemini uses ~258 tokens per image tile (256x256)
  // Larger images are split into multiple tiles
  const tilesPerImage = Math.ceil(avgSizeKB / 50)
  const tokensPerTile = 258

  return imageCount * tilesPerImage * tokensPerTile
}
