# ⚙️ Agent Backend

## Identité
Tu es l'**Agent Backend** pour MedFlash V2. Tu gères la logique serveur, les server functions, le traitement de fichiers, l'intégration IA et la persistance des données.

## Activation
Invoque cet agent pour :
- Créer des server functions
- Traiter des fichiers PDF
- Intégrer l'API Gemini
- Générer des PDFs
- Gérer les opérations CRUD sur les flashcards/thématiques

## Fichiers de Contexte (Charger en premier)
1. `.github/project/blueprint-v2.md` - Architecture V2
2. `.github/project/roadmap-v2.md` - Feuille de route
3. `src/lib/` - Utilitaires existants
4. `src/server/` - Code serveur existant
5. `src/lib/db/schema.ts` - Schéma base de données

## Stack Technique
- **Runtime**: Bun
- **Framework**: TanStack Start (server functions)
- **IA**: Vercel AI SDK + @ai-sdk/google
- **PDF Processing**: pdf-lib, pdf2pic, sharp
- **PDF Generation**: jsPDF
- **Base de données**: PostgreSQL + Drizzle ORM
- **Validation**: Zod

---

## Tâches Assignées V2

### Tâche 3.1: Server function saveFlashcards
**Fichier**: `src/server/functions/flashcards.ts`

```typescript
import { createServerFn } from '@tanstack/start'
import { db } from '@/lib/db'
import { flashcards, thematics } from '@/lib/db/schema'
import { authMiddleware } from '../middleware/auth'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'

const flashcardSchema = z.object({
  front: z.object({
    question: z.string(),
    imageDescription: z.string().optional(),
  }),
  back: z.object({
    answer: z.string(),
    details: z.string().optional(),
    imageDescription: z.string().optional(),
  }),
  category: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
})

const saveFlashcardsSchema = z.object({
  thematicId: z.string().uuid(),
  flashcards: z.array(flashcardSchema),
})

export const saveFlashcards = createServerFn('POST')
  .middleware([authMiddleware])
  .validator(saveFlashcardsSchema)
  .handler(async ({ context, data }) => {
    const userId = context.user.id

    // Vérifier que la thématique appartient à l'utilisateur
    const [thematic] = await db
      .select()
      .from(thematics)
      .where(and(
        eq(thematics.id, data.thematicId),
        eq(thematics.userId, userId)
      ))

    if (!thematic) {
      throw new Error('Thématique non trouvée')
    }

    // Insérer les flashcards
    const insertedCards = await db
      .insert(flashcards)
      .values(
        data.flashcards.map((card) => ({
          thematicId: data.thematicId,
          userId,
          front: card.front,
          back: card.back,
          category: card.category,
          difficulty: card.difficulty,
        }))
      )
      .returning()

    return insertedCards
  })
```

### Tâche 3.2: Extraction thématique par IA
**Fichier**: `src/lib/prompts/thematic-extractor.ts`

```typescript
export const THEMATIC_EXTRACTION_PROMPT = `
Tu es un expert en éducation médicale. Analyse le contenu de ce PDF et extrait la thématique principale.

## Ta tâche
1. Identifie le sujet principal du document
2. Génère un nom court et descriptif (max 50 caractères)
3. Génère une description (max 200 caractères)
4. Suggère une couleur et un emoji appropriés

## Format de sortie (JSON uniquement)
{
  "name": "Nom de la thématique",
  "description": "Description courte du contenu",
  "color": "#HEX_COLOR",
  "icon": "emoji"
}

## Exemples de couleurs par domaine
- Anatomie: #EF4444 (rouge)
- Physiologie: #3B82F6 (bleu)
- Pharmacologie: #10B981 (vert)
- Pathologie: #8B5CF6 (violet)
- Biochimie: #F59E0B (orange)
- Microbiologie: #EC4899 (rose)
- Cardiologie: #DC2626 (rouge foncé)
- Neurologie: #6366F1 (indigo)

Retourne UNIQUEMENT le JSON, sans texte supplémentaire.
`
```

**Fichier**: `src/server/functions/thematics.ts`

```typescript
import { createServerFn } from '@tanstack/start'
import { db } from '@/lib/db'
import { thematics, flashcards } from '@/lib/db/schema'
import { authMiddleware } from '../middleware/auth'
import { z } from 'zod'
import { eq, and, count } from 'drizzle-orm'

export const getThematics = createServerFn('GET')
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const userId = context.user.id

    const result = await db
      .select({
        id: thematics.id,
        name: thematics.name,
        description: thematics.description,
        color: thematics.color,
        icon: thematics.icon,
        pdfName: thematics.pdfName,
        createdAt: thematics.createdAt,
        flashcardCount: count(flashcards.id),
      })
      .from(thematics)
      .leftJoin(flashcards, eq(thematics.id, flashcards.thematicId))
      .where(eq(thematics.userId, userId))
      .groupBy(thematics.id)
      .orderBy(thematics.createdAt)

    return result
  })

const createThematicSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
  icon: z.string().default('📚'),
  pdfName: z.string().optional(),
})

export const createThematic = createServerFn('POST')
  .middleware([authMiddleware])
  .validator(createThematicSchema)
  .handler(async ({ context, data }) => {
    const userId = context.user.id

    const [thematic] = await db
      .insert(thematics)
      .values({
        userId,
        name: data.name,
        description: data.description,
        color: data.color,
        icon: data.icon,
        pdfName: data.pdfName,
      })
      .returning()

    return thematic
  })

export const deleteThematic = createServerFn('POST')
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ context, data }) => {
    const userId = context.user.id

    // La suppression cascade aux flashcards grâce au schéma
    await db
      .delete(thematics)
      .where(and(
        eq(thematics.id, data.id),
        eq(thematics.userId, userId)
      ))

    return { success: true }
  })
```

### Tâche 3.4: Server function getFlashcardsByThematic
**Fichier**: `src/server/functions/flashcards.ts` (ajout)

```typescript
export const getFlashcardsByThematic = createServerFn('GET')
  .middleware([authMiddleware])
  .validator(z.object({ thematicId: z.string().uuid() }))
  .handler(async ({ context, data }) => {
    const userId = context.user.id

    return db
      .select()
      .from(flashcards)
      .where(and(
        eq(flashcards.thematicId, data.thematicId),
        eq(flashcards.userId, userId)
      ))
      .orderBy(flashcards.createdAt)
  })

export const getFlashcardsByThematics = createServerFn('GET')
  .middleware([authMiddleware])
  .validator(z.object({ thematicIds: z.array(z.string().uuid()) }))
  .handler(async ({ context, data }) => {
    const userId = context.user.id

    return db
      .select()
      .from(flashcards)
      .where(and(
        inArray(flashcards.thematicId, data.thematicIds),
        eq(flashcards.userId, userId)
      ))
  })
```

### Tâche 3.5: Modification génération pour sauvegarder
**Fichier**: `src/server/functions/generate.ts` (mise à jour)

```typescript
import { createServerFn } from '@tanstack/start'
import { streamText } from 'ai'
import { google } from '@ai-sdk/google'
import { pdfToImages } from '@/lib/pdf-processor'
import { FLASHCARD_SYSTEM_PROMPT } from '@/lib/prompts/flashcard-generator'
import { THEMATIC_EXTRACTION_PROMPT } from '@/lib/prompts/thematic-extractor'
import { authMiddleware } from '../middleware/auth'
import { db } from '@/lib/db'
import { thematics, flashcards } from '@/lib/db/schema'
import { z } from 'zod'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

export const generateFlashcards = createServerFn('POST')
  .middleware([authMiddleware])
  .handler(async ({ context, request }) => {
    const userId = context.user.id
    const formData = await request.formData()
    const file = formData.get('pdf') as File | null

    if (!file) {
      throw new Error('Aucun fichier fourni')
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Fichier trop volumineux (max 20MB)')
    }

    if (file.type !== 'application/pdf') {
      throw new Error('Le fichier doit être un PDF')
    }

    // Convertir PDF en images
    const arrayBuffer = await file.arrayBuffer()
    const images = await pdfToImages(arrayBuffer)

    // Extraire la thématique
    const thematicResponse = await generateText({
      model: google('gemini-2.0-flash'),
      messages: [
        { role: 'system', content: THEMATIC_EXTRACTION_PROMPT },
        {
          role: 'user',
          content: images.slice(0, 2).map((img) => ({
            type: 'image' as const,
            image: img,
          })),
        },
      ],
    })

    const thematicData = JSON.parse(thematicResponse.text)

    // Créer la thématique
    const [thematic] = await db
      .insert(thematics)
      .values({
        userId,
        name: thematicData.name,
        description: thematicData.description,
        color: thematicData.color,
        icon: thematicData.icon,
        pdfName: file.name,
      })
      .returning()

    // Générer les flashcards (streaming)
    const result = await streamText({
      model: google('gemini-2.0-flash'),
      messages: [
        { role: 'system', content: FLASHCARD_SYSTEM_PROMPT },
        {
          role: 'user',
          content: images.map((img) => ({
            type: 'image' as const,
            image: img,
          })),
        },
      ],
    })

    // Parser et sauvegarder les flashcards
    const fullText = await result.text
    const parsed = JSON.parse(fullText)

    const insertedCards = await db
      .insert(flashcards)
      .values(
        parsed.flashcards.map((card: any) => ({
          thematicId: thematic.id,
          userId,
          front: card.front,
          back: card.back,
          category: card.category,
          difficulty: card.difficulty,
        }))
      )
      .returning()

    return {
      thematic,
      flashcards: insertedCards,
      metadata: parsed.metadata,
    }
  })
```

### Tâche 3.6: Server function deleteFlashcard
**Fichier**: `src/server/functions/flashcards.ts` (ajout)

```typescript
export const deleteFlashcard = createServerFn('POST')
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ context, data }) => {
    const userId = context.user.id

    await db
      .delete(flashcards)
      .where(and(
        eq(flashcards.id, data.id),
        eq(flashcards.userId, userId)
      ))

    return { success: true }
  })
```

---

## Gestion des Erreurs

```typescript
// Types d'erreurs API
type APIErrorCode = 
  | 'INVALID_FILE'
  | 'FILE_TOO_LARGE'
  | 'PROCESSING_ERROR'
  | 'AI_ERROR'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'

interface APIError {
  code: APIErrorCode
  message: string
  details?: unknown
}

// Messages d'erreur en français
const ERROR_MESSAGES: Record<APIErrorCode, string> = {
  INVALID_FILE: 'Le fichier n\'est pas un PDF valide',
  FILE_TOO_LARGE: 'Le fichier dépasse la limite de 20 Mo',
  PROCESSING_ERROR: 'Erreur lors du traitement du PDF',
  AI_ERROR: 'Erreur lors de la génération par l\'IA',
  UNAUTHORIZED: 'Vous devez être connecté pour effectuer cette action',
  NOT_FOUND: 'Ressource non trouvée',
  VALIDATION_ERROR: 'Données invalides',
}
```

---

## Tests Recommandés

- [ ] Génération avec utilisateur authentifié
- [ ] Rejet si non authentifié
- [ ] Création thématique automatique
- [ ] Sauvegarde flashcards en base
- [ ] Suppression cascade thématique → flashcards
- [ ] Validation des types de fichiers
- [ ] Limite de taille respectée

---

## Format de Sortie

Après chaque tâche, ajouter à `progress.txt`:

```
[BACKEND-AGENT] [YYYY-MM-DD HH:mm]
Tâche: <description>
Statut: ✅ Terminé | 🟡 Partiel | ❌ Échoué
Fichiers créés/modifiés:
  - <chemin fichier>
Notes: <notes pertinentes>
---
```
