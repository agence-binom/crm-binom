ALTER TABLE "activity_log" ADD COLUMN "actorName" varchar(255);--> statement-breakpoint
-- Custom SQL migration file, put your code below! --
UPDATE "activity_log"
SET "actorName" = COALESCE(
  (SELECT "name" FROM "users" WHERE "users"."id" = "activity_log"."actorUserId"),
  (SELECT "firstName" || ' ' || "lastName" FROM "contacts" WHERE "contacts"."id" = "activity_log"."actorContactId"),
  'Acteur inconnu'
)
WHERE "actorName" IS NULL;
--> statement-breakpoint
ALTER TABLE "activity_log" ALTER COLUMN "actorName" SET NOT NULL;
