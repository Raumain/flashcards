# 📋 Phase 7 : Dashboard Métriques

## Vue d'ensemble
**Durée estimée**: 4-5 jours  
**Agents impliqués**: dashboard-agent  
**Objectif**: Visualisation des progrès d'apprentissage avec graphiques

---

## Tâche 7.1 : Server function getDashboardMetrics

### Description
Calculer toutes les métriques globales pour le dashboard.

### Agent
`dashboard-agent`

### Fichier à créer
- `src/server/functions/metrics.ts`

### Métriques à calculer
1. **totalFlashcards** - Nombre total de flashcards
2. **totalThematics** - Nombre de thématiques
3. **totalSessions** - Nombre de sessions d'étude
4. **successRate** - Taux de réussite global (%)
5. **avgResponseTime** - Temps moyen de réponse (ms)
6. **streak** - Jours consécutifs d'étude

### Code
```typescript
export const getDashboardMetrics = createServerFn('GET')
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const userId = context.user.id

    // Query principale
    const [globalStats] = await db
      .select({
        totalFlashcards: sql<number>`COUNT(DISTINCT ${flashcards.id})`,
        totalThematics: sql<number>`COUNT(DISTINCT ${thematics.id})`,
        totalSessions: sql<number>`COUNT(${studySessions.id})`,
        correctAnswers: sql<number>`SUM(CASE WHEN ${studySessions.isCorrect} THEN 1 ELSE 0 END)`,
        avgResponseTime: sql<number>`ROUND(AVG(${studySessions.responseTime}))`,
      })
      .from(flashcards)
      .innerJoin(thematics, eq(flashcards.thematicId, thematics.id))
      .leftJoin(studySessions, eq(flashcards.id, studySessions.flashcardId))
      .where(eq(flashcards.userId, userId))

    // Calcul du streak
    const streak = await calculateStreak(userId)

    const successRate = globalStats.totalSessions > 0
      ? Math.round((globalStats.correctAnswers / globalStats.totalSessions) * 100)
      : 0

    return {
      totalFlashcards: globalStats.totalFlashcards || 0,
      totalThematics: globalStats.totalThematics || 0,
      totalSessions: globalStats.totalSessions || 0,
      successRate,
      avgResponseTime: globalStats.avgResponseTime || 0,
      streak,
    }
  })
```

### Calcul du streak
```typescript
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
    const expectedDate = new Date(today)
    expectedDate.setDate(expectedDate.getDate() - i)

    if (sessionDate.getTime() === expectedDate.getTime()) {
      streak++
    } else {
      break
    }
  }

  return streak
}
```

### Validation
- [ ] Métriques calculées correctement
- [ ] Streak cohérent
- [ ] Gestion des cas sans données

---

## Tâche 7.2 : Composant StatsCards (KPIs)

### Description
Cartes affichant les indicateurs clés de performance.

### Agent
`dashboard-agent`

### Fichier à créer
- `src/components/dashboard/StatsCards.tsx`

### Structure
```
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ 📚      │ │ 🎯      │ │ ⏱️      │ │ 🔥      │
│ 142     │ │ 78%     │ │ 4s      │ │ 7       │
│ Cards   │ │ Réussite│ │ Temps   │ │ Streak  │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

### Code
Voir `dashboard-agent.md` pour l'implémentation complète.

### Animations
- Compteur animé à l'apparition (optionnel)
- Loading skeleton pendant le chargement

### Validation
- [ ] 4 KPIs affichés
- [ ] Données correctes
- [ ] État de chargement

---

## Tâche 7.3 : Installation Recharts

### Description
Installer la librairie de graphiques.

### Agent
`dashboard-agent`

### Commande
```bash
bun add recharts
```

### Import type-safe
```typescript
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
```

### Validation
- [ ] Package installé
- [ ] Imports fonctionnent

---

## Tâche 7.4 : Composant ProgressChart (courbe)

### Description
Graphique linéaire montrant l'évolution du taux de réussite.

### Agent
`dashboard-agent`

### Server function
```typescript
export const getProgressOverTime = createServerFn('GET')
  .middleware([authMiddleware])
  .validator(z.object({
    period: z.enum(['7d', '30d', '90d']).default('7d'),
  }))
  .handler(async ({ context, data }) => {
    const userId = context.user.id
    const days = data.period === '7d' ? 7 : data.period === '30d' ? 30 : 90

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const results = await db
      .select({
        date: sql<string>`DATE(${studySessions.studiedAt})`,
        total: sql<number>`COUNT(*)`,
        correct: sql<number>`SUM(CASE WHEN ${studySessions.isCorrect} THEN 1 ELSE 0 END)`,
      })
      .from(studySessions)
      .where(and(
        eq(studySessions.userId, userId),
        gte(studySessions.studiedAt, startDate)
      ))
      .groupBy(sql`DATE(${studySessions.studiedAt})`)
      .orderBy(sql`DATE(${studySessions.studiedAt})`)

    return results.map((r) => ({
      date: new Date(r.date).toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: 'short' 
      }),
      successRate: Math.round((r.correct / r.total) * 100),
      sessions: r.total,
    }))
  })
```

### Composant
```tsx
export function ProgressChart({ period = '7d' }: { period: '7d' | '30d' | '90d' }) {
  const { data } = useQuery({
    queryKey: ['progress', period],
    queryFn: () => getProgressOverTime({ period }),
  })

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <Tooltip />
        <Line type="monotone" dataKey="successRate" stroke="#3B82F6" />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

### Validation
- [ ] Données sur la période
- [ ] Graphique affiché
- [ ] Tooltip informatif

---

## Tâche 7.5 : Composant ThematicPieChart

### Description
Camembert de répartition des flashcards par thématique.

### Agent
`dashboard-agent`

### Server function
```typescript
export const getThematicDistribution = createServerFn('GET')
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return db
      .select({
        name: thematics.name,
        color: thematics.color,
        count: count(flashcards.id),
      })
      .from(thematics)
      .leftJoin(flashcards, eq(thematics.id, flashcards.thematicId))
      .where(eq(thematics.userId, context.user.id))
      .groupBy(thematics.id)
  })
}
```

### Composant avec légende
```tsx
<PieChart>
  <Pie
    data={data}
    dataKey="count"
    nameKey="name"
    innerRadius={60}
    outerRadius={100}
  >
    {data?.map((entry, i) => (
      <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
    ))}
  </Pie>
  <Legend />
  <Tooltip />
</PieChart>
```

### Validation
- [ ] Répartition correcte
- [ ] Couleurs des thématiques
- [ ] Légende lisible

---

## Tâche 7.6 : Composant DifficultyBars

### Description
Graphique en barres horizontales du taux de réussite par difficulté.

### Agent
`dashboard-agent`

### Server function
```typescript
export const getDifficultyStats = createServerFn('GET')
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const results = await db
      .select({
        difficulty: flashcards.difficulty,
        total: sql<number>`COUNT(${studySessions.id})`,
        correct: sql<number>`SUM(CASE WHEN ${studySessions.isCorrect} THEN 1 ELSE 0 END)`,
      })
      .from(flashcards)
      .leftJoin(studySessions, eq(flashcards.id, studySessions.flashcardId))
      .where(eq(flashcards.userId, context.user.id))
      .groupBy(flashcards.difficulty)

    return results.map((r) => ({
      difficulty: r.difficulty,
      successRate: r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0,
    }))
  })
```

### Labels en français
```typescript
const LABELS = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
}
```

### Validation
- [ ] 3 barres (easy/medium/hard)
- [ ] Pourcentages corrects
- [ ] Couleurs distinctes

---

## Tâche 7.7 : Composant StudyHeatmap

### Description
Calendrier d'activité style GitHub.

### Agent
`dashboard-agent`

### Server function
```typescript
export const getStudyHeatmap = createServerFn('GET')
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 84) // 12 semaines

    const results = await db
      .select({
        date: sql<string>`DATE(${studySessions.studiedAt})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(studySessions)
      .where(and(
        eq(studySessions.userId, context.user.id),
        gte(studySessions.studiedAt, startDate)
      ))
      .groupBy(sql`DATE(${studySessions.studiedAt})`)

    // Transformer en structure semaines/jours
    // ...
  })
```

### Structure retournée
```typescript
interface HeatmapData {
  weeks: {
    days: {
      date: string
      count: number
    }[]
  }[]
}
```

### Intensité des couleurs
| Sessions | Classe CSS |
|----------|------------|
| 0 | bg-gray-100 |
| 1-4 | bg-blue-200 |
| 5-9 | bg-blue-400 |
| 10-19 | bg-blue-600 |
| 20+ | bg-blue-800 |

### Validation
- [ ] 12 semaines affichées
- [ ] Intensité correcte
- [ ] Tooltip avec date et count

---

## Tâche 7.8 : Server function getDifficultCards

### Description
Top 10 des cartes les plus difficiles.

### Agent
`dashboard-agent`

### Code
```typescript
export const getDifficultCards = createServerFn('GET')
  .middleware([authMiddleware])
  .validator(z.object({ limit: z.number().default(10) }))
  .handler(async ({ context, data }) => {
    return db
      .select({
        id: flashcards.id,
        front: flashcards.front,
        thematicName: thematics.name,
        errorCount: sql<number>`COUNT(CASE WHEN ${studySessions.isCorrect} = false THEN 1 END)`,
      })
      .from(flashcards)
      .innerJoin(thematics, eq(flashcards.thematicId, thematics.id))
      .leftJoin(studySessions, eq(flashcards.id, studySessions.flashcardId))
      .where(eq(flashcards.userId, context.user.id))
      .groupBy(flashcards.id, thematics.name)
      .having(sql`COUNT(CASE WHEN ${studySessions.isCorrect} = false THEN 1 END) > 0`)
      .orderBy(desc(sql`COUNT(CASE WHEN ${studySessions.isCorrect} = false THEN 1 END)`))
      .limit(data.limit)
  })
```

### Validation
- [ ] Top 10 retourné
- [ ] Trié par erreurs
- [ ] Infos thématique incluses

---

## Tâche 7.9 : Liste top 10 cartes difficiles

### Description
Composant affichant les cartes à réviser en priorité.

### Agent
`dashboard-agent`

### Fichier à créer
- `src/components/dashboard/DifficultCardsList.tsx`

### Structure
```
┌─────────────────────────────────────────┐
│ Cartes à réviser en priorité           │
│                                         │
│ 1. [Anatomie] Comment s'appelle...      │
│    5 erreurs                            │
│                                         │
│ 2. [Physio] Quel est le rôle de...      │
│    4 erreurs                            │
│                                         │
│ ... (max 10)                            │
└─────────────────────────────────────────┘
```

### État vide
Message encourageant si aucune carte difficile.

### Validation
- [ ] Liste affichée
- [ ] Badges erreurs
- [ ] État vide géré

---

## Export des composants

### Fichier: `src/components/dashboard/index.ts`
```typescript
export { StatsCards } from './StatsCards'
export { ProgressChart } from './ProgressChart'
export { ThematicPieChart } from './ThematicPieChart'
export { DifficultyBars } from './DifficultyBars'
export { StudyHeatmap } from './StudyHeatmap'
export { DifficultCardsList } from './DifficultCardsList'
```

---

## Checklist Phase 7

- [ ] 7.1 getDashboardMetrics calculées
- [ ] 7.2 StatsCards affichés
- [ ] 7.3 Recharts installé
- [ ] 7.4 ProgressChart fonctionnel
- [ ] 7.5 ThematicPieChart fonctionnel
- [ ] 7.6 DifficultyBars fonctionnel
- [ ] 7.7 StudyHeatmap fonctionnel
- [ ] 7.8 getDifficultCards retourne le top 10
- [ ] 7.9 DifficultCardsList affichée

## Tests à effectuer
- [ ] Dashboard se charge rapidement
- [ ] Données cohérentes entre composants
- [ ] Graphiques responsives
- [ ] Tooltips informatifs
- [ ] État vide pour chaque composant

## Prochaine Phase
→ Phase 8 : Finalisation
