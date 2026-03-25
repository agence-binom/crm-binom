UPDATE "tasks"
SET "status" = CASE
	WHEN "status" = 'validation' AND "workflowTag" = 'client' THEN 'validationClient'
	WHEN "status" = 'validation' THEN 'validationBinom'
	ELSE "status"
END;
--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "workflowTag";
