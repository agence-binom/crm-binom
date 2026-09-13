-- Rejoué une seule fois, à la création du volume Docker, après les scripts d'init de l'image
-- supabase/postgres (le préfixe zz- garantit l'ordre). Le rôle `postgres` existe déjà à ce
-- moment-là : on ne fait que lui donner un mot de passe connu en local.
--
-- Se connecter en local avec `postgres` et pas avec le superuser supabase_admin de l'image n'est
-- pas cosmétique : les tables sont en RLS sans aucune policy (`.enableRLS()`, app/db/schema). Les
-- lignes ne sont donc visibles que par le propriétaire des tables, c'est-à-dire le rôle qui a
-- joué les migrations. Un rôle différent renverrait zéro ligne sans la moindre erreur.
alter role postgres with login password 'postgres';
