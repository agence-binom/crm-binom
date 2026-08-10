CREATE TABLE "resources" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "resources_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"projectId" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"filename" varchar(255),
	"filepath" varchar(500),
	"mimetype" varchar(100),
	"size" integer,
	"url" varchar(2048),
	"content" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;