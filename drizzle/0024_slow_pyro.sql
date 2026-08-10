ALTER TABLE "resources" ALTER COLUMN "projectId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "taskId" integer;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_taskId_tasks_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;