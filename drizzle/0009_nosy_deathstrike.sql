CREATE TABLE "documents" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "documents_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"filename" varchar(255) NOT NULL,
	"filepath" varchar(500) NOT NULL,
	"mimetype" varchar(100) NOT NULL,
	"size" integer NOT NULL,
	"entityType" varchar(50) NOT NULL,
	"entityId" integer NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "invoices_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"clientId" integer NOT NULL,
	"projectId" integer,
	"quoteId" integer,
	"number" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"totalHT" numeric(10, 2) DEFAULT '0' NOT NULL,
	"totalTTC" numeric(10, 2) DEFAULT '0' NOT NULL,
	"vatRate" numeric(5, 2) DEFAULT '20' NOT NULL,
	"paidAmount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"issueDate" timestamp NOT NULL,
	"dueDate" timestamp NOT NULL,
	"paidDate" timestamp,
	"notes" text,
	"terms" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"invoiceId" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"paymentDate" timestamp NOT NULL,
	"paymentMethod" varchar(50) NOT NULL,
	"type" varchar(50) DEFAULT 'payment' NOT NULL,
	"reference" varchar(255),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "quotes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"clientId" integer NOT NULL,
	"projectId" integer,
	"number" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"totalHT" numeric(10, 2) DEFAULT '0' NOT NULL,
	"totalTTC" numeric(10, 2) DEFAULT '0' NOT NULL,
	"vatRate" numeric(5, 2) DEFAULT '20' NOT NULL,
	"issueDate" timestamp NOT NULL,
	"validUntil" timestamp,
	"notes" text,
	"terms" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quotes_number_unique" UNIQUE("number")
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "links" json;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_quoteId_quotes_id_fk" FOREIGN KEY ("quoteId") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_invoices_id_fk" FOREIGN KEY ("invoiceId") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;