ALTER TABLE "contacts" DROP CONSTRAINT "contacts_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "status" SET DEFAULT 'in_progress';--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "priority" SET DEFAULT 'low';--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "siret" varchar(14);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "status" varchar(50) DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "contacts" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "budget";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "password";