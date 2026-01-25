import { createServerFn } from '@tanstack/react-start'
import { and, count, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '~/lib/db'
import { flashcards, thematics } from '~/lib/db/schema'
import { type AuthContext, authMiddleware } from '../middleware/auth'

// ==========================================
// SCHEMAS DE VALIDATION
// ==========================================

const createThematicSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  description: z.string().max(500, 'La description est trop longue').optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Format de couleur invalide')
    .default('#3B82F6'),
  icon: z.string().min(1).max(10).default('📚'),
  pdfName: z.string().optional(),
})

const idSchema = z.object({
  id: z.string().uuid('ID invalide'),
})

// ==========================================
// TYPES EXPORTÉS
// ==========================================

export type CreateThematicInput = z.infer<typeof createThematicSchema>

export interface ThematicWithCount {
  id: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  pdfName: string | null
  createdAt: Date
  updatedAt: Date
  flashcardCount: number
}

// ==========================================
// SERVER FUNCTIONS
// ==========================================

/**
 * Récupère toutes les thématiques de l'utilisateur avec le nombre de flashcards
 *
 * @returns Liste des thématiques avec flashcardCount
 */
export const getThematics = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { user } = context as AuthContext

    const result = await db
      .select({
        id: thematics.id,
        name: thematics.name,
        description: thematics.description,
        color: thematics.color,
        icon: thematics.icon,
        pdfName: thematics.pdfName,
        createdAt: thematics.createdAt,
        updatedAt: thematics.updatedAt,
        flashcardCount: count(flashcards.id),
      })
      .from(thematics)
      .leftJoin(flashcards, eq(thematics.id, flashcards.thematicId))
      .where(eq(thematics.userId, user.id))
      .groupBy(thematics.id)
      .orderBy(desc(thematics.createdAt))

    return result as ThematicWithCount[]
  })

/**
 * Récupère une thématique par son ID
 *
 * @param id - ID de la thématique
 * @returns La thématique avec le nombre de flashcards ou null
 */
export const getThematic = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((data: z.infer<typeof idSchema>) => idSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { user } = context as AuthContext
    const { id } = data

    const result = await db
      .select({
        id: thematics.id,
        name: thematics.name,
        description: thematics.description,
        color: thematics.color,
        icon: thematics.icon,
        pdfName: thematics.pdfName,
        createdAt: thematics.createdAt,
        updatedAt: thematics.updatedAt,
        flashcardCount: count(flashcards.id),
      })
      .from(thematics)
      .leftJoin(flashcards, eq(thematics.id, flashcards.thematicId))
      .where(and(eq(thematics.id, id), eq(thematics.userId, user.id)))
      .groupBy(thematics.id)

    return (result[0] as ThematicWithCount) ?? null
  })

/**
 * Crée une nouvelle thématique
 *
 * @param name - Nom de la thématique
 * @param description - Description optionnelle
 * @param color - Couleur hex (défaut: #3B82F6)
 * @param icon - Emoji (défaut: 📚)
 * @param pdfName - Nom du fichier PDF source
 * @returns La thématique créée
 */
export const createThematic = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async ({ context, data: rawData }) => {
    const { user } = context as AuthContext

    // Validation
    const parseResult = createThematicSchema.safeParse(rawData)
    if (!parseResult.success) {
      throw new Error(parseResult.error.issues[0]?.message ?? 'Données invalides')
    }
    const data = parseResult.data

    const [thematic] = await db
      .insert(thematics)
      .values({
        userId: user.id,
        name: data.name,
        description: data.description ?? null,
        color: data.color,
        icon: data.icon,
        pdfName: data.pdfName ?? null,
      })
      .returning()

    return thematic
  })

/**
 * Met à jour une thématique
 *
 * @param id - ID de la thématique
 * @param name - Nouveau nom (optionnel)
 * @param description - Nouvelle description (optionnel)
 * @param color - Nouvelle couleur (optionnel)
 * @param icon - Nouvel emoji (optionnel)
 * @returns La thématique mise à jour
 */
export const updateThematic = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async ({ context, data: rawData }) => {
    const { user } = context as AuthContext

    // Validation
    const updateSchema = z.object({
      id: z.string().uuid('ID invalide'),
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
      icon: z.string().min(1).max(10).optional(),
    })

    const parseResult = updateSchema.safeParse(rawData)
    if (!parseResult.success) {
      throw new Error(parseResult.error.issues[0]?.message ?? 'Données invalides')
    }
    const { id, ...updates } = parseResult.data

    // Filtrer les champs undefined
    const updateData: Record<string, unknown> = {}
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.color !== undefined) updateData.color = updates.color
    if (updates.icon !== undefined) updateData.icon = updates.icon

    if (Object.keys(updateData).length === 0) {
      throw new Error('Aucune modification fournie')
    }

    updateData.updatedAt = new Date()

    const result = await db
      .update(thematics)
      .set(updateData)
      .where(and(eq(thematics.id, id), eq(thematics.userId, user.id)))
      .returning()

    if (result.length === 0) {
      throw new Error('Thématique non trouvée ou accès refusé')
    }

    return result[0]
  })

/**
 * Supprime une thématique et toutes ses flashcards (cascade)
 *
 * @param id - ID de la thématique à supprimer
 * @returns { success: true } si suppression réussie
 * @throws Error si thématique non trouvée ou accès refusé
 */
export const deleteThematic = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: z.infer<typeof idSchema>) => idSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { user } = context as AuthContext
    const { id } = data

    // La suppression cascade aux flashcards grâce au schéma DB
    const result = await db
      .delete(thematics)
      .where(and(eq(thematics.id, id), eq(thematics.userId, user.id)))
      .returning({ id: thematics.id })

    if (result.length === 0) {
      throw new Error('Thématique non trouvée ou accès refusé')
    }

    return { success: true }
  })
