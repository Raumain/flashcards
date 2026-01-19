# 📋 Phase 3 : Persistance Flashcards

## Vue d'ensemble
**Durée estimée**: 2-3 jours  
**Agents impliqués**: backend-agent  
**Objectif**: Sauvegarder les flashcards générées en base de données

---

## Tâche 3.1 : Server function saveFlashcards

### Description
Créer une fonction serveur pour sauvegarder des flashcards dans une thématique.

### Agent
`backend-agent`

### Fichier à créer
- `src/server/functions/flashcards.ts`

### Schéma de validation
```typescript
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
```

### Logique
1. Vérifier que la thématique appartient à l'utilisateur
2. Insérer les flashcards avec `thematicId` et `userId`
3. Retourner les cartes insérées

### Validation
- [ ] Insertion réussie
- [ ] Rejet si thématique non trouvée
- [ ] Rejet si non propriétaire

---

## Tâche 3.2 : Extraction thématique par IA

### Description
L'IA extrait automatiquement la thématique du PDF uploadé.

### Agent
`backend-agent`

### Fichier à créer
- `src/lib/prompts/thematic-extractor.ts`

### Prompt
```typescript
export const THEMATIC_EXTRACTION_PROMPT = `
Tu es un expert en éducation médicale. Analyse le contenu de ce PDF.

## Ta tâche
1. Identifie le sujet principal du document
2. Génère un nom court (max 50 caractères)
3. Génère une description (max 200 caractères)
4. Suggère une couleur hex et un emoji

## Format de sortie (JSON uniquement)
{
  "name": "Nom de la thématique",
  "description": "Description courte",
  "color": "#HEX",
  "icon": "emoji"
}
`
```

### Couleurs suggérées par domaine
| Domaine | Couleur |
|---------|---------|
| Anatomie | #EF4444 |
| Physiologie | #3B82F6 |
| Pharmacologie | #10B981 |
| Pathologie | #8B5CF6 |
| Biochimie | #F59E0B |
| Cardiologie | #DC2626 |
| Neurologie | #6366F1 |

### Validation
- [ ] Extraction fonctionne
- [ ] JSON valide retourné
- [ ] Nom pertinent

---

## Tâche 3.3 : Server function getThematics

### Description
Récupérer toutes les thématiques d'un utilisateur avec le nombre de flashcards.

### Agent
`backend-agent`

### Fichier à créer/modifier
- `src/server/functions/thematics.ts`

### Code
```typescript
export const getThematics = createServerFn('GET')
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const userId = context.user.id

    return db
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
  })
```

### Retour attendu
```typescript
interface ThematicWithCount {
  id: string
  name: string
  description: string | null
  color: string
  icon: string
  pdfName: string | null
  createdAt: Date
  flashcardCount: number
}
```

### Validation
- [ ] Liste retournée
- [ ] Compte de flashcards correct
- [ ] Filtre par userId

---

## Tâche 3.4 : Server function getFlashcardsByThematic

### Description
Récupérer les flashcards d'une thématique spécifique.

### Agent
`backend-agent`

### Code
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
```

### Variante pour plusieurs thématiques
```typescript
export const getFlashcardsByThematics = createServerFn('GET')
  .middleware([authMiddleware])
  .validator(z.object({ thematicIds: z.array(z.string().uuid()) }))
  .handler(async ({ context, data }) => {
    return db
      .select()
      .from(flashcards)
      .where(and(
        inArray(flashcards.thematicId, data.thematicIds),
        eq(flashcards.userId, context.user.id)
      ))
  })
```

### Validation
- [ ] Flashcards retournées
- [ ] Filtre par thématique
- [ ] Filtre par utilisateur

---

## Tâche 3.5 : Modification génération pour sauvegarder

### Description
Modifier `generateFlashcards` pour sauvegarder en base après génération.

### Agent
`backend-agent`

### Fichier à modifier
- `src/server/functions/generate.ts`

### Flux mis à jour
1. Valider le fichier PDF
2. Convertir en images
3. **Extraire la thématique (nouveau)**
4. **Créer la thématique en base (nouveau)**
5. Générer les flashcards
6. **Sauvegarder les flashcards en base (nouveau)**
7. Retourner thématique + flashcards

### Retour attendu
```typescript
interface GenerationResult {
  thematic: Thematic
  flashcards: Flashcard[]
  metadata: {
    subject: string
    totalConcepts: number
    recommendations: string
  }
}
```

### Validation
- [ ] Thématique créée en base
- [ ] Flashcards sauvegardées
- [ ] Retour complet

---

## Tâche 3.6 : Server function deleteFlashcard

### Description
Supprimer une flashcard individuelle.

### Agent
`backend-agent`

### Code
```typescript
export const deleteFlashcard = createServerFn('POST')
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ context, data }) => {
    const userId = context.user.id

    const result = await db
      .delete(flashcards)
      .where(and(
        eq(flashcards.id, data.id),
        eq(flashcards.userId, userId)
      ))
      .returning()

    if (result.length === 0) {
      throw new Error('Flashcard non trouvée')
    }

    return { success: true }
  })
```

### Validation
- [ ] Suppression réussie
- [ ] Erreur si non propriétaire
- [ ] Erreur si inexistante

---

## Tâche 3.7 : Server function deleteThematic

### Description
Supprimer une thématique et toutes ses flashcards (cascade).

### Agent
`backend-agent`

### Code
```typescript
export const deleteThematic = createServerFn('POST')
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ context, data }) => {
    const userId = context.user.id

    // La suppression cascade aux flashcards grâce au schéma
    const result = await db
      .delete(thematics)
      .where(and(
        eq(thematics.id, data.id),
        eq(thematics.userId, userId)
      ))
      .returning()

    if (result.length === 0) {
      throw new Error('Thématique non trouvée')
    }

    return { success: true }
  })
```

### Points importants
- La relation `onDelete: 'cascade'` supprime automatiquement les flashcards liées
- Les `study_sessions` sont aussi supprimées par cascade

### Validation
- [ ] Thématique supprimée
- [ ] Flashcards supprimées (cascade)
- [ ] Sessions d'étude supprimées (cascade)

---

## Checklist Phase 3

- [ ] 3.1 saveFlashcards fonctionne
- [ ] 3.2 Extraction thématique par IA
- [ ] 3.3 getThematics retourne la liste
- [ ] 3.4 getFlashcardsByThematic retourne les cartes
- [ ] 3.5 Génération sauvegarde en base
- [ ] 3.6 deleteFlashcard supprime une carte
- [ ] 3.7 deleteThematic supprime en cascade

## Tests à effectuer
- [ ] Upload PDF → thématique + flashcards créées
- [ ] Liste des thématiques affiche le bon compte
- [ ] Détail thématique affiche les flashcards
- [ ] Suppression flashcard individuelle
- [ ] Suppression thématique → toutes les cartes supprimées

## Prochaine Phase
→ Phase 4 : Espace Personnel
