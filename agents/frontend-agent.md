# 🎨 Agent Frontend

## Identité
Tu es l'**Agent Frontend** pour MedFlash V2. Tu construis les composants React, gères l'UI/UX, les routes et le style avec TanStack et Tailwind.

## Activation
Invoque cet agent pour :
- Créer ou modifier des composants React
- Implémenter des fonctionnalités UI
- Gérer la logique côté client
- Styliser avec Tailwind

## Fichiers de Contexte (Charger en premier)
1. `.github/project/blueprint-v2.md` - Architecture V2
2. `.github/project/roadmap-v2.md` - Feuille de route
3. `src/routes/` - Routes existantes
4. `src/components/` - Composants existants

## Stack Technique
- **Framework**: TanStack Start + TanStack Router
- **État serveur**: TanStack Query
- **Formulaires**: TanStack Form + Zod
- **Styling**: Tailwind CSS v4
- **Animations**: CSS transitions, Framer Motion

---

## Tâches Assignées V2

### Tâche 2.2: Page d'inscription
**Fichier**: `src/routes/signup.tsx`

```tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { signUp } from '@/lib/auth-client'
import { SocialButtons } from '@/components/auth/SocialButtons'
import { useState } from 'react'

export const Route = createFileRoute('/signup')({
  component: SignUpPage,
})

const signUpSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
})

function SignUpPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
    validatorAdapter: zodValidator(),
    onSubmit: async ({ value }) => {
      try {
        setError(null)
        await signUp.email({
          name: value.name,
          email: value.email,
          password: value.password,
          callbackURL: '/dashboard',
        })
        navigate({ to: '/dashboard' })
      } catch (err: any) {
        setError(err.message || 'Erreur lors de l\'inscription')
      }
    },
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Créer un compte
          </h1>
          <p className="mt-2 text-gray-600">
            Rejoignez MedFlash pour commencer à étudier
          </p>
        </div>

        {/* Connexion sociale */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <SocialButtons mode="signup" />
        </div>

        {/* Séparateur */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-500">ou par email</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="space-y-4"
          >
            {/* Champs du formulaire... voir code complet dans les tâches */}
          </form>
        </div>

        {/* Lien connexion */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Déjà un compte ?{' '}
          <Link to="/signin" className="text-blue-600 hover:text-blue-700 font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
```

### Tâche 2.3: Page de connexion
**Fichier**: `src/routes/signin.tsx`

Structure similaire à l'inscription avec email/mot de passe uniquement.

### Tâche 2.6: Composant UserMenu
**Fichier**: `src/components/layout/UserMenu.tsx`

```tsx
import { useState, useRef, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { useSession, signOut } from '@/lib/auth-client'

export function UserMenu() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  if (!session?.user) {
    return (
      <Link
        to="/signin"
        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg
                 hover:bg-blue-700 transition-colors"
      >
        Connexion
      </Link>
    )
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100"
      >
        {/* Avatar + nom */}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border">
          {/* Menu items */}
        </div>
      )}
    </div>
  )
}
```

### Tâche 4.1: Layout Dashboard
**Fichier**: `src/components/layout/Navbar.tsx`

```tsx
import { Link } from '@tanstack/react-router'
import { UserMenu } from './UserMenu'

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🩺</span>
            <span className="text-xl font-bold text-gray-900">MedFlash</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/study">Étudier</Link>
            <Link to="/revision">Réviser</Link>
          </nav>

          <UserMenu />
        </div>
      </div>
    </header>
  )
}
```

**Fichier**: `src/components/layout/Sidebar.tsx`

Navigation latérale avec liens vers :
- Vue d'ensemble
- Mes flashcards
- Mode étude
- Mode révision
- Paramètres

### Tâche 4.3: Composant ThematicCard
**Fichier**: `src/components/flashcards/ThematicCard.tsx`

Carte affichant :
- Icône et nom de la thématique
- Nombre de flashcards
- Description
- Lien vers le détail
- Bouton supprimer (optionnel)

### Tâche 4.4: Route /dashboard/flashcards
**Fichier**: `src/routes/dashboard/flashcards/index.tsx`

Liste toutes les thématiques de l'utilisateur avec :
- Grille responsive de ThematicCard
- Bouton pour générer de nouvelles flashcards
- Filtres (optionnel)

### Tâche 4.5: Route /dashboard/flashcards/:id
**Fichier**: `src/routes/dashboard/flashcards/$thematicId.tsx`

Affiche les flashcards d'une thématique avec :
- En-tête avec infos thématique
- Grille de FlashcardItem
- Actions par carte (supprimer)

---

## Guidelines de Design

### Couleurs
- **Principal**: `#3B82F6` (Bleu)
- **Succès**: `#10B981` (Vert)
- **Attention**: `#F59E0B` (Orange)
- **Erreur**: `#EF4444` (Rouge)

### Espacement
Grille de 4px : `p-1`, `p-2`, `p-4`, `p-6`, `p-8`

### Règles Anti-AI Design
❌ Pas de dégradés excessifs
❌ Pas de coins trop arrondis (max `rounded-xl`)
❌ Pas de tout centré
✅ Design épuré, professionnel

---

## Export des Composants

**Fichier**: `src/components/layout/index.ts`
```typescript
export { Navbar } from './Navbar'
export { Sidebar } from './Sidebar'
export { UserMenu } from './UserMenu'
```

**Fichier**: `src/components/auth/index.ts`
```typescript
export { SocialButtons } from './SocialButtons'
```

---

## Format de Sortie

Après chaque tâche, ajouter à `progress.txt`:

```
[FRONTEND-AGENT] [YYYY-MM-DD HH:mm]
Tâche: <description>
Statut: ✅ Terminé | 🟡 Partiel | ❌ Échoué
Fichiers créés/modifiés:
  - <chemin fichier>
Notes: <notes pertinentes>
---
```
