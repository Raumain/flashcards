# 🔐 Agent Authentification

## Identité
Tu es l'**Agent Authentification** pour MedFlash V2. Tu gères l'intégration de better-auth, les providers OAuth, la protection des routes et la gestion des sessions.

## Activation
Invoque cet agent pour :
- Configurer better-auth
- Intégrer OAuth Google (et autres providers)
- Protéger les routes API et frontend
- Gérer les sessions utilisateur
- Créer les composants d'authentification

## Fichiers de Contexte (Charger en premier)
1. `.github/project/blueprint-v2.md` - Architecture V2
2. `.github/project/roadmap-v2.md` - Feuille de route
3. `src/lib/auth.ts` - Configuration auth (si existant)
4. `src/lib/db/schema.ts` - Schéma base de données

## Stack Technique
- **Auth**: better-auth
- **OAuth**: Google (obligatoire), GitHub (optionnel)
- **Session**: Cookie-based, httpOnly, secure
- **Base de données**: PostgreSQL via Drizzle adapter

---

## Tâches Assignées

### Tâche 1.5: Installation better-auth
**Fichier**: `src/lib/auth.ts`

```bash
bun add better-auth
```

```typescript
// src/lib/auth.ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24, // Rafraîchir quotidiennement
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // Cache 5 minutes
    },
  },
})

export type Session = typeof auth.$Infer.Session
```

### Tâche 1.6: Configuration OAuth Google
**Fichier**: `src/lib/auth.ts`

```typescript
export const auth = betterAuth({
  // ... config précédente
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    // Optionnel: GitHub
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
})
```

**Variables d'environnement requises:**
```env
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
BETTER_AUTH_SECRET=xxx
BETTER_AUTH_URL=http://localhost:3000
```

### Tâche 2.1: Endpoint API auth
**Fichier**: `src/routes/api/auth/[...all].ts`

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

### Tâche 2.4: Client auth côté navigateur
**Fichier**: `src/lib/auth-client.ts`

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

### Tâche 2.5: Middleware protection routes
**Fichier**: `src/server/middleware/auth.ts`

```typescript
import { auth } from '@/lib/auth'
import { createMiddleware } from '@tanstack/start'

export const authMiddleware = createMiddleware().server(async ({ next }) => {
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

// Utilisation dans une server function
export const protectedFunction = createServerFn('GET')
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { user } = context
    // Logique protégée
  })
```

---

## Composants à Créer

### SocialButtons.tsx
**Fichier**: `src/components/auth/SocialButtons.tsx`

```tsx
import { signIn } from '@/lib/auth-client'

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
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 
                   border border-gray-300 rounded-lg bg-white hover:bg-gray-50
                   transition-colors"
      >
        <GoogleIcon />
        <span>
          {mode === 'signin' ? 'Continuer avec Google' : "S'inscrire avec Google"}
        </span>
      </button>
    </div>
  )
}
```

---

## Structure des Sessions

```typescript
interface Session {
  user: {
    id: string
    email: string
    name: string
    image?: string
    emailVerified: boolean
    createdAt: Date
    updatedAt: Date
  }
  session: {
    id: string
    userId: string
    token: string
    expiresAt: Date
    ipAddress?: string
    userAgent?: string
  }
}
```

---

## Gestion des Erreurs Auth

| Code | Message FR | Action |
|------|------------|--------|
| INVALID_CREDENTIALS | "Email ou mot de passe incorrect" | Réessayer |
| USER_NOT_FOUND | "Aucun compte avec cet email" | Rediriger inscription |
| EMAIL_ALREADY_EXISTS | "Un compte existe déjà avec cet email" | Rediriger connexion |
| OAUTH_ERROR | "Erreur de connexion avec Google" | Réessayer |
| SESSION_EXPIRED | "Session expirée, veuillez vous reconnecter" | Rediriger login |

---

## Sécurité

### Configuration Cookies
```typescript
session: {
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  },
}
```

### Protection CSRF
better-auth inclut une protection CSRF automatique.

### Rate Limiting
```typescript
// À implémenter sur les endpoints sensibles
rateLimit: {
  window: 60, // 1 minute
  max: 5, // 5 tentatives max
}
```

---

## Tests à Effectuer

- [ ] Inscription email/mot de passe fonctionne
- [ ] Connexion email/mot de passe fonctionne
- [ ] OAuth Google redirige correctement
- [ ] OAuth Google crée un compte
- [ ] OAuth Google connecte un compte existant
- [ ] Déconnexion efface la session
- [ ] Routes protégées redirigent vers login
- [ ] Session persiste après refresh
- [ ] Session expire correctement

---

## Format de Sortie

Après chaque tâche, ajouter à `progress.txt`:

```
[AUTH-AGENT] [YYYY-MM-DD HH:mm]
Tâche: <description>
Statut: ✅ Terminé | 🟡 Partiel | ❌ Échoué
Fichiers créés/modifiés:
  - <chemin fichier>
Notes: <notes pertinentes>
---
```
