import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '~/lib/db'
import { flashcards, thematics } from '~/lib/db/schema'
import { type AuthContext, authMiddleware } from '../middleware/auth'

// ==========================================
// SCHEMAS DE VALIDATION
// ==========================================

const flashcardInputSchema = z.object({
  front: z.object({
    question: z.string().min(1, 'La question est requise'),
    imageDescription: z.string().optional(),
  }),
  back: z.object({
    answer: z.string().min(1, 'La réponse est requise'),
    details: z.string().optional(),
    imageDescription: z.string().optional(),
  }),
  category: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
})

const saveFlashcardsInputSchema = z.object({
  thematicId: z.string().uuid('ID de thématique invalide'),
  flashcards: z.array(flashcardInputSchema).min(1, 'Au moins une flashcard est requise'),
})

const idSchema = z.object({
  id: z.string().uuid('ID invalide'),
})

// ==========================================
// TYPES EXPORTÉS
// ==========================================

export type FlashcardInput = z.infer<typeof flashcardInputSchema>
export type SaveFlashcardsInput = z.infer<typeof saveFlashcardsInputSchema>

// ==========================================
// SERVER FUNCTIONS
// ==========================================

/**
 * Sauvegarde des flashcards dans une thématique existante
 *
 * @param thematicId - ID de la thématique (doit appartenir à l'utilisateur)
 * @param flashcards - Liste des flashcards à insérer
 * @returns Les flashcards insérées avec leurs IDs générés
 * @throws Error si la thématique n'existe pas ou n'appartient pas à l'utilisateur
 */
export const saveFlashcards = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async ({ context, data: rawData }) => {
    const { user } = context as AuthContext
    const userId = user.id

    // Validation des données
    const parseResult = saveFlashcardsInputSchema.safeParse(rawData)
    if (!parseResult.success) {
      throw new Error(parseResult.error.issues[0]?.message ?? 'Données invalides')
    }
    const data = parseResult.data

    // 1. Vérifier que la thématique appartient à l'utilisateur
    const [thematic] = await db
      .select({ id: thematics.id })
      .from(thematics)
      .where(and(eq(thematics.id, data.thematicId), eq(thematics.userId, userId)))

    if (!thematic) {
      throw new Error('Thématique non trouvée ou accès refusé')
    }

    // 2. Insérer les flashcards
    const insertedCards = await db
      .insert(flashcards)
      .values(
        data.flashcards.map((card) => ({
          thematicId: data.thematicId,
          userId,
          front: card.front,
          back: card.back,
          category: card.category ?? null,
          difficulty: card.difficulty,
        })),
      )
      .returning()

    return insertedCards
  })

/**
 * Récupère une flashcard par son ID
 *
 * @param id - ID de la flashcard
 * @returns La flashcard ou null si non trouvée
 */
export const getFlashcard = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context, data: rawData }) => {
    const { user } = context as AuthContext

    // Validation
    const parseResult = idSchema.safeParse(rawData)
    if (!parseResult.success) {
      throw new Error(parseResult.error.issues[0]?.message ?? 'ID invalide')
    }
    const { id } = parseResult.data

    const [card] = await db
      .select()
      .from(flashcards)
      .where(and(eq(flashcards.id, id), eq(flashcards.userId, user.id)))

    return card ?? null
  })

/**
 * Supprime une flashcard
 *
 * @param id - ID de la flashcard à supprimer
 * @returns { success: true } si suppression réussie
 * @throws Error si flashcard non trouvée ou accès refusé
 */
export const deleteFlashcard = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: z.infer<typeof idSchema>) => idSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { user } = context as AuthContext
    const { id } = data

    const result = await db
      .delete(flashcards)
      .where(and(eq(flashcards.id, id), eq(flashcards.userId, user.id)))
      .returning({ id: flashcards.id })

    if (result.length === 0) {
      throw new Error('Flashcard non trouvée ou accès refusé')
    }

    return { success: true }
  })

const thematicIdSchema = z.object({
  thematicId: z.string().uuid('ID de thématique invalide'),
})

/**
 * Récupère toutes les flashcards d'une thématique
 *
 * @param thematicId - ID de la thématique
 * @returns Liste des flashcards ordonnées par date de création
 */
export const getFlashcardsByThematic = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((data: z.infer<typeof thematicIdSchema>) => thematicIdSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { user } = context as AuthContext

    return db
      .select()
      .from(flashcards)
      .where(and(eq(flashcards.thematicId, data.thematicId), eq(flashcards.userId, user.id)))
      .orderBy(asc(flashcards.createdAt))
  })

/**
 * Récupère les flashcards de plusieurs thématiques
 *
 * @param thematicIds - Liste des IDs de thématiques
 * @returns Liste des flashcards des thématiques spécifiées
 */
const thematicIdsSchema = z.object({
  thematicIds: z
    .array(z.string().uuid('ID de thématique invalide'))
    .min(1, 'Au moins une thématique requise'),
})

export const getFlashcardsByThematics = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((data: z.infer<typeof thematicIdsSchema>) => thematicIdsSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { user } = context as AuthContext
    const { thematicIds } = data

    return db
      .select()
      .from(flashcards)
      .where(and(inArray(flashcards.thematicId, thematicIds), eq(flashcards.userId, user.id)))
      .orderBy(asc(flashcards.createdAt))
  })

/**
 * Récupère toutes les flashcards de l'utilisateur
 *
 * @returns Liste de toutes les flashcards de l'utilisateur
 */
export const getAllFlashcards = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { user } = context as AuthContext

    return db
      .select()
      .from(flashcards)
      .where(eq(flashcards.userId, user.id))
      .orderBy(asc(flashcards.createdAt))
  })
