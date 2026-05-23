-- Backfill per-instance cheatsheet filterButtons from cheatsheet_widget_config
-- into dashboard_layout.instances[i].config before dropping the table.
UPDATE "dashboard_layout" dl
SET "instances" = (
  SELECT jsonb_agg(
    CASE
      WHEN inst->>'type' = 'cheatsheet'
       AND EXISTS (
         SELECT 1 FROM "cheatsheet_widget_config" c
         WHERE c."widget_instance_id" = inst->>'id'
           AND c."user_id" = dl."user_id"
       )
      THEN inst || jsonb_build_object(
        'config',
        jsonb_build_object(
          'filterButtons',
          (
            SELECT c."filter_buttons"
            FROM "cheatsheet_widget_config" c
            WHERE c."widget_instance_id" = inst->>'id'
              AND c."user_id" = dl."user_id"
          )
        )
      )
      ELSE inst
    END
  )
  FROM jsonb_array_elements(dl."instances") inst
)
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(dl."instances") inst
  JOIN "cheatsheet_widget_config" c
    ON c."widget_instance_id" = inst->>'id'
   AND c."user_id" = dl."user_id"
  WHERE inst->>'type' = 'cheatsheet'
);
--> statement-breakpoint
DROP TABLE "cheatsheet_widget_config" CASCADE;
