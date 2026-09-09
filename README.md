# CRM Binom

CRM interne de binōm - gestion des clients, projets, tâches (kanban), contacts, devis, factures, paiements et documents.

Stack : Nuxt 4, Nuxt UI v3, Drizzle ORM, Supabase (Postgres), Better Auth, stockage S3-compatible (Garage).

---

## Prérequis

- Node.js 22+
- Un projet Supabase avec les tables créées (`npm run db:migrate`)
- Un bucket sur un stockage S3-compatible (Garage, ou tout autre) pour les documents

---

## Installation

```bash
npm install
cp .env.example .env
```

Renseigner toutes les variables dans `.env` (voir section ci-dessous), puis :

```bash
npm run dev
```

---

## Variables d'environnement

| Variable | Obligatoire | Description |
|---|---|---|
| `DATABASE_URL` | Oui | Connection string Postgres (Supabase **Session pooler** - voir note ci-dessous) |
| `NUXT_S3_ENDPOINT` | Oui | URL de l'endpoint S3-compatible (ex : Garage sur Coolify, ou tout autre) |
| `NUXT_S3_REGION` | Non | Région S3 (accepte une valeur arbitraire pour Garage, ex : `garage`) |
| `NUXT_S3_ACCESS_KEY_ID` | Oui | Access key ID du storage - utilisée côté serveur uniquement |
| `NUXT_S3_SECRET_ACCESS_KEY` | Oui | Secret access key du storage - utilisée côté serveur uniquement |
| `DOCUMENTS_BUCKET` | Oui | Nom du bucket S3 pour les documents (ex : `documents`) |
| `NUXT_PUBLIC_SITE_URL` | Oui | URL publique du site (ex : `http://localhost:3000`) |
| `BETTER_AUTH_SECRET` | Oui | Secret Better Auth (≥32 caractères aléatoires) - `npx @better-auth/cli secret` ou `openssl rand -base64 32` |
| `RESEND_API_KEY` | Oui | Clé API Resend pour l'envoi des emails magic-link |
| `REDIS_URL` | Non | URL Redis pour le rate limiting multi-instance en production (ex : `redis://localhost:6379`) |

> **Note `DATABASE_URL`** : utiliser la connection string **Session pooler** (`aws-0-<region>.pooler.supabase.com:5432`), pas l'hôte direct (`db.<ref>.supabase.co:5432`). L'hôte direct requiert IPv6, ce qui provoque des erreurs DNS sur les réseaux IPv4-only classiques.

---

## Commandes utiles

```bash
npm run dev          # Serveur de développement (http://localhost:3000)
npm run build        # Build de production
npm run start        # Démarrer le build de production
npm run preview      # Prévisualiser le build en local
```

```bash
npm test             # Tests
npm run lint         # ESLint
npm run lint:fix     # ESLint avec auto-fix
npm run typecheck    # TypeScript (vue-tsc)
```

```bash
npm run db:migrate   # Applique les migrations Drizzle sur la base
npm run db:generate  # Génère les fichiers de migration depuis le schéma Drizzle
npm run db:types     # Régénère app/types/database.types.ts depuis le schéma Supabase live
npm run db:studio    # Lance Drizzle Studio (interface DB locale)
```

---

## CI

La CI tourne sur chaque push via `.github/workflows/quality.yml` et exécute dans l'ordre :

1. `npm test`
2. `npm run lint`
3. `npm run typecheck`

**Passer ces trois checks en local avant d'ouvrir une PR.**

---

## Authentification

Connexion par **magic-link uniquement** ([Better Auth](https://www.better-auth.com/), voir `server/lib/better-auth.ts`), envoyé par email via Resend. L'envoi du lien est restreint aux adresses e-mail déjà présentes dans `public.users` (staff) ou correspondant à un contact portail actif (`public.contacts`) - toute autre adresse reçoit le même message de succès générique côté UI (pas de fuite d'existence de compte), mais aucun email n'est réellement envoyé.

Le middleware `server/middleware/01-auth.ts` vérifie la session Better Auth sur toutes les routes `/api/*` sauf `/api/health` et `/api/auth/*` (Better Auth gère l'autorisation de ses propres routes).

Pour ajouter un utilisateur staff : l'insérer dans `public.users` avec les champs `name`, `email` et `role` - pas besoin de renseigner `authUserId`, il se relie automatiquement à la bonne identité Better Auth dès la première connexion réussie.

---

## Documents (stockage S3-compatible)

Les documents sont stockés dans le bucket défini par `DOCUMENTS_BUCKET`, sur l'endpoint S3-compatible défini par `NUXT_S3_ENDPOINT` (Garage en local/staging via Coolify). Le bucket doit exister avant le premier upload. Les URLs signées ont une durée de validité de 1 heure.

---

## Rate limiting

Un rate limiter basé sur l'IP protège toutes les routes `/api/*` : 120 requêtes par minute.

- **Dev / instance unique** : stockage en mémoire (défaut, aucune config).
- **Production multi-instance** : passer sur Redis.
  1. `npm install ioredis`
  2. Définir `REDIS_URL` dans l'environnement.
  3. Dans `nuxt.config.ts`, remplacer la config `rate-limit` par :
     ```ts
     'rate-limit': { driver: 'redis', url: process.env.REDIS_URL }
     ```

---

## Structure serveur

```
server/
  middleware/
    00-rate-limit.ts   # Rate limiting IP (avant auth)
    01-auth.ts         # Vérification token Supabase
  api/                 # Routes API REST (Nitro)
  utils/               # Helpers serveur (auth, erreurs DB, documents)
  lib/                 # Logique métier serveur (upload documents, gestion utilisateurs auth)
```

---

## Structure frontend

```
app/
  types/        # Types domaine partagés (pages, composants, composables)
  validation/   # Schémas Zod et types de payload (validation runtime + inputs API)
  lib/          # Helpers purs sans réactivité Vue
  constants/    # Listes statiques et valeurs de config
  composables/  # État réactif et logique Vue/Nuxt réutilisable
  components/   # Composants Vue
  pages/        # Pages Nuxt (routing fichier)
```

Règle : un type qui décrit uniquement des données UI ou métier va dans `app/types`, pas dans `app/validation`.

---

## Base de données

Le schéma Drizzle est dans `app/db/schema.ts`. Toute modification du schéma requiert :

```bash
npm run db:generate   # Génère la migration
npm run db:migrate    # Applique sur la base cible
npm run db:types      # Resynchronise les types Supabase
npm run typecheck     # Vérifie que le module @nuxtjs/supabase résout correctement
```

---

## Flux de contribution

1. Créer une branche depuis `main` au format `<pseudo>/bin-<N>-<slug>`.
2. Passer les checks locaux (`npm test && npm run lint && npm run typecheck`).
3. Ouvrir une PR vers `main` - la CI vérifie les mêmes checks.

---

## Notes UI/UX

Les règles visuelles pour les colonnes kanban, les cards tâche et les modales sont documentées dans [docs/ui-ux.md](docs/ui-ux.md).
