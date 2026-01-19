# 📋 Phase 4 : Espace Personnel

## Vue d'ensemble
**Durée estimée**: 3-4 jours  
**Agents impliqués**: frontend-agent  
**Objectif**: Interface utilisateur principale avec navigation et gestion des flashcards

---

## Tâche 4.1 : Layout Dashboard (Navbar, Sidebar)

### Description
Créer le layout de base avec navigation en-tête et barre latérale.

### Agent
`frontend-agent`

### Fichiers à créer
- `src/components/layout/Navbar.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/index.ts`

### Navbar
Structure :
- Logo MedFlash (🩺 + texte)
- Navigation principale (Desktop) :
  - Dashboard
  - Étudier
  - Réviser
- UserMenu (tâche 2.6)

### Sidebar
Navigation :
- 📊 Vue d'ensemble (`/dashboard`)
- 📚 Mes flashcards (`/dashboard/flashcards`)
- 🎯 Mode étude (`/study`)
- 🔄 Mode révision (`/revision`)
- ⚙️ Paramètres (`/dashboard/settings`)

### Active state
Utiliser `useMatchRoute` pour styliser le lien actif.

### Responsive
- Desktop : Sidebar visible
- Mobile : Sidebar cachée, menu hamburger dans Navbar

### Validation
- [ ] Navbar affichée sur toutes les pages dashboard
- [ ] Sidebar avec liens actifs
- [ ] Navigation fonctionnelle

---

## Tâche 4.2 : Route /dashboard

### Description
Page d'accueil du dashboard avec vue d'ensemble.

### Agent
`frontend-agent`

### Fichier à créer
- `src/routes/dashboard/index.tsx`

### Structure de la page
```
┌─────────────────────────────────────────┐
│ Navbar                                  │
├──────────┬──────────────────────────────┤
│          │ Bienvenue, [Nom] !           │
│ Sidebar  │                              │
│          │ ┌─────┐ ┌─────┐ ┌─────┐      │
│          │ │ KPI │ │ KPI │ │ KPI │      │
│          │ └─────┘ └─────┘ └─────┘      │
│          │                              │
│          │ [Actions rapides]            │
│          │ - Générer des flashcards     │
│          │ - Commencer une session      │
│          │                              │
│          │ [Thématiques récentes]       │
└──────────┴──────────────────────────────┘
```

### Composants utilisés
- StatsCards (Phase 7)
- ThematicCard (aperçu 3-4 dernières)
- Boutons d'action rapide

### Données à afficher
- Nombre total de flashcards
- Nombre de thématiques
- Sessions d'étude récentes

### Validation
- [ ] Page accessible à `/dashboard`
- [ ] Layout avec Navbar + Sidebar
- [ ] Actions rapides fonctionnelles

---

## Tâche 4.3 : Composant ThematicCard

### Description
Carte affichant une thématique avec ses informations.

### Agent
`frontend-agent`

### Fichier à créer
- `src/components/flashcards/ThematicCard.tsx`

### Props
```typescript
interface ThematicCardProps {
  thematic: {
    id: string
    name: string
    description: string | null
    color: string
    icon: string
    pdfName: string | null
    flashcardCount: number
  }
  onDelete?: () => void
}
```

### Structure
```
┌────────────────────────────────────┐
│ [Icon] Nom de la thématique    [X] │
│        42 flashcards               │
│                                    │
│ Description courte si présente...  │
│                                    │
│ fichier.pdf          Voir cartes → │
└────────────────────────────────────┘
```

### Styles
- Fond blanc, bordure grise
- Hover : ombre plus prononcée
- Icon avec fond coloré semi-transparent
- Bouton supprimer visible au hover

### Validation
- [ ] Affichage correct
- [ ] Lien vers détail
- [ ] Bouton supprimer (si callback fourni)

---

## Tâche 4.4 : Route /dashboard/flashcards

### Description
Liste de toutes les thématiques de l'utilisateur.

### Agent
`frontend-agent`

### Fichier à créer
- `src/routes/dashboard/flashcards/index.tsx`

### Structure
```
┌─────────────────────────────────────────┐
│ Mes Flashcards           [+ Générer]    │
│                                         │
│ ┌─────────────┐ ┌─────────────┐        │
│ │ Thématique 1│ │ Thématique 2│        │
│ └─────────────┘ └─────────────┘        │
│ ┌─────────────┐ ┌─────────────┐        │
│ │ Thématique 3│ │ Thématique 4│        │
│ └─────────────┘ └─────────────┘        │
│                                         │
│ [État vide si aucune thématique]        │
└─────────────────────────────────────────┘
```

### Fonctionnalités
- Grille responsive (1-2-3 colonnes)
- Bouton "Générer" ouvre le modal/page d'upload
- État vide avec message encourageant
- Suppression avec confirmation

### Query TanStack
```typescript
const { data: thematics, isLoading } = useQuery({
  queryKey: ['thematics'],
  queryFn: () => getThematics(),
})
```

### Validation
- [ ] Liste des thématiques affichée
- [ ] Grille responsive
- [ ] Suppression avec confirmation
- [ ] État vide géré

---

## Tâche 4.5 : Route /dashboard/flashcards/:id

### Description
Détail d'une thématique avec toutes ses flashcards.

### Agent
`frontend-agent`

### Fichier à créer
- `src/routes/dashboard/flashcards/$thematicId.tsx`

### Structure
```
┌─────────────────────────────────────────┐
│ ← Retour                                │
│                                         │
│ [Icon] Nom de la thématique             │
│ Description de la thématique            │
│ 42 flashcards • fichier.pdf             │
│                                         │
│ [Commencer l'étude]  [Télécharger PDF]  │
│                                         │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │ Card 1  │ │ Card 2  │ │ Card 3  │    │
│ └─────────┘ └─────────┘ └─────────┘    │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │ Card 4  │ │ Card 5  │ │ Card 6  │    │
│ └─────────┘ └─────────┘ └─────────┘    │
└─────────────────────────────────────────┘
```

### En-tête
- Bouton retour
- Infos thématique (icon, nom, description)
- Métadonnées (nombre de cartes, fichier source)
- Actions (étudier, télécharger)

### Grille de flashcards
- FlashcardItem avec aperçu question
- Pagination ou scroll infini si beaucoup

### Validation
- [ ] Infos thématique affichées
- [ ] Liste des flashcards
- [ ] Bouton étudier → /study avec thématique sélectionnée
- [ ] Télécharger PDF fonctionne

---

## Tâche 4.6 : Composant FlashcardGrid amélioré

### Description
Améliorer le composant existant pour la V2.

### Agent
`frontend-agent`

### Fichier à modifier
- `src/components/flashcards/FlashcardGrid.tsx`

### Améliorations
- Pagination (20 cartes par page)
- Tri (date, difficulté)
- Filtre par catégorie
- Sélection multiple pour actions groupées

### Props
```typescript
interface FlashcardGridProps {
  flashcards: Flashcard[]
  onDelete?: (id: string) => void
  onSelect?: (ids: string[]) => void
  selectable?: boolean
}
```

### Validation
- [ ] Pagination fonctionnelle
- [ ] Filtres appliqués
- [ ] Sélection multiple (optionnel)

---

## Tâche 4.7 : Actions supprimer flashcard/thématique

### Description
Implémenter la suppression avec confirmation.

### Agent
`frontend-agent`

### Composant de confirmation
```tsx
function DeleteConfirmation({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message 
}: Props) {
  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{message}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={onConfirm} variant="destructive">
          Supprimer
        </Button>
      </DialogActions>
    </Dialog>
  )
}
```

### Mutations TanStack Query
```typescript
const deleteMutation = useMutation({
  mutationFn: deleteThematic,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['thematics'] })
    toast.success('Thématique supprimée')
  },
})
```

### Messages de confirmation
- Thématique : "Supprimer cette thématique ? Toutes les flashcards associées seront également supprimées."
- Flashcard : "Supprimer cette flashcard ?"

### Validation
- [ ] Modal de confirmation s'affiche
- [ ] Suppression effective après confirmation
- [ ] Liste rafraîchie automatiquement
- [ ] Toast de succès

---

## Checklist Phase 4

- [ ] 4.1 Layout Navbar + Sidebar
- [ ] 4.2 Page /dashboard
- [ ] 4.3 Composant ThematicCard
- [ ] 4.4 Route /dashboard/flashcards
- [ ] 4.5 Route /dashboard/flashcards/:id
- [ ] 4.6 FlashcardGrid amélioré
- [ ] 4.7 Suppression avec confirmation

## Tests à effectuer
- [ ] Navigation fluide entre pages
- [ ] Liste des thématiques correcte
- [ ] Détail d'une thématique
- [ ] Suppression thématique → cascade
- [ ] Responsive mobile

## Prochaine Phase
→ Phase 5 : Mode Étude
