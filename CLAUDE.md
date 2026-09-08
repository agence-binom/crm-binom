# CLAUDE.md

Source de vérité versionnée des règles d'ingénierie de ce repo. À tenir à jour quand une règle change — ne pas laisser dériver silencieusement.

## Stack

Nuxt 4, Nuxt UI v4, Drizzle ORM, Supabase (Auth + Postgres + Storage). Détails d'installation et de structure : [README.md](README.md).

## Ce que le repo est (et n'est pas)

CRM interne à binōm : un seul organisme utilise l'app côté staff (`public.users`, magic-link Supabase). Il n'y a **pas** de multi-tenant au sens SaaS — pas d'`organization_id` à filtrer partout. La frontière de sécurité réelle est **staff interne vs client externe via le portail** (`/api/portal/*`), voir plus bas.

## Sécurité — ce qui est non négociable

- **Toute route `/api/*`** passe par `server/middleware/01-auth.ts`, sauf les chemins listés dans `PUBLIC_AUTH_API_PATHS` (`server/utils/auth.ts`). N'ajouter un chemin à cette liste que s'il ne renvoie et n'accepte réellement aucune donnée sensible (ex: `/api/health`).
- **Le portail client** (`/api/portal/*`) est résolu une seule fois dans le middleware (`requireActivePortalContactWithClient`) et exposé via `event.context.portalContact` / `event.context.portalClient`. Un nouvel endpoint sous `/api/portal/` hérite automatiquement de cette vérification — ne pas la dupliquer, ne pas la contourner.
- Un utilisateur staff est résolu via `event.context.appUser` (`getAppUser`), jamais en interrogeant `usersTable` à nouveau dans un handler.
- Rate limiting IP (120 req/min) sur `/api/*` avant l'auth (`00-rate-limit.ts`) — ne pas le désactiver pour un nouvel endpoint sans raison explicite.
- `DATABASE_URL` doit utiliser le **Session pooler** Supabase (l'hôte direct requiert IPv6 et casse en CI/certains réseaux) — voir `server/utils/database-errors.ts` pour le message d'erreur associé si ça arrive.
- Ne jamais committer `.env` ou une valeur réelle de secret. Secret scanning + push protection sont actifs au niveau du repo (GitHub natif) — un push contenant un secret sera bloqué côté GitHub, ce n'est pas juste une convention.
- `SUPABASE_SECRET_KEY` (service role) est côté serveur uniquement — ne jamais l'exposer dans `runtimeConfig.public` ni dans une réponse API.

## Conventions de code

- Type UI/métier pur → `app/types`. Schéma Zod + type de payload → `app/validation`. Logique pure sans réactivité Vue → `app/lib`. État réactif Vue/Nuxt → `app/composables`. Détails complets dans [README.md](README.md#structure-frontend).
- Erreurs DB → toujours passer par `toPublicDatabaseError` (`server/utils/database-errors.ts`) avant de les remonter au client, pour ne pas fuiter de détails d'infra dans une réponse HTTP.
- Style ESLint : pas de comma-dangle, brace style 1tbs (`eslint.config.mjs`). `npm run lint:fix` avant de se battre avec une règle manuellement.
- Commentaires : uniquement pour expliquer un *pourquoi* non évident (contrainte cachée, workaround, invariant surprenant) — jamais pour décrire ce que fait déjà un identifiant bien nommé. Voir `server/middleware/01-auth.ts` ou `server/utils/auth.ts` pour le ton attendu.

## Base de données

Toute modification du schéma Drizzle (`app/db/schema/*`) suit ces trois étapes dans l'ordre :

```bash
npm run db:generate   # génère la migration
npm run db:migrate    # l'applique sur la base cible
npm run db:types      # resynchronise les types Supabase
```

Les migrations de production tournent au démarrage du conteneur (`scripts/migrate-production.mjs`, appelé par `scripts/start-production.sh`) — une migration cassée bloque le démarrage du service plutôt que de laisser l'app tourner contre un schéma incohérent. Une migration qui échoue en prod est donc un incident de disponibilité, pas juste un bug applicatif : à tester localement (`npm run db:reset:local`) avant toute PR qui touche le schéma.

## CI / checks locaux

La CI (`.github/workflows/ci.yml`) fait tourner en parallèle `Lint`, `Typecheck`, `Unit tests`, `Build`, puis `Playwright E2E` (conditionné : tourne sur push, sur PR vers `main`/`staging`, ou sur label `e2e`). Avant d'ouvrir une PR :

```bash
npm test && npm run lint && npm run typecheck
```

Ces trois commandes tournent aussi en pre-commit hook (`.husky/pre-commit`) — un commit qui échoue dessus n'a pas dû passer en douce.

## Branches, PR, merge

- Pas de convention Linear : ce repo n'est **pas** connecté à Linear. Le suivi se fait sur GitHub Projects v2 natif (le board « À tester » est déplacé automatiquement par `.github/workflows/staging-merge.yml` sur push vers `staging`, via un PAT `PROJECT_TOKEN` dédié — pas le `GITHUB_TOKEN` du workflow). La convention de branche documentée historiquement dans le README (`<pseudo>/bin-<N>-<slug>`) n'est plus vraiment suivie dans les faits — préférer un nom descriptif type `feat/xxx`, `fix/xxx`, `chore/xxx`, en référençant l'issue GitHub dans la description de PR plutôt que dans le nom de branche.
- `main` et `staging` sont protégées par ruleset GitHub : suppression et force-push bloqués, les 5 checks CI sont requis, passage par une PR obligatoire (pas de push direct), threads de conversation à résoudre avant merge, et une review Copilot automatique se déclenche à l'ouverture de PR et à chaque push. Pas de review humaine requise (`required_approving_review_count: 0`) — solo dev, la review Copilot + les checks CI font office de filet de sécurité avant merge. Si un deuxième dev rejoint le projet, remonter ce compteur à 1 (`dismiss_stale_reviews_on_push` est déjà actif dans le ruleset, prêt à s'appliquer).
- **Le gate de production, c'est la review + CI obligatoires sur `main`** — décision explicite, pas un oubli. Coolify déploie automatiquement en prod sur push vers `main` (app GitHub, branch-watching) ; on a délibérément choisi de ne *pas* introduire de branche `production` séparée ni d'étape de promotion manuelle supplémentaire, faute de besoin réel identifié (pas de merges groupés, pas de fenêtre de déploiement à respecter). Si ce besoin apparaît un jour, revoir cette section avant de recréer la mécanique.
- Staging est protégée de la même façon que `main`, même si son utilité réelle est limitée aujourd'hui : **staging partage probablement le même projet Supabase que la prod** (limite du plan Supabase actuel) — ne pas considérer staging comme un environnement isolé pour des tests destructifs. Une migration vers un Postgres hébergé séparé est envisagée ; si elle se fait, revoir ici l'utilité de staging (base dédiée = tests réalistes possibles).

## Ce qu'un agent IA peut faire seul vs ce qui nécessite une validation humaine explicite

**Autonome, sans demander confirmation :**
- Lire le code, explorer, expliquer.
- Modifier du code applicatif dans une branche dédiée, committer localement.
- Ajouter/modifier des tests, lancer `npm test`, `npm run lint`, `npm run typecheck` en local.
- Modifier `CLAUDE.md` lui-même pour refléter une règle qui a changé (avec le changement dans la même PR que le code concerné, pas dans une PR à part qui décrit un changement pas encore fait).

**Nécessite une validation humaine explicite avant d'agir :**
- **`git push`, sur n'importe quelle branche — y compris une branche de feature créée juste pour ouvrir une PR.** Un commit local ne suffit jamais comme justification pour pousser sans demander d'abord, même en plein milieu d'une série de tâches déjà validées.
- Ouvrir une PR (conséquence directe du point précédent, puisque ça nécessite un push).
- Toute modification de branch protection / ruleset GitHub, de secrets, de permissions de token CI/CD, de webhooks.
- Toute action sur `staging`/`main` qui n'est pas un merge de PR review-approuvée (force-push, reset, suppression de branche).
- Toute modification touchant Coolify, le déploiement, ou la configuration Supabase en environnement partagé (staging inclus, vu qu'il partage la base avec la prod).
- Ajout ou changement de dépendance avec des implications de licence ou de surface d'attaque significative (ex: nouveau package qui exécute du code au build).
- Tout ce qui touche à l'authentification, au portail client, ou à ce qui distingue un accès staff d'un accès client — cette frontière est la seule vraie limite de sécurité du produit, elle ne se retouche pas « en passant ».

## Dette / TODO connus (pas urgents, mais à ne pas oublier)

- Staging partage vraisemblablement la base Supabase de prod — à vérifier/confirmer avant de s'appuyer dessus pour des tests qui écrivent des données.
- Scope du PAT `PROJECT_TOKEN` (utilisé par `staging-merge.yml`) non audité dans le cadre de ce passage — à vérifier qu'il n'a que les droits GitHub Projects nécessaires, pas plus.
- Scan de secrets fait uniquement sur l'état actuel des fichiers trackés, pas sur l'historique git complet — envisager un passage `gitleaks --log-opts="--all"` ou équivalent si un doute survient sur un secret ayant pu être commité puis retiré.
