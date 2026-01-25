import { createServerFn } from '@tanstack/react-start'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '~/lib/db'
import { flashcards, studySessions, thematics } from '~/lib/db/schema'
import { type AuthContext, authMiddleware } from '../middleware/auth'

// ==========================================
// SCHEMAS DE VALIDATION
// ==========================================

const recordStudyResultSchema = z.object({
  flashcardId: z.string().uuid('ID de flashcard invalide'),
  isCorrect: z.boolean(),
  responseTime: z.number().positive().optional(),
})

const getRevisionCardsSchema = z.object({
  threshold: z.number().min(1).default(3),
})

// ==========================================
// TYPES EXPORTÉS
// ==========================================

export type RecordStudyResultInput = z.infer<typeof recordStudyResultSchema>
export type GetRevisionCardsInput = z.infer<typeof getRevisionCardsSchema>

export interface RevisionCard {
  id: string
  thematicId: string
  userId: string
  front: {
    question: string
    imageDescription?: string
  }
  back: {
    answer: string
    details?: string
    imageDescription?: string
  }
  category: string | null
  difficulty: string
  createdAt: Date
  updatedAt: Date
  errorCount: number
  totalSessions: number
  thematicName: string
  thematicIcon: string
}

// ==========================================
// SERVER FUNCTIONS
// ==========================================

/**
 * Enregistre le résultat d'une réponse à une flashcard
 *
 * @param flashcardId - ID de la flashcard
 * @param isCorrect - Si la réponse était correcte
 * @param responseTime - Temps de réponse en ms (optionnel)
 * @returns { success: true }
 */
export const recordStudyResult = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: RecordStudyResultInput) => recordStudyResultSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { user } = context as AuthContext

    await db.insert(studySessions).values({
      flashcardId: data.flashcardId,
      userId: user.id,
      isCorrect: data.isCorrect,
      responseTime: data.responseTime ?? null,
    })

    return { success: true }
  })

/**
 * Récupère les flashcards ayant un nombre d'erreurs >= seuil
 * Triées par nombre d'erreurs décroissant (les plus difficiles en premier)
 *
 * @param threshold - Seuil minimum d'erreurs (défaut: 3)
 * @returns Liste de RevisionCard avec infos thématique et stats erreurs
 */
export const getRevisionCards = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((data: GetRevisionCardsInput) => getRevisionCardsSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { user } = context as AuthContext
    const threshold = data.threshold

    const cards = await db
      .select({
        flashcard: flashcards,
        errorCount: sql<number>`COUNT(CASE WHEN ${studySessions.isCorrect} = false THEN 1 END)`.as('error_count'),
        totalSessions: sql<number>`COUNT(${studySessions.id})`.as('total_sessions'),
        thematicName: thematics.name,
        thematicIcon: thematics.icon,
      })
      .from(flashcards)
      .innerJoin(thematics, eq(flashcards.thematicId, thematics.id))
      .leftJoin(studySessions, eq(flashcards.id, studySessions.flashcardId))
      .where(eq(flashcards.userId, user.id))
      .groupBy(flashcards.id, thematics.name, thematics.icon)
      .having(
        sql`COUNT(CASE WHEN ${studySessions.isCorrect} = false THEN 1 END) >= ${threshold}`
      )
      .orderBy(
        sql`COUNT(CASE WHEN ${studySessions.isCorrect} = false THEN 1 END) DESC`
      )

    return cards.map((c): RevisionCard => ({
      ...c.flashcard,
      errorCount: Number(c.errorCount),
      totalSessions: Number(c.totalSessions),
      thematicName: c.thematicName,
      thematicIcon: c.thematicIcon ?? '📚',
    }))
  })
