import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

/**
 * Configuration for PDF to image conversion
 */
interface ConversionOptions {
  /** DPI for rendering (default: 150) */
  density?: number;
  /** Max width in pixels (default: 1024) */
  maxWidth?: number;
  /** JPEG quality 1-100 (default: 80) */
  quality?: number;
  /** Max pages to process (default: 50) */
  maxPages?: number;
}

const DEFAULT_OPTIONS: Required<ConversionOptions> = {
  density: 150,
  maxWidth: 1024,
  quality: 80,
  maxPages: 50,
};

/**
 * Result of PDF page conversion
 */
interface PageImage {
  page: number;
  base64: string;
  mimeType: "image/jpeg";
}

/**
 * Errors specific to PDF processing
 */
export class PDFProcessingError extends Error {
  constructor(
    public code:
      | "INVALID_PDF"
      | "EMPTY_PDF"
      | "TOO_MANY_PAGES"
      | "CONVERSION_FAILED"
      | "MISSING_DEPENDENCY",
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "PDFProcessingError";
  }
}

/**
 * Checks if pdftoppm is available on the system
 */
let pdftoppmChecked = false;
let pdftoppmAvailable = false;

function checkPdftoppmAvailability(): void {
  if (pdftoppmChecked) {
    if (!pdftoppmAvailable) {
      throw new PDFProcessingError(
        "MISSING_DEPENDENCY",
        "pdftoppm (poppler-utils) is required but not installed. Please install poppler-utils: https://poppler.freedesktop.org/",
      );
    }
    return;
  }

  pdftoppmChecked = true;

  try {
    const result = spawnSync("pdftoppm", ["-v"], { encoding: "utf-8" });
    pdftoppmAvailable = result.status === 0 || result.stderr?.includes("pdftoppm");
  } catch {
    pdftoppmAvailable = false;
  }

  if (!pdftoppmAvailable) {
    throw new PDFProcessingError(
      "MISSING_DEPENDENCY",
      "pdftoppm (poppler-utils) is required but not installed. Please install poppler-utils: https://poppler.freedesktop.org/",
    );
  }
}

/**
 * Validates PDF buffer before processing
 */
function validatePDF(buffer: ArrayBuffer): void {
  if (!buffer || buffer.byteLength === 0) {
    throw new PDFProcessingError("INVALID_PDF", "PDF buffer is empty");
  }

  // Check PDF magic bytes (%PDF-)
  const header = new Uint8Array(buffer.slice(0, 5));
  const pdfMagic = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-

  const isValidPDF = pdfMagic.every((byte, i) => header[i] === byte);
  if (!isValidPDF) {
    throw new PDFProcessingError(
      "INVALID_PDF",
      "File does not appear to be a valid PDF",
    );
  }
}

/**
 * Executes pdftoppm to convert PDF to PNG images
 * Uses poppler-utils which is more reliable than GraphicsMagick
 */
async function runPdftoppm(
  pdfPath: string,
  outputPrefix: string,
  options: Required<ConversionOptions>,
): Promise<string[]> {
  // Check if pdftoppm is available before attempting to run
  checkPdftoppmAvailability();

  return new Promise((resolve, reject) => {
    const args = [
      "-png",
      "-r", String(options.density),
      "-l", String(options.maxPages), // last page
      pdfPath,
      outputPrefix,
    ];

    const proc = spawn("pdftoppm", args);
    let stderr = "";

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", async (code) => {
      if (code !== 0) {
        reject(new PDFProcessingError("CONVERSION_FAILED", `pdftoppm failed: ${stderr}`));
        return;
      }

      // Find generated files (pdftoppm names them prefix-1.png, prefix-2.png, etc.)
      const dir = outputPrefix.substring(0, outputPrefix.lastIndexOf("/"));
      const prefix = outputPrefix.substring(outputPrefix.lastIndexOf("/") + 1);

      try {
        const files = await readdir(dir);
        const pngFiles = files
          .filter((f) => f.startsWith(prefix) && f.endsWith(".png"))
          .sort((a, b) => {
            // Sort by page number
            const numA = Number.parseInt(a.match(/-(\d+)\.png$/)?.[1] || "0", 10);
            const numB = Number.parseInt(b.match(/-(\d+)\.png$/)?.[1] || "0", 10);
            return numA - numB;
          })
          .map((f) => join(dir, f));

        resolve(pngFiles);
      } catch (err) {
        reject(new PDFProcessingError("CONVERSION_FAILED", "Failed to read output files", err));
      }
    });

    proc.on("error", (err) => {
      reject(new PDFProcessingError("CONVERSION_FAILED", `Failed to spawn pdftoppm: ${err.message}`));
    });
  });
}

/**
 * Converts a PNG buffer to optimized JPEG base64
 */
async function convertToOptimizedJpeg(
  pngPath: string,
  options: Required<ConversionOptions>,
): Promise<string> {
  const pngBuffer = await readFile(pngPath);

  const optimized = await sharp(pngBuffer)
    .resize({
      width: options.maxWidth,
      withoutEnlargement: true,
      fit: "inside",
    })
    .jpeg({
      quality: options.quality,
      mozjpeg: true,
    })
    .toBuffer();

  return optimized.toString("base64");
}

/**
 * Converts PDF pages to base64-encoded JPEG images
 * Uses pdftoppm (poppler-utils) for reliable PDF rendering
 *
 * @param pdfBuffer - Raw PDF file as ArrayBuffer
 * @param options - Conversion options
 * @returns Array of base64 encoded images with metadata
 */
export async function pdfToImages(
  pdfBuffer: ArrayBuffer,
  options: ConversionOptions = {},
): Promise<PageImage[]> {
  const startTime = Date.now();
  console.log(`[pdf-processor] Starting PDF to images conversion...`);

  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Validate input
  validatePDF(pdfBuffer);
  console.log(`[pdf-processor] PDF validation passed, size: ${(pdfBuffer.byteLength / 1024 / 1024).toFixed(2)}MB`);

  // Create temp directory for this conversion
  const sessionId = randomUUID();
  const tempDir = join(tmpdir(), `medflash-${sessionId}`);
  await mkdir(tempDir, { recursive: true });

  const pdfPath = join(tempDir, "input.pdf");
  const outputPrefix = join(tempDir, "page");

  try {
    // Write PDF to temp file
    console.log(`[pdf-processor] Writing PDF to temp file...`);
    await writeFile(pdfPath, Buffer.from(pdfBuffer));

    // Convert PDF to PNG using pdftoppm
    console.log(`[pdf-processor] Running pdftoppm conversion...`);
    const pdftoppmStart = Date.now();
    const pngFiles = await runPdftoppm(pdfPath, outputPrefix, opts);
    console.log(`[pdf-processor] pdftoppm completed in ${Date.now() - pdftoppmStart}ms - ${pngFiles.length} pages`);

    if (pngFiles.length === 0) {
      throw new PDFProcessingError("EMPTY_PDF", "PDF contains no pages");
    }

    // Process pages in batches to avoid memory issues with large PDFs
    // Each batch processes up to 5 pages concurrently
    const BATCH_SIZE = 5;
    const pages: PageImage[] = [];

    console.log(`[pdf-processor] Converting ${pngFiles.length} PNG files to optimized JPEG...`);

    for (let i = 0; i < pngFiles.length; i += BATCH_SIZE) {
      const batch = pngFiles.slice(i, i + BATCH_SIZE);
      console.log(`[pdf-processor] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(pngFiles.length / BATCH_SIZE)}`);

      const batchResults = await Promise.all(
        batch.map(async (pngPath, batchIndex) => {
          const base64 = await convertToOptimizedJpeg(pngPath, opts);
          // Clean up the PNG file immediately after conversion to free disk space
          try {
            await unlink(pngPath);
          } catch {
            // Ignore deletion errors, will be cleaned up in finally block
          }
          return {
            page: i + batchIndex + 1,
            base64,
            mimeType: "image/jpeg" as const,
          };
        }),
      );
      pages.push(...batchResults);
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[pdf-processor] Conversion completed in ${totalTime}s - ${pages.length} images`);

    return pages;
  } finally {
    // Cleanup temp files
    try {
      const files = await readdir(tempDir);
      await Promise.all(files.map((f) => unlink(join(tempDir, f))));
      await rm(tempDir, { recursive: true });
    } catch (cleanupError) {
      // Log cleanup errors but don't throw - they shouldn't break the main operation
      console.warn(`[pdf-processor] Failed to cleanup temp directory ${tempDir}:`, cleanupError);
    }
  }
}

/**
 * Get page count from PDF without full conversion
 * Uses pdf-lib for quick page count
 */
export async function getPDFPageCount(pdfBuffer: ArrayBuffer): Promise<number> {
  validatePDF(pdfBuffer);

  const { PDFDocument } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.load(pdfBuffer, {
    ignoreEncryption: true,
  });

  return pdfDoc.getPageCount();
}

/**
 * Validates file before processing
 */
export function validatePDFFile(
  file: File,
  maxSizeMB = 20,
): { valid: true } | { valid: false; error: string } {
  // Check file type
  if (file.type !== "application/pdf") {
    return { valid: false, error: "File must be a PDF" };
  }

  // Check file size
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }

  return { valid: true };
}
