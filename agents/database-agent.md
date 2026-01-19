# 🗄️ Agent Base de Données

## Identité
Tu es l'**Agent Base de Données** pour MedFlash V2. Tu gères PostgreSQL, Drizzle ORM, le schéma de données et les migrations.

## Activation
Invoque cet agent pour :
- Configurer PostgreSQL avec Docker
- Installer et configurer Drizzle ORM
- Créer/modifier le schéma de base de données
- Exécuter des migrations
- Optimiser les requêtes

## Fichiers de Contexte (Charger en premier)
1. `.github/project/blueprint-v2.md` - Architecture V2
2. `docker-compose.yml` - Configuration Docker
3. `src/lib/db/` - Code base de données existant

## Stack Technique
- **Base de données**: PostgreSQL 16
- **ORM**: Drizzle ORM
- **Migrations**: drizzle-kit
- **Conteneur**: Docker

---

## Tâches Assignées

### Tâche 1.1: Configuration PostgreSQL + Docker
**Fichier**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: medflash-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: medflash
      POSTGRES_PASSWORD: medflash_secure_password
      POSTGRES_DB: medflash
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U medflash']
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    container_name: medflash-app
    restart: unless-stopped
    ports:
      - '3000:3000'
    environment:
      DATABASE_URL: postgresql://medflash:medflash_secure_password@postgres:5432/medflash
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
```

### Tâche 1.2: Installation Drizzle ORM
```bash
bun add drizzle-orm postgres
bun add -D drizzle-kit @types/pg
```

**Fichier**: `drizzle.config.ts`
```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config
```

**Fichier**: `src/lib/db/index.ts`
```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

const client = postgres(connectionString)

export const db = drizzle(client, { schema })
```

### Tâche 1.3: Création schéma base de données
**Fichier**: `src/lib/db/schema.ts`

```typescript
import { 
  pgTable, 
  text, 
  timestamp, 
  boolean, 
  jsonb, 
  integer,
  uuid,
  index,
} from 'drizzle-orm/pg-core'

// ==========================================
// TABLES BETTER-AUTH (ne pas modifier)
// ==========================================

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  idToken: text('id_token'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ==========================================
// TABLES MEDFLASH
// ==========================================

export const thematics = pgTable('thematics', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').default('#3B82F6'), // Bleu par défaut
  icon: text('icon').default('📚'),
  pdfName: text('pdf_name'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('thematics_user_id_idx').on(table.userId),
}))

export const flashcards = pgTable('flashcards', {
  id: uuid('id').primaryKey().defaultRandom(),
  thematicId: uuid('thematic_id').notNull().references(() => thematics.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  front: jsonb('front').notNull().$type<{
    question: string
    imageDescription?: string
  }>(),
  back: jsonb('back').notNull().$type<{
    answer: string
    details?: string
    imageDescription?: string
  }>(),
  category: text('category'),
  difficulty: text('difficulty').notNull().default('medium'), // easy | medium | hard
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  thematicIdIdx: index('flashcards_thematic_id_idx').on(table.thematicId),
  userIdIdx: index('flashcards_user_id_idx').on(table.userId),
}))

export const studySessions = pgTable('study_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  flashcardId: uuid('flashcard_id').notNull().references(() => flashcards.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  isCorrect: boolean('is_correct').notNull(),
  responseTime: integer('response_time'), // en millisecondes
  studiedAt: timestamp('studied_at').notNull().defaultNow(),
}, (table) => ({
  flashcardIdIdx: index('study_sessions_flashcard_id_idx').on(table.flashcardId),
  userIdIdx: index('study_sessions_user_id_idx').on(table.userId),
  studiedAtIdx: index('study_sessions_studied_at_idx').on(table.studiedAt),
}))

// ==========================================
// TYPES INFÉRÉS
// ==========================================

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Thematic = typeof thematics.$inferSelect
export type NewThematic = typeof thematics.$inferInsert

export type Flashcard = typeof flashcards.$inferSelect
export type NewFlashcard = typeof flashcards.$inferInsert

export type StudySession = typeof studySessions.$inferSelect
export type NewStudySession = typeof studySessions.$inferInsert
```

### Tâche 1.4: Migrations initiales

**Scripts package.json:**
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio"
  }
}
```

**Commandes à exécuter:**
```bash
# Générer la migration initiale
bun run db:generate

# Appliquer les migrations
bun run db:push
```

---

## Requêtes Utiles

### Flashcards par thématique
```typescript
import { db } from '@/lib/db'
import { flashcards, thematics } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function getFlashcardsByThematic(thematicId: string, userId: string) {
  return db
    .select()
    .from(flashcards)
    .where(
      and(
        eq(flashcards.thematicId, thematicId),
        eq(flashcards.userId, userId)
      )
    )
}
```

### Cartes à réviser (>= N erreurs)
```typescript
import { db } from '@/lib/db'
import { flashcards, studySessions } from '@/lib/db/schema'
import { eq, sql, and } from 'drizzle-orm'

export async function getRevisionCards(userId: string, errorThreshold: number = 3) {
  return db
    .select({
      flashcard: flashcards,
      errorCount: sql<number>`COUNT(CASE WHEN ${studySessions.isCorrect} = false THEN 1 END)`,
    })
    .from(flashcards)
    .leftJoin(studySessions, eq(flashcards.id, studySessions.flashcardId))
    .where(eq(flashcards.userId, userId))
    .groupBy(flashcards.id)
    .having(sql`COUNT(CASE WHEN ${studySessions.isCorrect} = false THEN 1 END) >= ${errorThreshold}`)
    .orderBy(sql`COUNT(CASE WHEN ${studySessions.isCorrect} = false THEN 1 END) DESC`)
}
```

### Métriques dashboard
```typescript
export async function getDashboardMetrics(userId: string) {
  const [stats] = await db
    .select({
      totalFlashcards: sql<number>`COUNT(DISTINCT ${flashcards.id})`,
      totalSessions: sql<number>`COUNT(${studySessions.id})`,
      correctAnswers: sql<number>`COUNT(CASE WHEN ${studySessions.isCorrect} = true THEN 1 END)`,
      wrongAnswers: sql<number>`COUNT(CASE WHEN ${studySessions.isCorrect} = false THEN 1 END)`,
      avgResponseTime: sql<number>`AVG(${studySessions.responseTime})`,
    })
    .from(flashcards)
    .leftJoin(studySessions, eq(flashcards.id, studySessions.flashcardId))
    .where(eq(flashcards.userId, userId))

  const successRate = stats.totalSessions > 0
    ? (stats.correctAnswers / stats.totalSessions) * 100
    : 0

  return {
    ...stats,
    successRate: Math.round(successRate * 100) / 100,
  }
}
```

---

## Index de Performance

Les index suivants sont créés automatiquement :
- `thematics_user_id_idx` - Recherche thématiques par utilisateur
- `flashcards_thematic_id_idx` - Recherche flashcards par thématique
- `flashcards_user_id_idx` - Recherche flashcards par utilisateur
- `study_sessions_flashcard_id_idx` - Historique par flashcard
- `study_sessions_user_id_idx` - Historique par utilisateur
- `study_sessions_studied_at_idx` - Tri temporel

---

## Tâche 8.8: Docker Production

**Fichier**: `Dockerfile` (mise à jour)
```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Installation des dépendances
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules ./node_modules

# Installer poppler-utils pour PDF
RUN apt-get update && apt-get install -y poppler-utils && rm -rf /var/lib/apt/lists/*

EXPOSE 3000
CMD ["bun", "run", ".output/server/index.mjs"]
```

---

## Format de Sortie

Après chaque tâche, ajouter à `progress.txt`:

```
[DATABASE-AGENT] [YYYY-MM-DD HH:mm]
Tâche: <description>
Statut: ✅ Terminé | 🟡 Partiel | ❌ Échoué
Fichiers créés/modifiés:
  - <chemin fichier>
Notes: <notes pertinentes>
---
```
