-- Migrate `note` from one-doc-per-widget-instance to a per-user note library.
-- Each existing note row becomes a library note titled "Notes"; the previous
-- widget association (widget_instance_id) is dropped — widgets re-select notes
-- via their config after upgrade. No note content is lost.

-- Add new columns (nullable first so existing rows can be backfilled).
ALTER TABLE "note" ADD COLUMN "id" text;--> statement-breakpoint
ALTER TABLE "note" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "note" ADD COLUMN "order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "note" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint

-- Backfill id + title for existing rows.
UPDATE "note" SET "id" = gen_random_uuid()::text WHERE "id" IS NULL;--> statement-breakpoint
UPDATE "note" SET "title" = 'Notes' WHERE "title" IS NULL;--> statement-breakpoint

-- Swap the primary key from widget_instance_id to id, and drop the old column.
ALTER TABLE "note" DROP CONSTRAINT "note_pkey";--> statement-breakpoint
ALTER TABLE "note" DROP COLUMN "widget_instance_id";--> statement-breakpoint
ALTER TABLE "note" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "note" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "note" ADD CONSTRAINT "note_pkey" PRIMARY KEY ("id");--> statement-breakpoint

-- Rebuild the user index to include order for ordered listing.
DROP INDEX IF EXISTS "note_user_idx";--> statement-breakpoint
CREATE INDEX "note_user_idx" ON "note" USING btree ("user_id","order");
