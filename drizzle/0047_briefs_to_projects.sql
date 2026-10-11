-- Le brief aboutit désormais à un projet (créé à sa réception, ou existant choisi à l'envoi).
-- Migration écrite à la main : drizzle-kit ne sait pas exprimer un renommage de table sans
-- question interactive, ni la reprise des briefs déjà reçus.
ALTER TABLE "prospect_briefs" RENAME TO "project_briefs";--> statement-breakpoint
ALTER SEQUENCE "prospect_briefs_id_seq" RENAME TO "project_briefs_id_seq";--> statement-breakpoint
ALTER TABLE "project_briefs" RENAME CONSTRAINT "prospect_briefs_pkey" TO "project_briefs_pkey";--> statement-breakpoint
ALTER TABLE "project_briefs" RENAME CONSTRAINT "prospect_briefs_token_unique" TO "project_briefs_token_unique";--> statement-breakpoint
ALTER TABLE "project_briefs" RENAME CONSTRAINT "prospect_briefs_clientId_clients_id_fk" TO "project_briefs_clientId_clients_id_fk";--> statement-breakpoint
ALTER TABLE "project_briefs" RENAME CONSTRAINT "prospect_briefs_contactId_contacts_id_fk" TO "project_briefs_contactId_contacts_id_fk";--> statement-breakpoint
ALTER TABLE "project_briefs" RENAME CONSTRAINT "prospect_briefs_createdBy_users_id_fk" TO "project_briefs_createdBy_users_id_fk";--> statement-breakpoint
ALTER INDEX "prospect_briefs_client_created_idx" RENAME TO "project_briefs_client_created_idx";--> statement-breakpoint
ALTER TABLE "project_briefs" ADD COLUMN "projectId" integer;--> statement-breakpoint
ALTER TABLE "project_briefs" ADD COLUMN "target" varchar(20) DEFAULT 'new_project' NOT NULL;--> statement-breakpoint
ALTER TABLE "project_briefs" ADD COLUMN "appliedFields" jsonb;--> statement-breakpoint
ALTER TABLE "project_briefs" ADD CONSTRAINT "project_briefs_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_briefs_project_unique" ON "project_briefs" USING btree ("projectId") WHERE "project_briefs"."projectId" is not null;--> statement-breakpoint
-- reprise:start
-- Reprise des briefs déjà reçus avant le rattachement aux projets. Idempotent (ne touche que des
-- briefs complétés sans projet), rejoué tel quel par e2e/brief-migration.spec.ts. Les briefs non
-- complétés restent en attente sur leur client ; ceux d'un client à plusieurs projets aussi, la
-- fiche client propose de les rattacher à la main.
--
-- Client avec un seul projet : le brief le plus récent y est rattaché, sans toucher au projet.
UPDATE "project_briefs" AS b
SET "projectId" = p.id, "target" = 'existing_project', "appliedFields" = '[]'::jsonb, "updatedAt" = now()
FROM (SELECT "clientId", min(id) AS id FROM "projects" GROUP BY "clientId" HAVING count(*) = 1) AS p
WHERE b."clientId" = p."clientId"
  AND b."status" = 'completed'
  AND b."projectId" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "project_briefs" AS taken WHERE taken."projectId" = p.id)
  AND b.id = (
    SELECT max(latest.id) FROM "project_briefs" AS latest
    WHERE latest."clientId" = b."clientId" AND latest."status" = 'completed' AND latest."projectId" IS NULL
  );--> statement-breakpoint
-- Client sans projet : le projet est créé comme à la réception d'un brief (mêmes règles et
-- mêmes libellés que buildProjectFieldsFromBrief dans app/lib/brief-project.ts).
DO $$
DECLARE
  brief record;
  new_project_id integer;
  type_label text;
  budget_label text;
  website text;
  note_lines text;
BEGIN
  FOR brief IN
    SELECT b.*, c.name AS client_name
    FROM "project_briefs" AS b
    JOIN "clients" AS c ON c.id = b."clientId"
    WHERE b."status" = 'completed'
      AND b."projectId" IS NULL
      AND NOT EXISTS (SELECT 1 FROM "projects" AS p WHERE p."clientId" = b."clientId")
    ORDER BY b.id
  LOOP
    type_label := CASE brief."projectType"
      WHEN 'showcase_site' THEN 'Création de site vitrine'
      WHEN 'redesign' THEN 'Refonte'
      WHEN 'ecommerce' THEN 'Boutique en ligne'
      WHEN 'feature' THEN 'Fonctionnalité sur site existant'
      WHEN 'internal_tool' THEN 'Outil interne'
      WHEN 'other' THEN 'Autre'
    END;
    budget_label := CASE brief."budgetRange"
      WHEN 'lt_3k' THEN 'Moins de 3 k€'
      WHEN '3k_6k' THEN '3 à 6 k€'
      WHEN '6k_12k' THEN '6 à 12 k€'
      WHEN '12k_25k' THEN '12 à 25 k€'
      WHEN 'gt_25k' THEN 'Plus de 25 k€'
      WHEN 'needs_advice' THEN 'Besoin d’être conseillé'
    END;
    website := CASE WHEN brief."domain" IS NOT NULL THEN 'https://' || brief."domain" END;
    note_lines := concat(
      CASE WHEN type_label IS NOT NULL THEN E'\n- Type de projet : ' || type_label END,
      CASE WHEN budget_label IS NOT NULL THEN E'\n- Budget : ' || budget_label END,
      CASE WHEN brief."summary" -> 'decisionMaker' ->> 'status' = 'answered'
        THEN E'\n- Décideur : ' || (brief."summary" -> 'decisionMaker' ->> 'value') END,
      CASE WHEN brief."summary" -> 'toolsToConnect' ->> 'status' = 'answered'
        THEN E'\n- Outils à connecter : ' || (SELECT string_agg(tool, ', ') FROM jsonb_array_elements_text(brief."summary" -> 'toolsToConnect' -> 'value') AS tool) END
    );

    INSERT INTO "projects" ("clientId", "name", "description", "status", "endDate", "url", "notes", "createdBy")
    VALUES (
      brief."clientId",
      left(brief.client_name || ' - ' || coalesce(type_label, 'Nouveau projet'), 255),
      nullif(concat_ws(E'\n\n',
        (SELECT 'Objectifs :' || string_agg(E'\n- ' || goal, '')
          FROM jsonb_array_elements_text(
            CASE WHEN brief."summary" -> 'goals' ->> 'status' = 'answered' THEN brief."summary" -> 'goals' -> 'value' ELSE '[]'::jsonb END
          ) AS goal),
        CASE WHEN brief."summary" -> 'deadlineContext' ->> 'status' = 'answered'
          THEN 'Contexte de l’échéance : ' || (brief."summary" -> 'deadlineContext' ->> 'value') END
      ), ''),
      'avant_vente',
      brief."deadline"::timestamp,
      website,
      CASE WHEN note_lines <> '' THEN 'Issu du brief pré-rendez-vous :' || note_lines END,
      brief."createdBy"
    )
    RETURNING id INTO new_project_id;

    UPDATE "project_briefs"
    SET "projectId" = new_project_id, "target" = 'new_project', "updatedAt" = now()
    WHERE id = brief.id;
  END LOOP;
END $$;
-- reprise:end
