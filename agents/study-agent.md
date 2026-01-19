# 📖 Agent Étude & Révision

## Identité
Tu es l'**Agent Étude & Révision** pour MedFlash V2. Tu crées les fonctionnalités d'apprentissage interactif : mode étude avec swipe, mode révision intelligent, et suivi des sessions.

## Activation
Invoque cet agent pour :
- Créer le mode étude (sélection thématiques, swipe)
- Créer le mode révision (sélection automatique erreurs)
- Implémenter les animations de swipe
- Gérer les sessions d'étude
- Enregistrer les résultats

## Fichiers de Contexte (Charger en premier)
1. `.github/project/blueprint-v2.md` - Architecture V2
2. `.github/project/roadmap-v2.md` - Feuille de route
3. `src/lib/db/schema.ts` - Schéma base de données
4. `src/components/study/` - Composants existants

## Stack Technique
- **Animations**: Framer Motion
- **Gestures**: Framer Motion (drag)
- **État serveur**: TanStack Query
- **Styling**: Tailwind CSS v4

---

## Installation Framer Motion
```bash
bun add framer-motion
```

---

## Tâches Assignées

### Tâche 5.1: Route /study sélection thématiques
**Fichier**: `src/routes/study/index.tsx`

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { TopicSelector } from '@/components/study/TopicSelector'
import { getThematics } from '@/server/functions/thematics'

export const Route = createFileRoute('/study/')({
  component: StudyPage,
})

function StudyPage() {
  const { data: thematics, isLoading } = useQuery({
    queryKey: ['thematics'],
    queryFn: () => getThematics(),
  })

  if (isLoading) {
    return <div className="animate-pulse">Chargement...</div>
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Mode Étude
      </h1>
      <p className="text-gray-600 mb-8">
        Sélectionnez les thématiques que vous souhaitez réviser
      </p>

      <TopicSelector thematics={thematics ?? []} />
    </div>
  )
}
```

### Tâche 5.2: Composant TopicSelector
**Fichier**: `src/components/study/TopicSelector.tsx`

```tsx
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { Thematic } from '@/lib/db/schema'

interface TopicSelectorProps {
  thematics: Thematic[]
}

export function TopicSelector({ thematics }: TopicSelectorProps) {
  const [selected, setSelected] = useState<string[]>([])
  const navigate = useNavigate()

  const toggleThematic = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((t) => t !== id)
        : [...prev, id]
    )
  }

  const selectAll = () => {
    setSelected(thematics.map((t) => t.id))
  }

  const deselectAll = () => {
    setSelected([])
  }

  const startStudy = () => {
    if (selected.length === 0) return
    
    // Stocker les thématiques sélectionnées dans l'URL ou le state
    navigate({
      to: '/study/session',
      search: { thematics: selected.join(',') },
    })
  }

  return (
    <div>
      {/* Actions rapides */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={selectAll}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Tout sélectionner
        </button>
        <span className="text-gray-300">|</span>
        <button
          type="button"
          onClick={deselectAll}
          className="text-sm text-gray-600 hover:text-gray-700"
        >
          Tout désélectionner
        </button>
      </div>

      {/* Grille de thématiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {thematics.map((thematic) => (
          <button
            key={thematic.id}
            type="button"
            onClick={() => toggleThematic(thematic.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              selected.includes(thematic.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{thematic.icon}</span>
              <div>
                <h3 className="font-medium text-gray-900">{thematic.name}</h3>
                <p className="text-sm text-gray-500">
                  {thematic.flashcardCount} flashcards
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Bouton démarrer */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={startStudy}
          disabled={selected.length === 0}
          className="px-8 py-3 bg-blue-600 text-white font-medium rounded-xl
                     hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                     transition-colors"
        >
          {selected.length === 0
            ? 'Sélectionnez au moins une thématique'
            : `Commencer avec ${selected.length} thématique${selected.length > 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}
```

### Tâche 5.3: Composant SwipeableCard (Framer Motion)
**Fichier**: `src/components/study/SwipeableCard.tsx`

```tsx
import { useState } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import type { Flashcard } from '@/lib/db/schema'

interface SwipeableCardProps {
  flashcard: Flashcard
  onSwipe: (direction: 'left' | 'right') => void
}

export function SwipeableCard({ flashcard, onSwipe }: SwipeableCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null)

  const x = useMotionValue(0)
  
  // Opacité des indicateurs en fonction du drag
  const rightIndicatorOpacity = useTransform(x, [0, 100], [0, 1])
  const leftIndicatorOpacity = useTransform(x, [-100, 0], [1, 0])
  
  // Rotation de la carte pendant le drag
  const rotate = useTransform(x, [-200, 200], [-15, 15])

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100

    if (info.offset.x > threshold) {
      setExitDirection('right')
      onSwipe('right')
    } else if (info.offset.x < -threshold) {
      setExitDirection('left')
      onSwipe('left')
    }
  }

  const flipCard = () => {
    setIsFlipped(!isFlipped)
  }

  return (
    <div className="relative w-full max-w-md mx-auto h-96">
      {/* Indicateur gauche (incorrect) */}
      <motion.div
        style={{ opacity: leftIndicatorOpacity }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10
                   w-16 h-16 flex items-center justify-center
                   rounded-full bg-red-500 text-white text-2xl"
      >
        ✗
      </motion.div>

      {/* Indicateur droite (correct) */}
      <motion.div
        style={{ opacity: rightIndicatorOpacity }}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10
                   w-16 h-16 flex items-center justify-center
                   rounded-full bg-green-500 text-white text-2xl"
      >
        ✓
      </motion.div>

      {/* Carte */}
      <motion.div
        style={{ x, rotate }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        animate={exitDirection ? {
          x: exitDirection === 'right' ? 500 : -500,
          opacity: 0,
          transition: { duration: 0.3 }
        } : {}}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
      >
        <div
          className="w-full h-full perspective-1000"
          onClick={flipCard}
        >
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.4 }}
            className="relative w-full h-full preserve-3d"
          >
            {/* Face avant (Question) */}
            <div className="absolute inset-0 backface-hidden">
              <div className="w-full h-full bg-white rounded-2xl shadow-lg border border-gray-200 p-6
                            flex flex-col">
                <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                  Question
                </span>
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xl text-gray-900 text-center">
                    {flashcard.front.question}
                  </p>
                </div>
                <p className="text-center text-sm text-gray-400">
                  Cliquez pour voir la réponse
                </p>
              </div>
            </div>

            {/* Face arrière (Réponse) */}
            <div className="absolute inset-0 backface-hidden rotate-y-180">
              <div className="w-full h-full bg-linear-to-br from-blue-50 to-white 
                            rounded-2xl shadow-lg border border-blue-200 p-6
                            flex flex-col">
                <span className="text-xs font-medium text-green-600 uppercase tracking-wide">
                  Réponse
                </span>
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <p className="text-xl text-gray-900 text-center font-medium">
                    {flashcard.back.answer}
                  </p>
                  {flashcard.back.details && (
                    <p className="text-sm text-gray-600 text-center">
                      {flashcard.back.details}
                    </p>
                  )}
                </div>
                <p className="text-center text-sm text-gray-400">
                  Swipez → correct | ← incorrect
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
```

### Tâche 5.4: Route /study/session
**Fichier**: `src/routes/study/session.tsx`

```tsx
import { createFileRoute, useSearch } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { SwipeableCard } from '@/components/study/SwipeableCard'
import { StudyProgress } from '@/components/study/StudyProgress'
import { StudyComplete } from '@/components/study/StudyComplete'
import { getFlashcardsByThematics } from '@/server/functions/flashcards'
import { recordStudyResult } from '@/server/functions/study'

export const Route = createFileRoute('/study/session')({
  component: StudySessionPage,
  validateSearch: (search: Record<string, unknown>) => ({
    thematics: (search.thematics as string) || '',
  }),
})

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function StudySessionPage() {
  const { thematics } = useSearch({ from: '/study/session' })
  const thematicIds = thematics.split(',').filter(Boolean)
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<{ id: string; correct: boolean; time: number }[]>([])
  const [startTime, setStartTime] = useState(Date.now())

  const queryClient = useQueryClient()

  const { data: flashcards, isLoading } = useQuery({
    queryKey: ['study-flashcards', thematicIds],
    queryFn: () => getFlashcardsByThematics({ thematicIds }),
    select: (data) => shuffleArray(data),
    staleTime: Infinity, // Ne pas recharger pendant la session
  })

  const recordMutation = useMutation({
    mutationFn: recordStudyResult,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
    },
  })

  const currentCard = flashcards?.[currentIndex]
  const isComplete = flashcards && currentIndex >= flashcards.length

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!currentCard) return

    const responseTime = Date.now() - startTime
    const isCorrect = direction === 'right'

    // Enregistrer localement
    setResults((prev) => [
      ...prev,
      { id: currentCard.id, correct: isCorrect, time: responseTime },
    ])

    // Enregistrer en base
    await recordMutation.mutateAsync({
      flashcardId: currentCard.id,
      isCorrect,
      responseTime,
    })

    // Passer à la carte suivante
    setCurrentIndex((prev) => prev + 1)
    setStartTime(Date.now())
  }

  const stats = useMemo(() => {
    const correct = results.filter((r) => r.correct).length
    const wrong = results.filter((r) => !r.correct).length
    const avgTime = results.length > 0
      ? Math.round(results.reduce((acc, r) => acc + r.time, 0) / results.length / 1000)
      : 0

    return { correct, wrong, avgTime, total: results.length }
  }, [results])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!flashcards?.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-600">Aucune flashcard trouvée pour ces thématiques</p>
        <a href="/study" className="text-blue-600 hover:underline">
          Retour à la sélection
        </a>
      </div>
    )
  }

  if (isComplete) {
    return <StudyComplete stats={stats} flashcards={flashcards} results={results} />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Progression */}
        <StudyProgress
          current={currentIndex + 1}
          total={flashcards.length}
          correct={stats.correct}
          wrong={stats.wrong}
        />

        {/* Carte à swiper */}
        <div className="mt-8">
          <SwipeableCard
            key={currentCard.id}
            flashcard={currentCard}
            onSwipe={handleSwipe}
          />
        </div>

        {/* Instructions */}
        <div className="mt-8 flex justify-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-600">
              ←
            </span>
            <span>Incorrect</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Correct</span>
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 text-green-600">
              →
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Tâche 5.5: Server function recordStudyResult
**Fichier**: `src/server/functions/study.ts`

```typescript
import { createServerFn } from '@tanstack/start'
import { db } from '@/lib/db'
import { studySessions } from '@/lib/db/schema'
import { authMiddleware } from '../middleware/auth'
import { z } from 'zod'

const recordStudyResultSchema = z.object({
  flashcardId: z.string().uuid(),
  isCorrect: z.boolean(),
  responseTime: z.number().positive().optional(),
})

export const recordStudyResult = createServerFn('POST')
  .middleware([authMiddleware])
  .validator(recordStudyResultSchema)
  .handler(async ({ context, data }) => {
    const userId = context.user.id

    await db.insert(studySessions).values({
      flashcardId: data.flashcardId,
      userId,
      isCorrect: data.isCorrect,
      responseTime: data.responseTime,
    })

    return { success: true }
  })
```

### Tâche 5.6: Composant StudyProgress
**Fichier**: `src/components/study/StudyProgress.tsx`

```tsx
interface StudyProgressProps {
  current: number
  total: number
  correct: number
  wrong: number
}

export function StudyProgress({ current, total, correct, wrong }: StudyProgressProps) {
  const progress = (current / total) * 100

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700">
          Carte {current} sur {total}
        </span>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-600">{correct}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-gray-600">{wrong}</span>
          </span>
        </div>
      </div>
      
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
```

### Tâche 5.7: Composant StudyComplete
**Fichier**: `src/components/study/StudyComplete.tsx`

```tsx
import { Link } from '@tanstack/react-router'
import type { Flashcard } from '@/lib/db/schema'

interface StudyCompleteProps {
  stats: {
    correct: number
    wrong: number
    avgTime: number
    total: number
  }
  flashcards: Flashcard[]
  results: { id: string; correct: boolean; time: number }[]
}

export function StudyComplete({ stats, flashcards, results }: StudyCompleteProps) {
  const successRate = Math.round((stats.correct / stats.total) * 100)
  
  const wrongCards = results
    .filter((r) => !r.correct)
    .map((r) => flashcards.find((f) => f.id === r.id))
    .filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Résumé */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
          <div className="text-6xl mb-4">
            {successRate >= 80 ? '🎉' : successRate >= 50 ? '💪' : '📚'}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Session terminée !
          </h1>
          
          <p className="text-gray-600 mb-6">
            {successRate >= 80
              ? 'Excellent travail !'
              : successRate >= 50
              ? 'Bon effort, continuez !'
              : 'Continuez à réviser !'}
          </p>

          {/* Statistiques */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-green-600">{stats.correct}</p>
              <p className="text-sm text-green-700">Correct</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-red-600">{stats.wrong}</p>
              <p className="text-sm text-red-700">Incorrect</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-blue-600">{successRate}%</p>
              <p className="text-sm text-blue-700">Réussite</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link
              to="/study"
              className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-xl
                       hover:bg-blue-700 transition-colors text-center"
            >
              Nouvelle session
            </Link>
            <Link
              to="/dashboard"
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl
                       hover:bg-gray-200 transition-colors text-center"
            >
              Retour au dashboard
            </Link>
          </div>
        </div>

        {/* Cartes incorrectes */}
        {wrongCards.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              À réviser ({wrongCards.length})
            </h2>
            <ul className="space-y-3">
              {wrongCards.map((card) => (
                <li
                  key={card?.id}
                  className="p-3 bg-red-50 rounded-lg border border-red-100"
                >
                  <p className="text-sm text-gray-900">{card?.front.question}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    → {card?.back.answer}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Tâches Mode Révision

### Tâche 6.1: Server function getRevisionCards
**Fichier**: `src/server/functions/study.ts` (ajout)

```typescript
const getRevisionCardsSchema = z.object({
  threshold: z.number().min(1).default(3),
})

export const getRevisionCards = createServerFn('GET')
  .middleware([authMiddleware])
  .validator(getRevisionCardsSchema)
  .handler(async ({ context, data }) => {
    const userId = context.user.id
    const threshold = data.threshold

    const cards = await db
      .select({
        flashcard: flashcards,
        errorCount: sql<number>`COUNT(CASE WHEN ${studySessions.isCorrect} = false THEN 1 END)`,
        thematicName: thematics.name,
      })
      .from(flashcards)
      .innerJoin(thematics, eq(flashcards.thematicId, thematics.id))
      .leftJoin(studySessions, eq(flashcards.id, studySessions.flashcardId))
      .where(eq(flashcards.userId, userId))
      .groupBy(flashcards.id, thematics.name)
      .having(sql`COUNT(CASE WHEN ${studySessions.isCorrect} = false THEN 1 END) >= ${threshold}`)
      .orderBy(sql`COUNT(CASE WHEN ${studySessions.isCorrect} = false THEN 1 END) DESC`)

    return cards.map((c) => ({
      ...c.flashcard,
      errorCount: c.errorCount,
      thematicName: c.thematicName,
    }))
  })
```

### Tâche 6.2: Route /revision
**Fichier**: `src/routes/revision/index.tsx`

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { getRevisionCards } from '@/server/functions/study'

export const Route = createFileRoute('/revision/')({
  component: RevisionPage,
})

function RevisionPage() {
  const [threshold, setThreshold] = useState(3)
  const navigate = useNavigate()

  const { data: cards, isLoading } = useQuery({
    queryKey: ['revision-cards', threshold],
    queryFn: () => getRevisionCards({ threshold }),
  })

  const startRevision = () => {
    if (!cards?.length) return
    navigate({
      to: '/revision/session',
      search: { threshold },
    })
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Mode Révision
      </h1>
      <p className="text-gray-600 mb-8">
        Révisez les cartes qui vous posent le plus de difficultés
      </p>

      {/* Sélecteur de seuil */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Seuil d'erreurs minimum
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={1}
            max={10}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-lg font-semibold text-blue-600 w-8">
            {threshold}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Affiche les cartes avec au moins {threshold} réponse{threshold > 1 ? 's' : ''} incorrecte{threshold > 1 ? 's' : ''}
        </p>
      </div>

      {/* Aperçu */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {isLoading ? 'Chargement...' : `${cards?.length ?? 0} cartes à réviser`}
        </h2>

        {cards && cards.length > 0 ? (
          <>
            <ul className="space-y-2 mb-6 max-h-64 overflow-y-auto">
              {cards.slice(0, 10).map((card) => (
                <li
                  key={card.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-700 truncate flex-1">
                    {card.front.question}
                  </span>
                  <span className="text-xs text-red-600 font-medium ml-2">
                    {card.errorCount} erreurs
                  </span>
                </li>
              ))}
              {cards.length > 10 && (
                <li className="text-center text-sm text-gray-500 py-2">
                  ... et {cards.length - 10} autres
                </li>
              )}
            </ul>

            <button
              type="button"
              onClick={startRevision}
              className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-xl
                       hover:bg-blue-700 transition-colors"
            >
              Commencer la révision
            </button>
          </>
        ) : !isLoading ? (
          <p className="text-gray-500 text-center py-8">
            🎉 Aucune carte ne correspond à ce seuil. Bravo !
          </p>
        ) : null}
      </div>
    </div>
  )
}
```

---

## Export des Composants
**Fichier**: `src/components/study/index.ts`

```typescript
export { TopicSelector } from './TopicSelector'
export { SwipeableCard } from './SwipeableCard'
export { StudyProgress } from './StudyProgress'
export { StudyComplete } from './StudyComplete'
```

---

## CSS Requis (globals.css ajouts)
```css
.perspective-1000 {
  perspective: 1000px;
}

.preserve-3d {
  transform-style: preserve-3d;
}

.backface-hidden {
  backface-visibility: hidden;
}

.rotate-y-180 {
  transform: rotateY(180deg);
}
```

---

## Format de Sortie

Après chaque tâche, ajouter à `progress.txt`:

```
[STUDY-AGENT] [YYYY-MM-DD HH:mm]
Tâche: <description>
Statut: ✅ Terminé | 🟡 Partiel | ❌ Échoué
Fichiers créés/modifiés:
  - <chemin fichier>
Notes: <notes pertinentes>
---
```
