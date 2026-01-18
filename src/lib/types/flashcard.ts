import { z } from "zod";

/**
 * Schema for the front of a flashcard
 * Now includes imagePageIndex for referencing actual PDF page images
 */
export const FlashcardFrontSchema = z.object({
  question: z.string().min(10).max(500),
  imagePageIndex: z.number().int().min(0).optional(),
  imageDescription: z.string().optional(),
});

/**
 * Schema for the back of a flashcard
 * Now includes imagePageIndex for referencing actual PDF page images
 */
export const FlashcardBackSchema = z.object({
  answer: z.string().min(5).max(1000),
  details: z.string().optional(),
  imagePageIndex: z.number().int().min(0).optional(),
  imageDescription: z.string().optional(),
});

/**
 * Schema for a single flashcard
 */
export const FlashcardSchema = z.object({
  id: z.string(),
  front: FlashcardFrontSchema,
  back: FlashcardBackSchema,
  category: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

/**
 * Schema for generation metadata
 */
export const GenerationMetadataSchema = z.object({
  subject: z.string(),
  totalConcepts: z.number(),
  recommendations: z.string().optional(),
});

/**
 * Schema for stored page images (base64)
 */
export const PageImageSchema = z.object({
  pageIndex: z.number().int().min(0),
  base64: z.string(),
  mimeType: z.literal("image/jpeg"),
});

/**
 * Validates that we have at least 3 flashcards per difficulty level
 */
const validateDifficultyDistribution = (flashcards: z.infer<typeof FlashcardSchema>[]) => {
  const counts = { easy: 0, medium: 0, hard: 0 };
  for (const card of flashcards) {
    counts[card.difficulty]++;
  }
  return counts.easy >= 3 && counts.medium >= 3 && counts.hard >= 3;
};

/**
 * Schema for the complete generation result
 * Enforces minimum 9 flashcards with at least 3 per difficulty level
 */
export const GenerationResultSchema = z.object({
  flashcards: z.array(FlashcardSchema).min(9).max(100).refine(
    validateDifficultyDistribution,
    {
      message: "Il faut au minimum 3 flashcards par niveau de difficulté (easy, medium, hard)",
    }
  ),
  metadata: GenerationMetadataSchema,
  pageImages: z.array(PageImageSchema).optional(),
});

// Type exports derived from schemas
export type FlashcardFront = z.infer<typeof FlashcardFrontSchema>;
export type FlashcardBack = z.infer<typeof FlashcardBackSchema>;
export type Flashcard = z.infer<typeof FlashcardSchema>;
export type GenerationMetadata = z.infer<typeof GenerationMetadataSchema>;
export type GenerationResult = z.infer<typeof GenerationResultSchema>;
export type PageImage = z.infer<typeof PageImageSchema>;

/**
 * Difficulty levels with display labels (French)
 */
export const DIFFICULTY_LABELS: Record<Flashcard["difficulty"], string> = {
  easy: "Facile",
  medium: "Moyen",
  hard: "Difficile",
};

/**
 * Common medical categories
 */
export const MEDICAL_CATEGORIES = [
  "Anatomy",
  "Physiology",
  "Pathology",
  "Pharmacology",
  "Microbiology",
  "Biochemistry",
  "Histology",
  "Immunology",
  "Neurology",
  "Cardiology",
  "Pulmonology",
  "Gastroenterology",
  "Nephrology",
  "Endocrinology",
  "Hematology",
  "Oncology",
  "Dermatology",
  "Orthopedics",
  "Psychiatry",
  "Pediatrics",
  "Obstetrics",
  "Gynecology",
  "Radiology",
  "Surgery",
  "Emergency Medicine",
  "Other",
] as const;

export type MedicalCategory = (typeof MEDICAL_CATEGORIES)[number];
