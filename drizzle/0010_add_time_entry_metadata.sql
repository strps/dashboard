-- Custom SQL migration file, put your code below! --

ALTER TABLE "time_entry"
  ADD COLUMN "metadata" jsonb NOT NULL DEFAULT '{"notes": []}'::jsonb;
