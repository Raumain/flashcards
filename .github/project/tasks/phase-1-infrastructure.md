# 📋 Phase 1 : Infrastructure

## Vue d'ensemble
**Durée estimée**: 2-3 jours  
**Agents impliqués**: database-agent  
**Objectif**: Mettre en place PostgreSQL, Drizzle ORM et le schéma de base de données

---

## Tâche 1.1 : Configuration PostgreSQL + Docker

### Description
Configurer PostgreSQL 16 avec Docker Compose pour le développement local.

### Agent
`database-agent`

### Fichiers à créer/modifier
- `docker-compose.yml`

### Instructions
1. Créer le service PostgreSQL avec :
   - Image: `postgres:16-alpine`
   - Port: `5432`
   - Volume persistant pour les données
   - Healthcheck pour vérifier la disponibilité

2. Mettre à jour le service `app` pour dépendre de PostgreSQL

### Code attendu
```yaml
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

volumes:
  postgres_data:
```

### Validation
- [ ] `docker compose up postgres` démarre sans erreur
- [ ] `docker compose exec postgres psql -U medflash -d medflash` se connecte
- [ ] Le volume persiste les données après redémarrage

---

## Tâche 1.2 : Installation Drizzle ORM

### Description
Installer et configurer Drizzle ORM pour la gestion de la base de données.

### Agent
`database-agent`

### Commandes
```bash
bun add drizzle-orm postgres
bun add -D drizzle-kit @types/pg
```

### Fichiers à créer
- `drizzle.config.ts`
- `src/lib/db/index.ts`

### Configuration drizzle.config.ts
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

### Configuration connexion
```typescript
// src/lib/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)

export const db = drizzle(client, { schema })
```

### Variables d'environnement
Ajouter à `.env.example` et `.env`:
```env
DATABASE_URL=postgresql://medflash:medflash_secure_password@localhost:5432/medflash
```

### Validation
- [ ] Import de `db` sans erreur
- [ ] Connexion à PostgreSQL réussie

---

## Tâche 1.3 : Création schéma base de données

### Description
Définir toutes les tables nécessaires pour MedFlash V2.

### Agent
`database-agent`

### Fichier à créer
- `src/lib/db/schema.ts`

### Tables à créer

#### Tables better-auth (gérées automatiquement)
- `users` - Informations utilisateur
- `sessions` - Sessions actives
- `accounts` - Liens OAuth
- `verifications` - Tokens de vérification

#### Tables MedFlash
- `thematics` - Thématiques/groupes de flashcards
- `flashcards` - Les flashcards générées
- `study_sessions` - Historique des sessions d'étude

### Schéma détaillé
Voir `database-agent.md` pour le code complet.

### Points importants
- Utiliser `uuid` pour les IDs des tables MedFlash
- Utiliser `text` pour les IDs better-auth (compatibilité)
- JSONB pour `front` et `back` des flashcards
- Indexes sur `userId`, `thematicId`, `studiedAt`
- Cascade delete sur les relations

### Validation
- [ ] Pas d'erreur TypeScript
- [ ] Types exportés correctement
- [ ] Relations bien définies

---

## Tâche 1.4 : Migrations initiales

### Description
Générer et appliquer les migrations pour créer les tables.

### Agent
`database-agent`

### Scripts package.json
Ajouter :
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

### Commandes à exécuter
```bash
# Générer les fichiers de migration
bun run db:generate

# Appliquer directement (dev)
bun run db:push
```

### Validation
- [ ] Migrations générées dans `src/lib/db/migrations/`
- [ ] Tables créées dans PostgreSQL
- [ ] Vérifier avec `bun run db:studio`

---

## Tâche 1.5 : Installation better-auth

### Description
Installer et configurer better-auth pour l'authentification.

### Agent
`auth-agent`

### Commande
```bash
bun add better-auth
```

### Fichier à créer
- `src/lib/auth.ts`

### Configuration de base
```typescript
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
    updateAge: 60 * 60 * 24,
  },
})

export type Session = typeof auth.$Infer.Session
```

### Variables d'environnement
```env
BETTER_AUTH_SECRET=your-secret-key-minimum-32-chars
BETTER_AUTH_URL=http://localhost:3000
```

### Validation
- [ ] Import sans erreur
- [ ] Type Session exporté

---

## Tâche 1.6 : Configuration OAuth Google

### Description
Configurer l'authentification Google OAuth.

### Agent
`auth-agent`

### Prérequis
1. Créer un projet sur [Google Cloud Console](https://console.cloud.google.com)
2. Activer l'API Google+ ou Google Identity
3. Créer des identifiants OAuth 2.0
4. Configurer les URIs de redirection :
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://votre-domaine.com/api/auth/callback/google` (prod)

### Mise à jour auth.ts
```typescript
export const auth = betterAuth({
  // ... config précédente
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
})
```

### Variables d'environnement
```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
```

### Validation
- [ ] Variables configurées
- [ ] Pas d'erreur au démarrage
- [ ] Redirection OAuth fonctionne

---

## Checklist Phase 1

- [ ] 1.1 PostgreSQL + Docker configuré
- [ ] 1.2 Drizzle ORM installé et configuré
- [ ] 1.3 Schéma de base de données créé
- [ ] 1.4 Migrations appliquées
- [ ] 1.5 better-auth installé
- [ ] 1.6 OAuth Google configuré

## Prochaine Phase
→ Phase 2 : Authentification
