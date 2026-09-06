CREATE TABLE "activity_log" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "activity_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"entityType" varchar(50) NOT NULL,
	"entityId" integer NOT NULL,
	"action" varchar(20) NOT NULL,
	"actorType" varchar(20) NOT NULL,
	"actorUserId" integer,
	"actorContactId" integer,
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "billing_documents" ADD COLUMN "createdBy" integer;--> statement-breakpoint
ALTER TABLE "billing_documents" ADD COLUMN "updatedBy" integer;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "createdBy" integer;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "updatedBy" integer;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "createdBy" integer;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "updatedBy" integer;--> statement-breakpoint
ALTER TABLE "deliverables" ADD COLUMN "createdBy" integer;--> statement-breakpoint
ALTER TABLE "deliverables" ADD COLUMN "updatedBy" integer;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "createdBy" integer;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "updatedBy" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "createdBy" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "updatedBy" integer;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "createdByUserId" integer;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "createdByContactId" integer;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "updatedByUserId" integer;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "updatedByContactId" integer;--> statement-breakpoint
ALTER TABLE "task_attachments" ADD COLUMN "createdBy" integer;--> statement-breakpoint
ALTER TABLE "task_attachments" ADD COLUMN "updatedBy" integer;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "createdBy" integer;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "updatedBy" integer;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_actorUserId_users_id_fk" FOREIGN KEY ("actorUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_actorContactId_contacts_id_fk" FOREIGN KEY ("actorContactId") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_documents" ADD CONSTRAINT "billing_documents_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_documents" ADD CONSTRAINT "billing_documents_updatedBy_users_id_fk" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_updatedBy_users_id_fk" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_updatedBy_users_id_fk" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_updatedBy_users_id_fk" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_updatedBy_users_id_fk" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_updatedBy_users_id_fk" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_createdByContactId_contacts_id_fk" FOREIGN KEY ("createdByContactId") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_updatedByUserId_users_id_fk" FOREIGN KEY ("updatedByUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_updatedByContactId_contacts_id_fk" FOREIGN KEY ("updatedByContactId") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_updatedBy_users_id_fk" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_updatedBy_users_id_fk" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_created_by_single_actor" CHECK ("resources"."createdByUserId" is null or "resources"."createdByContactId" is null);--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_updated_by_single_actor" CHECK ("resources"."updatedByUserId" is null or "resources"."updatedByContactId" is null);