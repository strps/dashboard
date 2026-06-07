# Database migrations

> **Always generate migrations with `pnpm db:generate --custom --name=<migration_name>`.**
> Write the SQL by hand. Do **not** rely on auto-generated schema-diff migrations.

## Why hand-written

This project's drizzle snapshots are intentionally **not** kept in sync —
migrations have historically been applied via `db:push`, so diff-based generation
is unreliable and will produce wrong or empty diffs. `--custom` produces an empty
SQL file that you fill in yourself to exactly match the schema change. This applies
to everything: data migrations, PK swaps, multi-step `ALTER`, and ordinary
column/table changes alike.

## Workflow

1. Edit the Drizzle schema — either
   [src/lib/db/schema.ts](../../src/lib/db/schema.ts) or a module's `db.ts`
   (e.g. [time-management/db.ts](../../src/dashboard/modules/time-management/db.ts)).
   New schema files must be added to the `schema: [...]` array in
   [../../drizzle.config.ts](../../drizzle.config.ts).
2. Generate an empty migration:

   ```bash
   pnpm db:generate --custom --name=add_widget_settings
   ```

   This writes a new numbered SQL file under [../../drizzle/](../../drizzle/)
   (e.g. `0010_add_widget_settings.sql`).
3. **Write the SQL by hand** in that file to match your schema change.
4. Apply it:

   ```bash
   pnpm db:migrate
   ```

   In dev you can iterate quickly with `pnpm db:push`, but the committed migration
   is what runs in production.
5. Commit both the schema change and the new SQL file together. Migrations are
   applied on deploy — `vercel.json` runs `pnpm db:migrate && pnpm build` (see
   [build-and-deploy.md](build-and-deploy.md)).

## Conventions

- Existing migrations are sequentially numbered (`0000_…` … `0009_…`); `--name`
  becomes the suffix. Keep names short and descriptive (`add_dashboard_tabs`,
  `notes_library`).
- Keep one logical change per migration; don't edit an already-applied migration —
  add a new one.
