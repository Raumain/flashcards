# 📐 MedFlash V2 - Architecture Technique

## Vue d'Ensemble

MedFlash V2 transforme l'application de génération de flashcards en une plateforme complète d'apprentissage médical avec gestion de comptes, suivi des progrès et modes d'étude intelligents.

## Stack Technique

### Backend
- **Runtime**: Bun
- **Framework**: TanStack Start (SSR + Server Functions)
- **Authentification**: better-auth + Google OAuth
- **Base de données**: PostgreSQL + Drizzle ORM
- **Validation**: Zod

### Frontend
- **Framework**: TanStack Start + TanStack Router
- **État serveur**: TanStack Query
- **Formulaires**: TanStack Form + Zod
- **Graphiques**: Recharts
- **Animations**: Framer Motion (swipe)
- **Styling**: Tailwind CSS v4

### Infrastructure
- **Conteneurisation**: Docker + docker-compose
- **Base de données**: PostgreSQL 16
- **Sessions**: Cookie-based (better-auth)

---

## Architecture Base de Données

### Schéma Entités

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │
│ email           │
│ name            │
│ image           │
│ emailVerified   │
│ createdAt       │
│ updatedAt       │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐     ┌─────────────────┐
│    sessions     │     │    accounts     │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │
│ userId (FK)     │     │ userId (FK)     │
│ token           │     │ providerId      │
│ expiresAt       │     │ providerUserId  │
│ ipAddress       │     │ accessToken     │
│ userAgent       │     │ refreshToken    │
└─────────────────┘     │ expiresAt       │
                        └─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│    thematics    │
├─────────────────┤
│ id (PK)         │
│ userId (FK)     │
│ name            │
│ description     │
│ color           │
│ icon            │
│ pdfName         │
│ createdAt       │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│   flashcards    │
├─────────────────┤
│ id (PK)         │
│ thematicId (FK) │
│ userId (FK)     │
│ front           │ (JSONB: question, imageDesc)
│ back            │ (JSONB: answer, details, imageDesc)
│ category        │
│ difficulty      │
│ createdAt       │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│  study_sessions │
├─────────────────┤
│ id (PK)         │
│ flashcardId(FK) │
│ userId (FK)     │
│ isCorrect       │
│ responseTime    │ (ms)
│ studiedAt       │
└─────────────────┘
```

### Tables Détaillées

#### users
Table gérée par better-auth. Contient les informations utilisateur de base.

#### accounts
Liens OAuth (Google, GitHub, etc.) vers les comptes utilisateurs.

#### sessions
Gestion des sessions actives avec tokens sécurisés.

#### thematics
Regroupement des flashcards par thématique extraite du PDF.
- `name`: Nom de la thématique (ex: "Anatomie du cœur")
- `pdfName`: Nom du fichier PDF source
- `color`: Code couleur pour l'affichage
- `icon`: Emoji ou icône

#### flashcards
Les flashcards générées par l'IA.
- `front`: JSON contenant question et description image optionnelle
- `back`: JSON contenant réponse, détails et description image optionnelle
- `difficulty`: easy | medium | hard

#### study_sessions
Historique de chaque interaction utilisateur avec une flashcard.
- `isCorrect`: true = swipe droite, false = swipe gauche
- `responseTime`: Temps de réponse en millisecondes

---

## Architecture Authentification

### Flow OAuth Google

```
┌─────────┐     ┌──────────────┐     ┌─────────────┐
│ Client  │────▶│ /auth/google │────▶│   Google    │
└─────────┘     └──────────────┘     │   OAuth     │
                                      └──────┬──────┘
                                             │
                                             ▼
┌─────────┐     ┌──────────────┐     ┌─────────────┐
│ Client  │◀────│ /auth/callback│◀────│   Token     │
│ (cookie)│     │ Set Cookie   │     │   Exchange  │
└─────────┘     └──────────────┘     └─────────────┘
```

### Protection des Routes

```typescript
// Middleware de protection
const protectedRoutes = ['/dashboard', '/study', '/revision', '/api/*']

// Routes publiques
const publicRoutes = ['/', '/signin', '/signup', '/auth/*']
```

### Configuration better-auth

```typescript
// src/lib/auth.ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24, // Rafraîchir chaque jour
  },
})
```

---

## Architecture des Fonctionnalités

### 1. Espace Personnel

```
/dashboard
├── /                    → Vue d'ensemble + métriques
├── /flashcards          → Toutes les flashcards groupées par thématique
├── /flashcards/:id      → Détail d'une thématique
└── /settings            → Paramètres du compte
```

### 2. Mode Étude

```
/study
├── /                    → Sélection des thématiques
└── /session             → Session d'étude active
    └── Swipe gauche/droite
```

**Logique de session:**
1. L'utilisateur sélectionne une ou plusieurs thématiques
2. Les flashcards sont mélangées aléatoirement
3. Chaque carte affiche la question
4. L'utilisateur réfléchit, puis révèle la réponse
5. Swipe droite = correct, gauche = incorrect
6. Chaque interaction est enregistrée dans `study_sessions`

### 3. Mode Révision

```
/revision
├── /                    → Configuration (seuil d'erreurs)
└── /session             → Session de révision
```

**Logique de sélection:**
```sql
SELECT f.* FROM flashcards f
JOIN study_sessions ss ON f.id = ss.flashcard_id
WHERE ss.user_id = :userId
  AND ss.is_correct = false
GROUP BY f.id
HAVING COUNT(*) >= :threshold  -- Par défaut: 3
ORDER BY COUNT(*) DESC, MAX(ss.studied_at) ASC
```

### 4. Dashboard Métriques

**Métriques calculées:**
- Total flashcards générées
- Total sessions d'étude
- Taux de réussite global (%)
- Taux de réussite par thématique
- Évolution sur les 7/30 derniers jours
- Flashcards les plus difficiles (top 10)
- Temps moyen de réponse
- Streak d'étude (jours consécutifs)

**Graphiques:**
- Courbe de progression (réussite dans le temps)
- Camembert répartition par thématique
- Barres comparatives par difficulté
- Heatmap des jours d'étude

---

## Structure des Dossiers V2

```
src/
├── routes/
│   ├── __root.tsx
│   ├── index.tsx                    # Landing page
│   ├── signin.tsx                   # Page connexion
│   ├── signup.tsx                   # Page inscription
│   ├── dashboard/
│   │   ├── index.tsx                # Dashboard principal
│   │   ├── flashcards/
│   │   │   ├── index.tsx            # Liste thématiques
│   │   │   └── $thematicId.tsx      # Détail thématique
│   │   └── settings.tsx             # Paramètres
│   ├── study/
│   │   ├── index.tsx                # Sélection thématiques
│   │   └── session.tsx              # Session d'étude
│   └── revision/
│       ├── index.tsx                # Configuration révision
│       └── session.tsx              # Session révision
├── components/
│   ├── auth/
│   │   ├── SignInForm.tsx
│   │   ├── SignUpForm.tsx
│   │   ├── SocialButtons.tsx
│   │   └── index.ts
│   ├── dashboard/
│   │   ├── StatsCards.tsx
│   │   ├── ProgressChart.tsx
│   │   ├── ThematicPieChart.tsx
│   │   ├── DifficultyBars.tsx
│   │   ├── StudyHeatmap.tsx
│   │   └── index.ts
│   ├── flashcards/
│   │   ├── FlashcardGrid.tsx
│   │   ├── FlashcardItem.tsx
│   │   ├── ThematicCard.tsx
│   │   └── index.ts
│   ├── study/
│   │   ├── TopicSelector.tsx
│   │   ├── SwipeableCard.tsx
│   │   ├── StudyProgress.tsx
│   │   └── index.ts
│   ├── ui/
│   │   └── ... (composants génériques)
│   └── layout/
│       ├── Navbar.tsx
│       ├── Sidebar.tsx
│       ├── UserMenu.tsx
│       └── index.ts
├── lib/
│   ├── auth.ts                      # Configuration better-auth
│   ├── auth-client.ts               # Client-side auth helpers
│   ├── db/
│   │   ├── index.ts                 # Connexion Drizzle
│   │   ├── schema.ts                # Schéma complet
│   │   └── migrations/              # Fichiers migration
│   ├── gemini.ts
│   ├── pdf-processor.ts
│   ├── pdf-generator.ts
│   └── prompts/
│       └── flashcard-generator.ts
├── server/
│   ├── functions/
│   │   ├── generate.ts              # Génération flashcards
│   │   ├── flashcards.ts            # CRUD flashcards
│   │   ├── thematics.ts             # CRUD thématiques
│   │   ├── study.ts                 # Sessions d'étude
│   │   └── metrics.ts               # Calcul métriques
│   └── middleware/
│       └── auth.ts                  # Middleware auth
└── styles/
    └── globals.css
```

---

## API Endpoints (Server Functions)

### Authentification
| Endpoint | Méthode | Description |
|----------|---------|-------------|
| /api/auth/* | ALL | Géré par better-auth |

### Flashcards
| Endpoint | Méthode | Description |
|----------|---------|-------------|
| generateFlashcards | POST | Générer depuis PDF |
| getFlashcardsByThematic | GET | Liste par thématique |
| deleteFlashcard | DELETE | Supprimer une carte |

### Thématiques
| Endpoint | Méthode | Description |
|----------|---------|-------------|
| getThematics | GET | Liste thématiques user |
| createThematic | POST | Créer thématique |
| updateThematic | PUT | Modifier thématique |
| deleteThematic | DELETE | Supprimer + flashcards |

### Sessions d'étude
| Endpoint | Méthode | Description |
|----------|---------|-------------|
| recordStudyResult | POST | Enregistrer résultat |
| getStudyHistory | GET | Historique sessions |
| getRevisionCards | GET | Cartes à réviser |

### Métriques
| Endpoint | Méthode | Description |
|----------|---------|-------------|
| getDashboardMetrics | GET | Toutes métriques |
| getProgressOverTime | GET | Évolution temporelle |
| getDifficultCards | GET | Top cartes difficiles |

---

## Variables d'Environnement V2

```env
# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/medflash

# Authentification
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000

# OAuth Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# API Gemini
GOOGLE_API_KEY=your-gemini-api-key

# Application
NODE_ENV=development
```

---

## Règles de Développement

### TypeScript Strict
- Pas de `any`
- Types explicites pour les props
- Zod pour la validation runtime

### Conventions de Nommage
- Composants: PascalCase
- Fichiers routes: kebab-case
- Fonctions utilitaires: camelCase
- Tables DB: snake_case

### Performance
- Lazy loading des routes
- Pagination des flashcards (20/page)
- Optimistic updates pour les swipes
- Cache TanStack Query (5 min stale time)

### Sécurité
- CSRF protection (better-auth)
- Rate limiting sur /api/generate
- Sanitization des entrées
- Sessions httpOnly, secure, sameSite
