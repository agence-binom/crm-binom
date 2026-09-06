ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'employee';--> statement-breakpoint
-- Le rôle 'client' n'existe plus pour les utilisateurs internes (voir issue #101) : un compte
-- avec ce rôle avait accès à toutes les routes internes /api/*, le middleware ne vérifiant que
-- la présence dans public.users, jamais le rôle. Les comptes concernés basculent en 'employee'.
UPDATE "users" SET "role" = 'employee' WHERE "role" = 'client';