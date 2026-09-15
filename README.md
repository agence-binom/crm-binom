# CRM Binom

CRM interne de binōm - gestion des clients, projets, tâches (kanban), contacts, devis, factures, paiements et documents.

Stack : Nuxt 4, Nuxt UI v4, Drizzle ORM, Postgres 17 auto-hébergé (image `supabase/postgres`, sur Coolify), Better Auth (magic-link), Resend, stockage S3-compatible (Garage).

---

## Prérequis

- Node.js 22+
- Docker (base Postgres de développement, voir `compose.dev.yml`)
- Un bucket sur un stockage S3-compatible (Garage, ou tout autre) pour les documents

---

## Installation

```bash
npm install
cp .env.example .env
```

Renseigner les variables dans `.env` (voir section ci-dessous). `DATABASE_URL` pointe déjà sur la
base locale Docker, et `RESEND_API_KEY` est inutile en local (le magic-link s'affiche dans le
terminal). Ensuite :

```bash
npm run db:up          # Démarre Postgres en local (première fois : pull de l'image, ~1 min)
npm run db:reset:local # Schéma à zéro, migrations Drizzle, jeu de données de test
npm run dev
```

Comptes de test créés par le seed (mot de passe `password123`, connexion par mot de passe
disponible uniquement hors production) : `admin@crmbinom.test`, `employee@crmbinom.test`.

---

## Variables d'environnement

| Variable | Obligatoire | Description |
|---|---|---|
| `DATABASE_URL` | Oui | Connection string Postgres (base locale Docker en dev - voir note ci-dessous) |
| `NUXT_S3_ENDPOINT` | Oui | URL de l'endpoint S3-compatible (ex : Garage sur Coolify, ou tout autre) |
| `NUXT_S3_REGION` | Non | Région S3 (accepte une valeur arbitraire pour Garage, ex : `garage`) |
| `NUXT_S3_ACCESS_KEY_ID` | Oui | Access key ID du storage - utilisée côté serveur uniquement |
| `NUXT_S3_SECRET_ACCESS_KEY` | Oui | Secret access key du storage - utilisée côté serveur uniquement |
| `NUXT_DOCUMENTS_BUCKET` | Oui | Nom du bucket S3 pour les documents (ex : `documents`). |
| `NUXT_PUBLIC_SITE_URL` | Oui | URL publique du site (ex : `http://localhost:3000`) |
| `BETTER_AUTH_SECRET` | Oui | Secret Better Auth (≥32 caractères aléatoires) - `npx @better-auth/cli secret` ou `openssl rand -base64 32` |
| `RESEND_API_KEY` | En prod | Clé API Resend pour l'envoi des emails magic-link. Inutile hors production : le lien est écrit dans le terminal, aucun mail n'est envoyé |
| `REDIS_URL` | Non | URL Redis pour le rate limiting multi-instance en production (ex : `redis://localhost:6379`) |

> **Note `DATABASE_URL`** : le rôle utilisé doit être **le même que celui qui joue les migrations** (`postgres`). Les tables ont RLS activé sans aucune policy (`.enableRLS()` dans `app/db/schema`) : seul leur propriétaire voit les lignes, un autre rôle obtiendrait des résultats vides sans aucune erreur. Voir `scripts/dev-db-init.sql`.

---

## Commandes utiles

```bash
npm run dev          # Serveur de développement (http://localhost:3000)
npm run build        # Build de production
npm run start        # Démarrer le build de production
npm run preview      # Prévisualiser le build en local
```

```bash
npm test             # Tests unitaires (node:test)
npm run test:e2e     # Tests end-to-end (Playwright, démarre son propre serveur sur :3100)
npm run lint         # ESLint
npm run lint:fix     # ESLint avec auto-fix
npm run typecheck    # TypeScript (vue-tsc)
```

```bash
npm run db:up         # Démarre la base Postgres locale (Docker)
npm run db:down       # L'arrête (le volume, donc les données, est conservé)
npm run db:reset:local # Schéma à zéro puis migrations et seed - base locale uniquement
npm run db:migrate    # Applique les migrations Drizzle sur la base
npm run db:generate   # Génère les fichiers de migration depuis le schéma Drizzle
npm run db:seed       # Insère le jeu de données de test
npm run db:studio     # Lance Drizzle Studio (interface DB locale)
```

---

## CI

`.github/workflows/ci.yml` tourne sur chaque PR et sur push vers `main`/`staging`. Quatre jobs en
parallèle - **Lint**, **Typecheck**, **Unit tests**, **Build** - puis **Playwright E2E**, qui ne
tourne que sur push, sur PR vers `main`/`staging`, ou si la PR porte le label `e2e`.

Avant d'ouvrir une PR :

```bash
npm test && npm run lint && npm run typecheck
```

Ces trois commandes tournent aussi en pre-commit hook (`.husky/pre-commit`).

Deux workflows complètent la CI sur push vers `staging` : `staging-smoke-test.yml` (poll de
`/api/health` jusqu'à ce que le déploiement réponde) et `staging-merge.yml` (déplace la carte
GitHub Projects vers « À tester »).

---

## Authentification

Connexion par **magic-link uniquement** ([Better Auth](https://www.better-auth.com/), voir `server/lib/better-auth.ts`), envoyé par email via Resend. L'envoi du lien est restreint aux adresses e-mail déjà présentes dans `public.users` (staff) ou correspondant à un contact portail actif (`public.contacts`) - toute autre adresse reçoit le même message de succès générique côté UI (pas de fuite d'existence de compte), mais aucun email n'est réellement envoyé.

Le middleware `server/middleware/01-auth.ts` vérifie la session Better Auth sur toutes les routes `/api/*` sauf `/api/health` et `/api/auth/*` (Better Auth gère l'autorisation de ses propres routes).

**En local, le magic-link n'est pas envoyé par email : il s'affiche dans le terminal du serveur de
dev** (`server/lib/mail.ts`, actif dès que `NODE_ENV !== 'production'`). Saisir n'importe quelle
adresse seedée sur `/login`, puis copier le lien depuis le terminal. C'est le seul moyen de tester
le portail client en local, ses contacts de seed ayant des domaines fictifs. Le comportement en
production est inchangé (envoi Resend réel).

Pour ajouter un utilisateur staff : l'insérer dans `public.users` avec les champs `name`, `email` et `role` - pas besoin de renseigner `authUserId`, il se relie automatiquement à la bonne identité Better Auth dès la première connexion réussie.

---

## Documents (stockage S3-compatible)

Les documents sont stockés dans le bucket défini par `NUXT_DOCUMENTS_BUCKET`, sur l'endpoint S3-compatible défini par `NUXT_S3_ENDPOINT`. Le bucket doit exister avant le premier upload. Les URLs signées ont une durée de validité de 1 heure.

Le code applicatif ne parle que S3 générique (`@aws-sdk/client-s3`, voir `server/utils/documents.ts`) : changer de backend ne demande que de changer les variables d'environnement. Garage (sur Coolify) en staging comme en production.

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
    01-auth.ts         # Vérification de la session Better Auth
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

Le schéma Drizzle est dans `app/db/schema/`. Toute modification du schéma requiert :

```bash
npm run db:generate   # Génère la migration
npm run db:migrate    # Applique sur la base cible
npm run typecheck     # Vérifie que le code est cohérent avec les types inférés du schéma Drizzle
```

Tester une migration sur la base locale (`npm run db:reset:local`) avant d'ouvrir une PR : en
production les migrations tournent au démarrage du conteneur (`scripts/migrate-production.mjs`),
une migration cassée bloque donc le démarrage du service.

---

## Hébergement

Tout tourne sur Coolify, sur une infrastructure auto-hébergée :

| | Production | Staging | Local / CI |
|---|---|---|---|
| Base de données | Postgres auto-hébergé sur Coolify, image `supabase/postgres:17.4.1.032` | même image, base dédiée isolée de la prod | même image, en Docker (`compose.dev.yml`) |
| Storage documents | Garage (S3-compatible) | Garage | endpoint S3 au choix |
| Auth | Better Auth (magic-link) | Better Auth | Better Auth |

Le projet est né sur Supabase et en est entièrement sorti : plus aucun service managé Supabase, et
plus aucun client `@supabase/*` dans les dépendances. L'auth passe par Better Auth, le storage par
un client S3 générique (`server/utils/documents.ts`).

> **Le nom `supabase/postgres` subsiste, et c'est voulu.** Cette image tourne partout, production
> comprise, mais ce n'est pas une dépendance à la plateforme Supabase : c'est une image Postgres
> nue, sans aucun service Supabase autour. L'utiliser à l'identique en local, en CI et sur Coolify
> donne la même version majeure, les mêmes extensions et surtout la même collation ICU
> `en_US.UTF-8` (imposée par `POSTGRES_INITDB_ARGS`), qu'un `postgres:17` standard ne reproduit pas
> - les `order by` trieraient différemment. **Ne pas la remplacer** en croyant finir le ménage.

Staging ayant désormais sa propre base, c'est un vrai environnement de test : les migrations et les
opérations destructives peuvent y être validées sans toucher aux données de production.

---

## Flux de contribution

1. Créer une branche avec un nom descriptif : `feat/xxx`, `fix/xxx`, `chore/xxx`. Référencer
   l'issue GitHub dans la description de la PR, pas dans le nom de branche.
2. Passer les checks locaux (`npm test && npm run lint && npm run typecheck`).
3. Ouvrir une PR - la CI rejoue les mêmes checks.

`main` et `staging` sont protégées par ruleset : pas de push direct, PR obligatoire, checks CI
requis, conversations résolues avant merge. Une review Copilot automatique se déclenche à
l'ouverture et à chaque push ; elle est consultative, pas bloquante (pas de review humaine requise,
projet solo). Coolify déploie automatiquement en production sur push vers `main`.

Le suivi se fait sur GitHub Projects v2 - ce repo n'est pas connecté à Linear.

---

## Notes UI/UX

Les règles visuelles pour les colonnes kanban, les cards tâche et les modales sont documentées dans [docs/ui-ux.md](docs/ui-ux.md).
