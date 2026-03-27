ALTER TABLE "contacts" DROP CONSTRAINT "contacts_clientId_clients_id_fk";
--> statement-breakpoint
ALTER TABLE "contacts" ALTER COLUMN "clientId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "authUserId" varchar(255);--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_authUserId_unique" UNIQUE("authUserId");

UPDATE public.users u
SET "authUserId" = au.id
FROM auth.users au
WHERE lower(u.email) = lower(au.email);