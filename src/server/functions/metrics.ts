import { createServerFn } from '@tanstack/react-start'
import { count, desc, eq, sql } from 'drizzle-orm'
import { db } from '~/lib/db'
import { flashcards, studySessions, thematics } from '~/lib/db/schema'
import { type AuthContext, authMiddleware } from '../middleware/auth'

// ==========================================
// TYPES EXPORTÉS
// ==========================================

export interface DashboardMetrics {
  totalFlashcards: number
  totalThematics: number
  totalSessions: number
  successRate: number
  avgResponseTime: number
  streak: number
}

export interface RecentThematic {
  id: string
  name: string
  icon: string | null
  color: string | null
  flashcardCount: number
  createdAt: Date
}

// ==========================================
// SERVER FUNCTIONS
// ==========================================

/**
 * Récupère les métriques du dashboard pour l'utilisateur connecté
 */
export const getDashboardMetrics = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { user } = context as AuthContext
    const userId = user.id

    // Compter les flashcards
    const [flashcardStats] = await db
      .select({
        totalFlashcards: count(flashcards.id),
      })
      .from(flashcards)
      .where(eq(flashcards.userId, userId))

    // Compter les thématiques
    const [thematicStats] = await db
      .select({
        totalThematics: count(thematics.id),
      })
      .from(thematics)
      .where(eq(thematics.userId, userId))

    // Statistiques des sessions d'étude
    const [sessionStats] = await db
      .select({
        totalSessions: count(studySessions.id),
        correctAnswers: sql<number>`COALESCE(SUM(CASE WHEN ${studySessions.isCorrect} = true THEN 1 ELSE 0 END), 0)`,
        avgResponseTime: sql<number>`COALESCE(ROUND(AVG(${studySessions.responseTime})), 0)`,
      })
      .from(studySessions)
      .where(eq(studySessions.userId, userId))

    // Calcul du streak (jours consécutifs d'étude)
    const streak = await calculateStreak(userId)

    // Calcul du taux de réussite
    const totalSessions = sessionStats?.totalSessions ?? 0
    const correctAnswers = sessionStats?.correctAnswers ?? 0
    const successRate = totalSessions > 0 ? Math.round((correctAnswers / totalSessions) * 100) : 0

    return {
      totalFlashcards: flashcardStats?.totalFlashcards ?? 0,
      totalThematics: thematicStats?.totalThematics ?? 0,
      totalSessions,
      successRate,
      avgResponseTime: sessionStats?.avgResponseTime ?? 0,
      streak,
    } satisfies DashboardMetrics
  })

/**
 * Récupère les thématiques récentes pour le dashboard
 */
export const getRecentThematics = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { user } = context as AuthContext
    const userId = user.id

    const result = await db
      .select({
        id: thematics.id,
        name: thematics.name,
        icon: thematics.icon,
        color: thematics.color,
        flashcardCount: count(flashcards.id),
        createdAt: thematics.createdAt,
      })
      .from(thematics)
      .leftJoin(flashcards, eq(thematics.id, flashcards.thematicId))
      .where(eq(thematics.userId, userId))
      .groupBy(thematics.id)
      .orderBy(desc(thematics.createdAt))
      .limit(5)

    return result as RecentThematic[]
  })

/**
 * Calcule le streak (jours consécutifs d'étude)
 */
async function calculateStreak(userId: string): Promise<number> {
  const sessions = await db
    .selectDistinct({
      date: sql<string>`DATE(${studySessions.studiedAt})`,
    })
    .from(studySessions)
    .where(eq(studySessions.userId, userId))
    .orderBy(desc(sql`DATE(${studySessions.studiedAt})`))

  if (sessions.length === 0) return 0

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < sessions.length; i++) {
    const sessionDate = new Date(sessions[i].date)
    sessionDate.setHours(0, 0, 0, 0)

    const expectedDate = new Date(today)
    expectedDate.setDate(expectedDate.getDate() - i)
    expectedDate.setHours(0, 0, 0, 0)

    if (sessionDate.getTime() === expectedDate.getTime()) {
      streak++
    } else if (i === 0) {
      // Si pas d'étude aujourd'hui, vérifier hier
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      if (sessionDate.getTime() === yesterday.getTime()) {
        streak++
      } else {
        break
      }
    } else {
      break
    }
  }

  return streak
}
