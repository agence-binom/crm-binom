CREATE TABLE "tasks" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tasks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"projectId" integer NOT NULL,
	"assignedTo" integer,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'todo' NOT NULL,
	"priority" varchar(50) DEFAULT 'medium' NOT NULL,
	"dueDate" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedTo_users_id_fk" FOREIGN KEY ("assignedTo") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;