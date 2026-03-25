ALTER TABLE "contacts" DROP CONSTRAINT "contacts_clientId_clients_id_fk";
--> statement-breakpoint
ALTER TABLE "contacts" ALTER COLUMN "clientId" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;
