# 📋 Phase 2 : Authentification

## Vue d'ensemble
**Durée estimée**: 3-4 jours  
**Agents impliqués**: auth-agent, frontend-agent  
**Objectif**: Système de connexion complet avec OAuth Google

---

## Tâche 2.1 : Endpoint API auth better-auth

### Description
Créer l'endpoint API qui gère toutes les routes d'authentification.

### Agent
`auth-agent`

### Fichier à créer
- `src/routes/api/auth/[...all].ts`

### Code
```typescript
import { auth } from '@/lib/auth'

export const APIRoute = {
  GET: async (request: Request) => {
    return auth.handler(request)
  },
  POST: async (request: Request) => {
    return auth.handler(request)
  },
}
```

### Routes gérées automatiquement
- `POST /api/auth/sign-up` - Inscription
- `POST /api/auth/sign-in/email` - Connexion email
- `GET /api/auth/sign-in/google` - Début OAuth Google
- `GET /api/auth/callback/google` - Callback OAuth
- `POST /api/auth/sign-out` - Déconnexion
- `GET /api/auth/session` - Récupérer session

### Validation
- [ ] Endpoint accessible
- [ ] Pas d'erreur 500

---

## Tâche 2.2 : Page d'inscription

### Description
Créer la page d'inscription avec formulaire et boutons sociaux.

### Agent
`frontend-agent`

### Fichier à créer
- `src/routes/signup.tsx`

### Composants nécessaires
- Formulaire avec TanStack Form
- Champs : Nom, Email, Mot de passe
- Validation Zod
- SocialButtons (tâche 2.4)

### Validation du formulaire
```typescript
const signUpSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
})
```

### Design
- Centré verticalement et horizontalement
- Carte blanche avec ombre subtile
- Boutons sociaux en haut
- Séparateur "ou par email"
- Lien vers connexion en bas

### Validation
- [ ] Formulaire s'affiche
- [ ] Validation fonctionne
- [ ] Inscription réussie redirige vers /dashboard
- [ ] Erreurs affichées en français

---

## Tâche 2.3 : Page de connexion

### Description
Créer la page de connexion avec formulaire et boutons sociaux.

### Agent
`frontend-agent`

### Fichier à créer
- `src/routes/signin.tsx`

### Structure similaire à inscription
- Champs : Email, Mot de passe uniquement
- SocialButtons
- Lien vers inscription

### Validation
- [ ] Formulaire s'affiche
- [ ] Connexion fonctionne
- [ ] Redirection vers dashboard
- [ ] Message d'erreur si identifiants invalides

---

## Tâche 2.4 : Boutons OAuth (Google)

### Description
Créer le composant de boutons de connexion sociale.

### Agent
`auth-agent`

### Fichiers à créer
- `src/components/auth/SocialButtons.tsx`
- `src/lib/auth-client.ts`

### Client auth (auth-client.ts)
```typescript
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL,
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient
```

### Composant SocialButtons
```tsx
interface SocialButtonsProps {
  mode: 'signin' | 'signup'
}

export function SocialButtons({ mode }: SocialButtonsProps) {
  const handleGoogleSignIn = async () => {
    await signIn.social({
      provider: 'google',
      callbackURL: '/dashboard',
    })
  }

  return (
    <button onClick={handleGoogleSignIn}>
      Continuer avec Google
    </button>
  )
}
```

### Design du bouton Google
- Fond blanc
- Bordure grise
- Logo Google (SVG)
- Texte : "Continuer avec Google" ou "S'inscrire avec Google"

### Validation
- [ ] Bouton cliquable
- [ ] Redirection vers Google
- [ ] Retour avec session active

---

## Tâche 2.5 : Middleware protection routes

### Description
Créer un middleware pour protéger les routes authentifiées.

### Agent
`auth-agent`

### Fichier à créer
- `src/server/middleware/auth.ts`

### Code
```typescript
import { auth } from '@/lib/auth'
import { createMiddleware } from '@tanstack/start'

export const authMiddleware = createMiddleware().server(async ({ next, request }) => {
  const session = await auth.api.getSession({
    headers: request.headers,
  })
  
  if (!session) {
    throw new Error('Non autorisé')
  }
  
  return next({
    context: {
      user: session.user,
      session: session.session,
    },
  })
})
```

### Utilisation
```typescript
export const protectedServerFn = createServerFn('GET')
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { user } = context
    // user.id, user.email, etc.
  })
```

### Routes à protéger
- `/dashboard/*`
- `/study/*`
- `/revision/*`
- Toutes les server functions CRUD

### Validation
- [ ] Accès refusé sans session
- [ ] Context user disponible avec session
- [ ] Redirection vers /signin si non authentifié

---

## Tâche 2.6 : Composant UserMenu

### Description
Menu utilisateur dans la navbar avec avatar et actions.

### Agent
`frontend-agent`

### Fichier à créer
- `src/components/layout/UserMenu.tsx`

### Fonctionnalités
- Avatar (image ou initiale)
- Nom utilisateur
- Menu déroulant au clic :
  - Dashboard
  - Mes flashcards
  - Paramètres
  - Déconnexion

### États
- Non connecté : Bouton "Connexion"
- Connecté : Avatar + menu

### Gestion du clic extérieur
Fermer le menu si clic en dehors.

### Validation
- [ ] Affiche "Connexion" si non connecté
- [ ] Avatar visible si connecté
- [ ] Menu s'ouvre/ferme
- [ ] Déconnexion fonctionne

---

## Tâche 2.7 : Page paramètres compte

### Description
Page pour gérer les informations du compte.

### Agent
`frontend-agent`

### Fichier à créer
- `src/routes/dashboard/settings.tsx`

### Sections
1. **Informations personnelles**
   - Nom (modifiable)
   - Email (lecture seule si OAuth)
   - Avatar (affichage)

2. **Sécurité** (si email/password)
   - Changer le mot de passe

3. **Comptes liés**
   - Liste des providers OAuth connectés

4. **Zone de danger**
   - Supprimer le compte

### Validation
- [ ] Affichage des infos utilisateur
- [ ] Modification du nom fonctionne
- [ ] Suppression du compte (avec confirmation)

---

## Checklist Phase 2

- [ ] 2.1 Endpoint API auth créé
- [ ] 2.2 Page inscription fonctionnelle
- [ ] 2.3 Page connexion fonctionnelle
- [ ] 2.4 OAuth Google opérationnel
- [ ] 2.5 Middleware protection actif
- [ ] 2.6 UserMenu dans la navbar
- [ ] 2.7 Page paramètres créée

## Tests à effectuer
- [ ] Inscription email → dashboard
- [ ] Connexion email → dashboard
- [ ] OAuth Google → dashboard
- [ ] Déconnexion → page accueil
- [ ] Route protégée sans session → signin
- [ ] Session persiste après refresh

## Prochaine Phase
→ Phase 3 : Persistance Flashcards
