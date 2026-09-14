ALTER TABLE "contacts" DROP CONSTRAINT "contacts_clientId_clients_id_fk";
--> statement-breakpoint
ALTER TABLE "contacts" ALTER COLUMN "clientId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "authUserId" varchar(255);--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_authUserId_unique" UNIQUE("authUserId");

-- Backfill ponctuel historique (Supabase Auth), déjà appliqué sur toute base existante (cette
-- migration y est déjà marquée comme jouée, elle ne sera jamais réexécutée là où le schéma
-- `auth` existe). Gardé conditionnel pour qu'une base neuve sans schéma `auth` (Postgres
-- self-hosted, plus de Supabase Auth depuis la migration vers Better Auth) ne plante pas dessus.
DO $$
BEGIN
  IF to_regclass('auth.users') IS NOT NULL THEN
    UPDATE public.users u
    SET "authUserId" = au.id::text
    FROM auth.users au
    WHERE lower(u.email) = lower(au.email);
  END IF;
END $$;