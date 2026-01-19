# 📋 Phase 5 : Mode Étude

## Vue d'ensemble
**Durée estimée**: 4-5 jours  
**Agents impliqués**: study-agent  
**Objectif**: Système d'étude interactif avec swipe gauche/droite

---

## Tâche 5.1 : Route /study sélection thématiques

### Description
Page de sélection des thématiques avant de commencer une session.

### Agent
`study-agent`

### Fichier à créer
- `src/routes/study/index.tsx`

### Structure
```
┌─────────────────────────────────────────┐
│ Mode Étude                              │
│ Sélectionnez les thématiques à réviser │
│                                         │
│ [Tout sélectionner] | [Désélectionner] │
│                                         │
│ ┌─────────────┐ ┌─────────────┐        │
│ │ ☑ Anatomie  │ │ ☐ Physio    │        │
│ │ 42 cards    │ │ 28 cards    │        │
│ └─────────────┘ └─────────────┘        │
│                                         │
│        [Commencer avec 1 thématique]    │
└─────────────────────────────────────────┘
```

### Logique
- Charger les thématiques de l'utilisateur
- Permettre sélection multiple
- Afficher le nombre total de cartes sélectionnées
- Désactiver le bouton si aucune sélection

### Validation
- [ ] Thématiques affichées
- [ ] Sélection/désélection fonctionne
- [ ] Compteur mis à jour
- [ ] Navigation vers session

---

## Tâche 5.2 : Composant TopicSelector

### Description
Composant de sélection des thématiques réutilisable.

### Agent
`study-agent`

### Fichier à créer
- `src/components/study/TopicSelector.tsx`

### Props
```typescript
interface TopicSelectorProps {
  thematics: ThematicWithCount[]
  selected: string[]
  onSelectionChange: (ids: string[]) => void
}
```

### Fonctionnalités
- Cartes cliquables pour toggle
- État visuel clair (sélectionné vs non)
- Boutons "Tout sélectionner" / "Tout désélectionner"
- Badge avec nombre de flashcards

### Styles
- Sélectionné : bordure bleue, fond bleu clair
- Non sélectionné : bordure grise

### Validation
- [ ] Toggle fonctionne
- [ ] État visuel correct
- [ ] Actions groupées fonctionnent

---

## Tâche 5.3 : Composant SwipeableCard (Framer Motion)

### Description
Carte de flashcard avec animation de swipe.

### Agent
`study-agent`

### Dépendance
```bash
bun add framer-motion
```

### Fichier à créer
- `src/components/study/SwipeableCard.tsx`

### Props
```typescript
interface SwipeableCardProps {
  flashcard: Flashcard
  onSwipe: (direction: 'left' | 'right') => void
}
```

### Comportement
1. **Affichage initial** : Question visible
2. **Clic** : Flip pour voir la réponse
3. **Drag horizontal** : 
   - Rotation légère pendant le drag
   - Indicateurs de direction (✓ / ✗)
4. **Relâchement** :
   - Si > seuil (100px) : swipe complet, callback
   - Si < seuil : retour au centre

### Animations Framer Motion
```typescript
const x = useMotionValue(0)
const rotate = useTransform(x, [-200, 200], [-15, 15])
const rightOpacity = useTransform(x, [0, 100], [0, 1])
const leftOpacity = useTransform(x, [-100, 0], [1, 0])
```

### Flip de carte
- Animation 3D avec `rotateY`
- Face avant : question
- Face arrière : réponse + détails

### CSS requis
```css
.perspective-1000 { perspective: 1000px; }
.preserve-3d { transform-style: preserve-3d; }
.backface-hidden { backface-visibility: hidden; }
.rotate-y-180 { transform: rotateY(180deg); }
```

### Validation
- [ ] Flip au clic
- [ ] Drag horizontal fluide
- [ ] Indicateurs visibles pendant drag
- [ ] Callback appelé au swipe

---

## Tâche 5.4 : Route /study/session

### Description
Page de session d'étude active.

### Agent
`study-agent`

### Fichier à créer
- `src/routes/study/session.tsx`

### Paramètres URL
```typescript
validateSearch: (search) => ({
  thematics: search.thematics as string, // IDs séparés par virgules
})
```

### Logique de session
1. Charger les flashcards des thématiques sélectionnées
2. Mélanger aléatoirement
3. Afficher une carte à la fois
4. Enregistrer chaque résultat
5. Afficher le résumé à la fin

### État local
```typescript
const [currentIndex, setCurrentIndex] = useState(0)
const [results, setResults] = useState<StudyResult[]>([])
const [startTime, setStartTime] = useState(Date.now())
```

### Structure page
```
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │ Carte 3 sur 42    ● 2  ● 0          │ │
│ │ ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│ └─────────────────────────────────────┘ │
│                                         │
│         ┌─────────────────────┐         │
│         │                     │         │
│   ✗     │    [Flashcard]      │     ✓   │
│         │                     │         │
│         └─────────────────────┘         │
│                                         │
│      ← Incorrect      Correct →         │
└─────────────────────────────────────────┘
```

### Validation
- [ ] Cartes mélangées
- [ ] Progression affichée
- [ ] Swipe enregistré
- [ ] Fin de session détectée

---

## Tâche 5.5 : Server function recordStudyResult

### Description
Enregistrer le résultat d'une interaction avec une flashcard.

### Agent
`study-agent`

### Fichier à créer/modifier
- `src/server/functions/study.ts`

### Schéma
```typescript
const recordStudyResultSchema = z.object({
  flashcardId: z.string().uuid(),
  isCorrect: z.boolean(),
  responseTime: z.number().positive().optional(),
})
```

### Code
```typescript
export const recordStudyResult = createServerFn('POST')
  .middleware([authMiddleware])
  .validator(recordStudyResultSchema)
  .handler(async ({ context, data }) => {
    await db.insert(studySessions).values({
      flashcardId: data.flashcardId,
      userId: context.user.id,
      isCorrect: data.isCorrect,
      responseTime: data.responseTime,
    })

    return { success: true }
  })
```

### Optimistic update
Côté client, ne pas attendre la réponse pour passer à la carte suivante.

### Validation
- [ ] Insertion en base
- [ ] Temps de réponse enregistré
- [ ] Pas de blocage UI

---

## Tâche 5.6 : Composant StudyProgress

### Description
Barre de progression avec compteurs.

### Agent
`study-agent`

### Fichier à créer
- `src/components/study/StudyProgress.tsx`

### Props
```typescript
interface StudyProgressProps {
  current: number
  total: number
  correct: number
  wrong: number
}
```

### Affichage
- Texte "Carte X sur Y"
- Barre de progression (largeur = current/total)
- Compteurs correct (vert) et incorrect (rouge)

### Validation
- [ ] Mise à jour à chaque carte
- [ ] Animation fluide de la barre

---

## Tâche 5.7 : Écran fin de session + résumé

### Description
Écran affiché à la fin d'une session avec statistiques.

### Agent
`study-agent`

### Fichier à créer
- `src/components/study/StudyComplete.tsx`

### Props
```typescript
interface StudyCompleteProps {
  stats: {
    correct: number
    wrong: number
    avgTime: number
    total: number
  }
  flashcards: Flashcard[]
  results: StudyResult[]
}
```

### Structure
```
┌─────────────────────────────────────────┐
│              🎉                          │
│        Session terminée !                │
│        Excellent travail !               │
│                                         │
│   ┌─────┐   ┌─────┐   ┌─────┐          │
│   │  7  │   │  3  │   │ 70% │          │
│   │Corr.│   │Incor│   │Réus.│          │
│   └─────┘   └─────┘   └─────┘          │
│                                         │
│   [Nouvelle session]  [Dashboard]       │
│                                         │
│   À réviser (3)                         │
│   - Question 1... → Réponse 1          │
│   - Question 2... → Réponse 2          │
│   - Question 3... → Réponse 3          │
└─────────────────────────────────────────┘
```

### Éléments
- Emoji selon le taux de réussite
- Message encourageant
- Statistiques en cartes
- Actions (nouvelle session, dashboard)
- Liste des cartes incorrectes (pour référence)

### Validation
- [ ] Statistiques correctes
- [ ] Message adapté au score
- [ ] Navigation fonctionnelle
- [ ] Liste des erreurs affichée

---

## CSS globals.css (ajouts)

```css
/* Animations 3D pour le flip */
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

## Checklist Phase 5

- [ ] 5.1 Route /study avec sélection
- [ ] 5.2 TopicSelector fonctionnel
- [ ] 5.3 SwipeableCard avec animations
- [ ] 5.4 Route /study/session active
- [ ] 5.5 recordStudyResult enregistre
- [ ] 5.6 StudyProgress affiche la progression
- [ ] 5.7 StudyComplete avec résumé

## Tests à effectuer
- [ ] Sélection thématiques → session
- [ ] Cartes mélangées à chaque session
- [ ] Flip au clic fonctionne
- [ ] Swipe droite = correct
- [ ] Swipe gauche = incorrect
- [ ] Données en base après session
- [ ] Écran de fin correct

## Prochaine Phase
→ Phase 6 : Mode Révision
