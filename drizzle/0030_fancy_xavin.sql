ALTER TABLE "documents" ALTER COLUMN "filename" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "filepath" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "mimetype" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "size" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "statusDate" timestamp;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "requiresAcompte" boolean DEFAULT true NOT NULL;