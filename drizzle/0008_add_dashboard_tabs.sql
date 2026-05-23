-- Create dashboard table for tab metadata
CREATE TABLE "dashboard" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "name" text NOT NULL,
  "type" text NOT NULL DEFAULT 'widgets',
  "order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "dashboard"
  ADD CONSTRAINT "dashboard_user_id_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "dashboard_user_order_idx" ON "dashboard" USING btree ("user_id", "order");
--> statement-breakpoint

-- DATA MIGRATION: seed one "Main" dashboard per existing user
INSERT INTO "dashboard" ("id", "user_id", "name", "type", "order", "created_at", "updated_at")
SELECT gen_random_uuid()::text, "user_id", 'Main', 'widgets', 0, now(), now()
FROM "dashboard_layout";
--> statement-breakpoint

-- Add nullable dashboard_id column to dashboard_layout
ALTER TABLE "dashboard_layout" ADD COLUMN "dashboard_id" text;
--> statement-breakpoint

-- Populate dashboard_id by joining through user_id
UPDATE "dashboard_layout" dl
SET "dashboard_id" = d."id"
FROM "dashboard" d
WHERE d."user_id" = dl."user_id";
--> statement-breakpoint

-- Drop the old primary key and user_id FK
ALTER TABLE "dashboard_layout" DROP CONSTRAINT "dashboard_layout_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "dashboard_layout" DROP CONSTRAINT "dashboard_layout_pkey";
--> statement-breakpoint
ALTER TABLE "dashboard_layout" DROP COLUMN "user_id";
--> statement-breakpoint

-- Make dashboard_id NOT NULL and set as new primary key
ALTER TABLE "dashboard_layout" ALTER COLUMN "dashboard_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "dashboard_layout"
  ADD CONSTRAINT "dashboard_layout_pkey" PRIMARY KEY ("dashboard_id");
--> statement-breakpoint
ALTER TABLE "dashboard_layout"
  ADD CONSTRAINT "dashboard_layout_dashboard_id_dashboard_id_fk"
  FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboard"("id") ON DELETE cascade ON UPDATE no action;
