ALTER TABLE "contacts" ADD COLUMN "portalStatus" varchar(20);--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "portalLastLoginAt" timestamp;--> statement-breakpoint
CREATE UNIQUE INDEX "contacts_portal_email_unique" ON "contacts" USING btree (lower("email")) WHERE "contacts"."portalStatus" is not null;
