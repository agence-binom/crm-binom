CREATE TABLE "prospect_briefs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "prospect_briefs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"clientId" integer NOT NULL,
	"contactId" integer,
	"token" varchar(64) NOT NULL,
	"status" varchar(20) DEFAULT 'sent' NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"openedAt" timestamp,
	"completedAt" timestamp,
	"formVersion" varchar(50),
	"answers" jsonb,
	"projectType" varchar(30),
	"budgetRange" varchar(20),
	"deadline" date,
	"domain" varchar(253),
	"summary" jsonb,
	"enrichment" jsonb,
	"enrichmentStatus" varchar(20),
	"enrichedAt" timestamp,
	"notifiedAt" timestamp,
	"createdBy" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "prospect_briefs_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "prospect_briefs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "prospect_briefs" ADD CONSTRAINT "prospect_briefs_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_briefs" ADD CONSTRAINT "prospect_briefs_contactId_contacts_id_fk" FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_briefs" ADD CONSTRAINT "prospect_briefs_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "prospect_briefs_client_created_idx" ON "prospect_briefs" USING btree ("clientId","createdAt" DESC NULLS LAST);