CREATE TABLE "billing_documents" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "billing_documents_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"projectId" integer NOT NULL,
	"documentType" varchar(50) NOT NULL,
	"subtype" varchar(20),
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"statusDate" timestamp,
	"externalUrl" varchar(2048),
	"description" text,
	"documentId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billing_documents_subtype_invoice_only" CHECK ("billing_documents"."subtype" is null or "billing_documents"."documentType" = 'invoice')
);
--> statement-breakpoint
ALTER TABLE "billing_documents" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "billing_documents" ADD CONSTRAINT "billing_documents_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "billing_documents" ADD CONSTRAINT "billing_documents_documentId_documents_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;

-- Data migration: split each existing billing document row out of `documents` into a
-- `billing_documents` record. A row that already has a real file keeps its documents.id as
-- `documentId`; a file-less "step" row (created by the short-lived lazy-step-create feature)
-- becomes a `billing_documents` row with no attached file.
--> statement-breakpoint
INSERT INTO "billing_documents" ("projectId", "documentType", "subtype", "status", "statusDate", "externalUrl", "description", "documentId", "createdAt", "updatedAt")
SELECT
	"entityId",
	"documentType",
	"subtype",
	"status",
	"statusDate",
	"externalUrl",
	"description",
	CASE WHEN "filename" IS NOT NULL THEN "id" ELSE NULL END,
	"createdAt",
	"updatedAt"
FROM "documents"
WHERE "documentType" IS NOT NULL AND "entityType" = 'project';

-- The file-less rows have now been copied into `billing_documents` with `documentId` null -
-- remove them from `documents`, which is going back to "always a real file" below.
--> statement-breakpoint
DELETE FROM "documents" WHERE "documentType" IS NOT NULL AND "filename" IS NULL;

--> statement-breakpoint
CREATE UNIQUE INDEX "billing_documents_document_id_unique" ON "billing_documents" USING btree ("documentId") WHERE "billing_documents"."documentId" is not null;
--> statement-breakpoint
CREATE INDEX "billing_documents_project_lookup_idx" ON "billing_documents" USING btree ("projectId","documentType","subtype","createdAt");
--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "filename" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "filepath" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "mimetype" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "size" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "externalUrl";
--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "documentType";
--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "status";
--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "subtype";
--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "statusDate";
