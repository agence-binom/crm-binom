CREATE TABLE "task_attachments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "task_attachments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"taskId" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"filename" varchar(255),
	"filepath" varchar(500),
	"mimetype" varchar(100),
	"size" integer,
	"url" varchar(2048),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "task_attachments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "resources" DROP CONSTRAINT "resources_taskId_tasks_id_fk";
--> statement-breakpoint
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_taskId_tasks_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" DROP COLUMN "taskId";