# 📋 Phase 6 : Mode Révision

## Vue d'ensemble
**Durée estimée**: 2-3 jours  
**Agents impliqués**: study-agent  
**Objectif**: Révision intelligente basée sur les erreurs passées

---

## Tâche 6.1 : Server function getRevisionCards

### Description
Récupérer les flashcards ayant un nombre d'erreurs supérieur ou égal à un seuil.

### Agent
`study-agent`

### Fichier à modifier
- `src/server/functions/study.ts`

### Schéma
```typescript
const getRevisionCardsSchema = z.object({
  threshold: z.number().min(1).default(3),
})
```

### Code
```typescript
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
        totalSessions: sql<number>`COUNT(${studySessions.id})`,
        thematicName: thematics.name,
        thematicIcon: thematics.icon,
      })
      .from(flashcards)
      .innerJoin(thematics, eq(flashcards.thematicId, thematics.id))
      .leftJoin(studySessions, eq(flashcards.id, studySessions.flashcardId))
      .where(eq(flashcards.userId, userId))
      .groupBy(flashcards.id, thematics.name, thematics.icon)
      .having(
        sql`COUNT(CASE WHEN ${studySessions.isCorrect} = false THEN 1 END) >= ${threshold}`
      )
      .orderBy(
        sql`COUNT(CASE WHEN ${studySessions.isCorrect} = false THEN 1 END) DESC`
      )

    return cards.map((c) => ({
      ...c.flashcard,
      errorCount: c.errorCount,
      totalSessions: c.totalSessions,
      thematicName: c.thematicName,
      thematicIcon: c.thematicIcon,
    }))
  })
```

### Retour attendu
```typescript
interface RevisionCard extends Flashcard {
  errorCount: number
  totalSessions: number
  thematicName: string
  thematicIcon: string
}
```

### Tri
Cartes triées par nombre d'erreurs décroissant (les plus difficiles en premier).

### Validation
- [ ] Filtre par seuil fonctionne
- [ ] Tri par erreurs
- [ ] Infos thématique incluses

---

## Tâche 6.2 : Route /revision configuration

### Description
Page de configuration avant de commencer une révision.

### Agent
`study-agent`

### Fichier à créer
- `src/routes/revision/index.tsx`

### Structure
```
┌─────────────────────────────────────────┐
│ Mode Révision                           │
│ Révisez les cartes qui vous posent      │
│ le plus de difficultés                  │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Seuil d'erreurs minimum             │ │
│ │                                     │ │
│ │ ───────────●──────────── 3          │ │
│ │                                     │ │
│ │ Cartes avec au moins 3 erreurs      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 12 cartes à réviser                 │ │
│ │                                     │ │
│ │ - Question 1... (5 erreurs)         │ │
│ │ - Question 2... (4 erreurs)         │ │
│ │ - Question 3... (3 erreurs)         │ │
│ │ ... et 9 autres                     │ │
│ │                                     │ │
│ │ [Commencer la révision]             │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### État local
```typescript
const [threshold, setThreshold] = useState(3)
```

### Query avec refetch
```typescript
const { data: cards, isLoading, refetch } = useQuery({
  queryKey: ['revision-cards', threshold],
  queryFn: () => getRevisionCards({ threshold }),
})
```

### Logique
1. Slider pour ajuster le seuil (1-10)
2. Aperçu des cartes correspondantes
3. Bouton pour démarrer (désactivé si 0 cartes)
4. Message encourageant si aucune carte

### Validation
- [ ] Slider fonctionne
- [ ] Aperçu mis à jour
- [ ] Démarrage de session

---

## Tâche 6.3 : Sélecteur seuil d'erreurs

### Description
Composant slider pour le seuil.

### Agent
`study-agent`

### Intégration
Peut être un simple `<input type="range">` stylisé.

### Props
```typescript
interface ThresholdSliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}
```

### Code
```tsx
export function ThresholdSlider({ value, onChange, min = 1, max = 10 }: Props) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Seuil d'erreurs minimum
      </label>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none 
                     cursor-pointer accent-blue-600"
        />
        <span className="text-lg font-semibold text-blue-600 w-8 text-center">
          {value}
        </span>
      </div>
      <p className="text-sm text-gray-500">
        Cartes avec au moins {value} réponse{value > 1 ? 's' : ''} incorrecte{value > 1 ? 's' : ''}
      </p>
    </div>
  )
}
```

### Validation
- [ ] Valeur reflétée
- [ ] Bornes respectées
- [ ] Feedback visuel

---

## Tâche 6.4 : Route /revision/session

### Description
Session de révision (réutilise le système de swipe).

### Agent
`study-agent`

### Fichier à créer
- `src/routes/revision/session.tsx`

### Paramètres URL
```typescript
validateSearch: (search) => ({
  threshold: Number(search.threshold) || 3,
})
```

### Différences avec mode étude
1. Cartes sélectionnées par erreurs, pas par thématique
2. Affichage du nombre d'erreurs sur chaque carte
3. Tri par difficulté (plus d'erreurs = affiché en premier)

### Réutilisation des composants
- `SwipeableCard` (Phase 5)
- `StudyProgress` (Phase 5)
- `StudyComplete` (Phase 5)

### Logique supplémentaire
Après révision réussie d'une carte difficile, le compteur d'erreurs ne diminue pas automatiquement mais les nouvelles sessions contribuent au taux de réussite.

### Validation
- [ ] Cartes chargées par seuil
- [ ] Session fonctionne
- [ ] Résultats enregistrés

---

## Tâche 6.5 : Indicateur priorité révision

### Description
Badge visuel sur les cartes indiquant la priorité de révision.

### Agent
`study-agent`

### Dans SwipeableCard (mode révision)
```tsx
{/* Badge erreurs */}
{mode === 'revision' && (
  <div className={`
    absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium
    ${errorCount >= 5 ? 'bg-red-100 text-red-700' : 
      errorCount >= 3 ? 'bg-orange-100 text-orange-700' : 
      'bg-yellow-100 text-yellow-700'}
  `}>
    {errorCount} erreur{errorCount > 1 ? 's' : ''}
  </div>
)}
```

### Couleurs selon gravité
| Erreurs | Couleur | Signification |
|---------|---------|---------------|
| 1-2 | Jaune | À surveiller |
| 3-4 | Orange | Difficile |
| 5+ | Rouge | Critique |

### Validation
- [ ] Badge visible en mode révision
- [ ] Couleur appropriée
- [ ] Non visible en mode étude normal

---

## Composant RevisionCardPreview

### Description
Aperçu d'une carte dans la liste de configuration.

### Code
```tsx
interface RevisionCardPreviewProps {
  card: RevisionCard
}

export function RevisionCardPreview({ card }: RevisionCardPreviewProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-lg">{card.thematicIcon}</span>
        <div className="truncate">
          <p className="text-sm text-gray-900 truncate">
            {card.front.question}
          </p>
          <p className="text-xs text-gray-500">
            {card.thematicName}
          </p>
        </div>
      </div>
      <span className={`
        px-2 py-1 rounded-full text-xs font-medium flex-shrink-0
        ${card.errorCount >= 5 ? 'bg-red-100 text-red-700' : 
          card.errorCount >= 3 ? 'bg-orange-100 text-orange-700' : 
          'bg-yellow-100 text-yellow-700'}
      `}>
        {card.errorCount} erreur{card.errorCount > 1 ? 's' : ''}
      </span>
    </div>
  )
}
```

---

## État vide (aucune carte à réviser)

### Message
```tsx
<div className="text-center py-12">
  <span className="text-6xl mb-4 block">🎉</span>
  <h3 className="text-lg font-semibold text-gray-900">
    Félicitations !
  </h3>
  <p className="text-gray-600 mt-2">
    Aucune carte ne correspond à ce seuil d'erreurs.
    <br />
    Continuez à étudier régulièrement !
  </p>
  <Link
    to="/study"
    className="inline-block mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg"
  >
    Aller au mode étude
  </Link>
</div>
```

---

## Checklist Phase 6

- [ ] 6.1 getRevisionCards retourne les cartes
- [ ] 6.2 Route /revision avec configuration
- [ ] 6.3 Slider seuil fonctionnel
- [ ] 6.4 Session de révision active
- [ ] 6.5 Indicateurs de priorité visibles

## Tests à effectuer
- [ ] Seuil 1 → toutes les cartes avec erreurs
- [ ] Seuil 5 → seulement les très difficiles
- [ ] Session de révision complète
- [ ] Résultats enregistrés
- [ ] État vide géré

## Prochaine Phase
→ Phase 7 : Dashboard Métriques
