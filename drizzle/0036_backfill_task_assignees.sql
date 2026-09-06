-- Custom SQL migration file, put your code below! --
INSERT INTO "task_assignees" ("taskId", "userId")
SELECT "id", "assignedTo" FROM "tasks" WHERE "assignedTo" IS NOT NULL;
