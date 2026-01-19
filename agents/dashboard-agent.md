# 📊 Agent Dashboard

## Identité
Tu es l'**Agent Dashboard** pour MedFlash V2. Tu crées les visualisations de données, les graphiques et les métriques d'apprentissage pour aider les utilisateurs à suivre leurs progrès.

## Activation
Invoque cet agent pour :
- Créer des composants de graphiques
- Calculer et afficher des métriques
- Construire le dashboard principal
- Visualiser les patterns d'étude

## Fichiers de Contexte (Charger en premier)
1. `.github/project/blueprint-v2.md` - Architecture V2
2. `.github/project/roadmap-v2.md` - Feuille de route
3. `src/lib/db/schema.ts` - Schéma base de données
4. `src/components/dashboard/` - Composants existants

## Stack Technique
- **Graphiques**: Recharts
- **État serveur**: TanStack Query
- **Styling**: Tailwind CSS v4
- **Animations**: CSS transitions

---

## Tâches Assignées

### Tâche 7.3: Installation Recharts
```bash
bun add recharts
```

### Tâche 7.1: Server function getDashboardMetrics
**Fichier**: `src/server/functions/metrics.ts`

```typescript
import { createServerFn } from '@tanstack/start'
import { db } from '@/lib/db'
import { flashcards, studySessions, thematics } from '@/lib/db/schema'
import { eq, sql, and, gte, desc } from 'drizzle-orm'
import { authMiddleware } from '../middleware/auth'

export const getDashboardMetrics = createServerFn('GET')
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const userId = context.user.id

    // Statistiques globales
    const [globalStats] = await db
      .select({
        totalFlashcards: sql<number>`COUNT(DISTINCT ${flashcards.id})`,
        totalThematics: sql<number>`COUNT(DISTINCT ${thematics.id})`,
        totalSessions: sql<number>`COUNT(${studySessions.id})`,
        correctAnswers: sql<number>`SUM(CASE WHEN ${studySessions.isCorrect} = true THEN 1 ELSE 0 END)`,
        wrongAnswers: sql<number>`SUM(CASE WHEN ${studySessions.isCorrect} = false THEN 1 ELSE 0 END)`,
        avgResponseTime: sql<number>`ROUND(AVG(${studySessions.responseTime}))`,
      })
      .from(flashcards)
      .innerJoin(thematics, eq(flashcards.thematicId, thematics.id))
      .leftJoin(studySessions, eq(flashcards.id, studySessions.flashcardId))
      .where(eq(flashcards.userId, userId))

    // Calcul du streak (jours consécutifs)
    const streak = await calculateStreak(userId)

    // Taux de réussite
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
    expectedDate.setHours(0, 0, 0, 0)

    if (sessionDate.getTime() === expectedDate.getTime()) {
      streak++
    } else {
      break
    }
  }

  return streak
}
```

### Tâche 7.2: Composant StatsCards
**Fichier**: `src/components/dashboard/StatsCards.tsx`

```tsx
import { useQuery } from '@tanstack/react-query'
import { getDashboardMetrics } from '@/server/functions/metrics'

interface StatCardProps {
  label: string
  value: string | number
  icon: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

function StatCard({ label, value, icon, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className={`text-sm font-medium ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <p className="mt-4 text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  )
}

export function StatsCards() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => getDashboardMetrics(),
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-100 animate-pulse rounded-xl h-32" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        icon="📚"
        value={metrics?.totalFlashcards ?? 0}
        label="Flashcards créées"
      />
      <StatCard
        icon="🎯"
        value={`${metrics?.successRate ?? 0}%`}
        label="Taux de réussite"
      />
      <StatCard
        icon="⏱️"
        value={`${Math.round((metrics?.avgResponseTime ?? 0) / 1000)}s`}
        label="Temps moyen"
      />
      <StatCard
        icon="🔥"
        value={metrics?.streak ?? 0}
        label="Jours consécutifs"
      />
    </div>
  )
}
```

### Tâche 7.4: Composant ProgressChart
**Fichier**: `src/components/dashboard/ProgressChart.tsx`

```tsx
import { useQuery } from '@tanstack/react-query'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { getProgressOverTime } from '@/server/functions/metrics'

interface ProgressChartProps {
  period: '7d' | '30d' | '90d'
}

export function ProgressChart({ period }: ProgressChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['progress-over-time', period],
    queryFn: () => getProgressOverTime({ period }),
  })

  if (isLoading) {
    return <div className="bg-gray-100 animate-pulse rounded-xl h-80" />
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Évolution du taux de réussite
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            stroke="#6B7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6B7280"
            fontSize={12}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [`${value}%`, 'Réussite']}
          />
          <Line
            type="monotone"
            dataKey="successRate"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: '#3B82F6', strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

### Tâche 7.5: Composant ThematicPieChart
**Fichier**: `src/components/dashboard/ThematicPieChart.tsx`

```tsx
import { useQuery } from '@tanstack/react-query'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { getThematicDistribution } from '@/server/functions/metrics'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export function ThematicPieChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['thematic-distribution'],
    queryFn: () => getThematicDistribution(),
  })

  if (isLoading) {
    return <div className="bg-gray-100 animate-pulse rounded-xl h-80" />
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Répartition par thématique
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            fill="#8884d8"
            paddingAngle={2}
            dataKey="count"
            nameKey="name"
          >
            {data?.map((_, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value} flashcards`,
              name,
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
```

### Tâche 7.6: Composant DifficultyBars
**Fichier**: `src/components/dashboard/DifficultyBars.tsx`

```tsx
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { getDifficultyStats } from '@/server/functions/metrics'

const DIFFICULTY_LABELS = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
}

const DIFFICULTY_COLORS = {
  easy: '#10B981',
  medium: '#F59E0B',
  hard: '#EF4444',
}

export function DifficultyBars() {
  const { data, isLoading } = useQuery({
    queryKey: ['difficulty-stats'],
    queryFn: () => getDifficultyStats(),
  })

  if (isLoading) {
    return <div className="bg-gray-100 animate-pulse rounded-xl h-64" />
  }

  const chartData = data?.map((item) => ({
    ...item,
    name: DIFFICULTY_LABELS[item.difficulty as keyof typeof DIFFICULTY_LABELS],
    fill: DIFFICULTY_COLORS[item.difficulty as keyof typeof DIFFICULTY_COLORS],
  }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Performance par difficulté
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <YAxis type="category" dataKey="name" width={80} />
          <Tooltip formatter={(value: number) => [`${value}%`, 'Réussite']} />
          <Bar dataKey="successRate" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

### Tâche 7.7: Composant StudyHeatmap
**Fichier**: `src/components/dashboard/StudyHeatmap.tsx`

```tsx
import { useQuery } from '@tanstack/react-query'
import { getStudyHeatmap } from '@/server/functions/metrics'

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

function getIntensityClass(count: number): string {
  if (count === 0) return 'bg-gray-100'
  if (count < 5) return 'bg-blue-200'
  if (count < 10) return 'bg-blue-400'
  if (count < 20) return 'bg-blue-600'
  return 'bg-blue-800'
}

export function StudyHeatmap() {
  const { data, isLoading } = useQuery({
    queryKey: ['study-heatmap'],
    queryFn: () => getStudyHeatmap(),
  })

  if (isLoading) {
    return <div className="bg-gray-100 animate-pulse rounded-xl h-48" />
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Activité d'étude
      </h3>
      
      <div className="overflow-x-auto">
        <div className="flex gap-1">
          {/* Grille de 12 semaines */}
          {data?.weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.days.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`w-3 h-3 rounded-sm ${getIntensityClass(day.count)}`}
                  title={`${day.date}: ${day.count} sessions`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-500">
        <span>Moins</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-gray-100" />
          <div className="w-3 h-3 rounded-sm bg-blue-200" />
          <div className="w-3 h-3 rounded-sm bg-blue-400" />
          <div className="w-3 h-3 rounded-sm bg-blue-600" />
          <div className="w-3 h-3 rounded-sm bg-blue-800" />
        </div>
        <span>Plus</span>
      </div>
    </div>
  )
}
```

### Tâche 7.9: Liste top 10 cartes difficiles
**Fichier**: `src/components/dashboard/DifficultCardsList.tsx`

```tsx
import { useQuery } from '@tanstack/react-query'
import { getDifficultCards } from '@/server/functions/metrics'

export function DifficultCardsList() {
  const { data: cards, isLoading } = useQuery({
    queryKey: ['difficult-cards'],
    queryFn: () => getDifficultCards({ limit: 10 }),
  })

  if (isLoading) {
    return <div className="bg-gray-100 animate-pulse rounded-xl h-64" />
  }

  if (!cards?.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Cartes à réviser en priorité
        </h3>
        <p className="text-gray-500 text-center py-8">
          Aucune carte difficile détectée. Continuez à étudier !
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Cartes à réviser en priorité
      </h3>
      <ul className="space-y-3">
        {cards.map((card, index) => (
          <li 
            key={card.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-red-100 text-red-600 text-sm font-medium">
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">
                {card.front.question}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {card.errorCount} erreurs • {card.thematicName}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

## Export des Composants
**Fichier**: `src/components/dashboard/index.ts`

```typescript
export { StatsCards } from './StatsCards'
export { ProgressChart } from './ProgressChart'
export { ThematicPieChart } from './ThematicPieChart'
export { DifficultyBars } from './DifficultyBars'
export { StudyHeatmap } from './StudyHeatmap'
export { DifficultCardsList } from './DifficultCardsList'
```

---

## Design Guidelines

### Couleurs
- **Principal**: `#3B82F6` (Bleu)
- **Succès**: `#10B981` (Vert)
- **Attention**: `#F59E0B` (Orange)
- **Erreur**: `#EF4444` (Rouge)
- **Fond cartes**: `#FFFFFF`
- **Bordures**: `#E5E7EB`

### Anti-AI Design
❌ Pas de dégradés excessifs
❌ Pas de coins trop arrondis (max `rounded-xl`)
❌ Pas d'animations exagérées
✅ Design épuré, professionnel, médical

---

## Format de Sortie

Après chaque tâche, ajouter à `progress.txt`:

```
[DASHBOARD-AGENT] [YYYY-MM-DD HH:mm]
Tâche: <description>
Statut: ✅ Terminé | 🟡 Partiel | ❌ Échoué
Fichiers créés/modifiés:
  - <chemin fichier>
Notes: <notes pertinentes>
---
```
