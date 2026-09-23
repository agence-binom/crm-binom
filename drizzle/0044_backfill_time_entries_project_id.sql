-- Recopie le projet de la tâche sur les saisies de temps existantes, pour qu'elles restent comptées
-- sur le projet si leur tâche est supprimée (taskId passe alors à null). Ne touche que les lignes
-- sans projectId : idempotent.
UPDATE "time_entries"
SET "projectId" = "tasks"."projectId"
FROM "tasks"
WHERE "time_entries"."taskId" = "tasks"."id"
  AND "time_entries"."projectId" IS NULL
  AND "tasks"."projectId" IS NOT NULL;
