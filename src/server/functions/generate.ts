import { createServerFn } from "@tanstack/react-start";
import { awaitStreamResult, GeminiError, streamFlashcardsFromImages } from "../../lib/gemini";
import { PDFProcessingError, pdfToImages } from "../../lib/pdf-processor";
import type { GenerationResult } from "../../lib/types/flashcard";

/**
 * Maximum file size in bytes (20MB)
 */
const MAX_FILE_SIZE = 20 * 1024 * 1024;

/**
 * Maximum pages to process
 */
const MAX_PAGES = 50;

/**
 * Logger utility for consistent server-side logging
 */
function log(level: "info" | "warn" | "error", message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const prefix = `[Server ${level.toUpperCase()}] ${timestamp}`;
  if (data !== undefined) {
    console[level](`${prefix} ${message}`, data);
  } else {
    console[level](`${prefix} ${message}`);
  }
}

/**
 * API Error codes
 */
export type APIErrorCode = "INVALID_FILE" | "FILE_TOO_LARGE" | "PROCESSING_ERROR" | "AI_ERROR" | "TIMEOUT";

/**
 * Standardized API error response
 */
export interface APIError {
  code: APIErrorCode;
  message: string;
  details?: { error: string };
}

/**
 * Generation response type
 */
export type GenerateResponse =
  | { success: true; data: GenerationResult }
  | { success: false; error: APIError };

/**
 * Maps internal errors to API error codes
 */
function mapErrorToAPIError(error: unknown): APIError {
  if (error instanceof PDFProcessingError) {
    switch (error.code) {
      case "INVALID_PDF":
      case "EMPTY_PDF":
        return {
          code: "INVALID_FILE",
          message: error.message,
          details: error.details ? { error: String(error.details) } : undefined,
        };
      case "TOO_MANY_PAGES":
        return {
          code: "INVALID_FILE",
          message: error.message,
          details: error.details ? { error: String(error.details) } : undefined,
        };
      case "CONVERSION_FAILED":
        return {
          code: "PROCESSING_ERROR",
          message: error.message,
          details: error.details ? { error: String(error.details) } : undefined,
        };
    }
  }

  if (error instanceof GeminiError) {
    if (error.code === "TIMEOUT") {
      return {
        code: "TIMEOUT",
        message: "La génération a pris trop de temps. Essayez avec un PDF plus court.",
        details: error.details ? { error: String(error.details) } : undefined,
      };
    }
    return {
      code: "AI_ERROR",
      message: error.message,
      details: error.details ? { error: String(error.details) } : undefined,
    };
  }

  if (error instanceof Error) {
    return { code: "PROCESSING_ERROR", message: error.message };
  }

  return { code: "PROCESSING_ERROR", message: "An unexpected error occurred" };
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
export const generateFlashcards = createServerFn({ method: "POST" })
  .inputValidator((data: FormData) => {
    if (!(data instanceof FormData)) {
      throw new Error("Expected FormData");
    }

    const file = data.get("pdf");

    if (!file || !(file instanceof File)) {
      throw new Error("No PDF file provided");
    }

    if (file.type !== "application/pdf") {
      throw new Error("File must be a PDF");
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    return { file };
  })
  .handler(async ({ data }): Promise<GenerateResponse> => {
    const startTime = Date.now();
    log("info", "=== Starting flashcard generation ===");

    try {
      const { file } = data;
      log("info", `Processing file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

      // Convert file to ArrayBuffer
      log("info", "Step 1/4: Converting file to ArrayBuffer...");
      const bufferStart = Date.now();
      const buffer = await file.arrayBuffer();
      log("info", `Step 1/4 completed in ${Date.now() - bufferStart}ms`);

      // Convert PDF to images
      log("info", "Step 2/4: Converting PDF to images...");
      const pdfStart = Date.now();
      const images = await pdfToImages(buffer, { maxPages: MAX_PAGES });
      log("info", `Step 2/4 completed in ${Date.now() - pdfStart}ms - ${images.length} pages converted`);

      // Generate flashcards using Gemini
      log("info", "Step 3/4: Calling Gemini AI for flashcard generation...");
      const aiStart = Date.now();
      const streamData = await streamFlashcardsFromImages(images);

      // Wait for the complete result with timeout handling
      log("info", "Step 3/4: Waiting for AI response...");
      const result = await awaitStreamResult(streamData);
      log("info", `Step 3/4 completed in ${Date.now() - aiStart}ms - ${result.flashcards?.length ?? 0} flashcards generated`);

      // Attach page images for flashcards that reference them
      log("info", "Step 4/4: Attaching page images...");
      const pageImages = images.map((img, index) => ({
        pageIndex: index,
        base64: img.base64,
        mimeType: img.mimeType,
      }));

      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      log("info", `=== Generation completed successfully in ${totalTime}s ===`);

      return {
        success: true,
        data: {
          ...result,
          pageImages,
        },
      };
    } catch (error) {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
      log("error", `=== Generation failed after ${totalTime}s ===`, error);
      return {
        success: false,
        error: mapErrorToAPIError(error),
      };
    }
  });

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
export const generateFlashcardsStreaming = createServerFn({ method: "POST" })
  .inputValidator((data: FormData) => {
    if (!(data instanceof FormData)) {
      throw new Error("Expected FormData");
    }

    const file = data.get("pdf");

    if (!file || !(file instanceof File)) {
      throw new Error("No PDF file provided");
    }

    if (file.type !== "application/pdf") {
      throw new Error("File must be a PDF");
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    return { file };
  })
  .handler(async function* ({ data }) {
    const { file } = data;

    // Convert file to ArrayBuffer
    const buffer = await file.arrayBuffer();

    // Convert PDF to images
    const images = await pdfToImages(buffer, { maxPages: MAX_PAGES });

    // Stream flashcard generation
    const streamData = await streamFlashcardsFromImages(images);

    // Yield partial results as they come in
    for await (const partial of streamData.result.partialObjectStream) {
      yield partial;
    }
  });
