# Database

Drizzle ORM over Postgres. Schema definitions, the dev/prod driver switch, and the
table inventory.

## Driver switch

[../../src/lib/db/index.ts](../../src/lib/db/index.ts) exports a single `db` and
picks the driver by `NODE_ENV`:

```ts
export const db =
  process.env.NODE_ENV === "production"
    ? drizzleNeon(new Pool({ connectionString: databaseUrl }), { schema })  // Neon serverless (transactions)
    : drizzlePg(postgres(databaseUrl), { schema });                          // postgres.js (local dev)
```

It is `import "server-only";` and throws if `DATABASE_URL` is unset. Production
uses `drizzle-orm/neon-serverless` (the serverless **pool**, which supports
transactions); dev uses `drizzle-orm/postgres-js`.

## Where schemas live

- Shared tables: [../../src/lib/db/schema.ts](../../src/lib/db/schema.ts).
- A module may own its tables in its own `db.ts` (e.g.
  [time-management/db.ts](../../src/dashboard/modules/time-management/db.ts)).
- **Every schema file must be listed in
  [../../drizzle.config.ts](../../drizzle.config.ts)** under `schema: [...]` so
  drizzle-kit sees it. Today that's `src/lib/db/schema.ts` and the
  time-management `db.ts`.

## Table inventory

> **This table is a map, not the source of truth.** It's here for orientation; it
> will drift. The authoritative list is the schema itself —
> [schema.ts](../../src/lib/db/schema.ts) plus each module's `db.ts`. If a row here
> disagrees with the code, the code wins (and please fix the row).

| Table | Purpose | Owner |
| --- | --- | --- |
| `user`, `session`, `account`, `verification` | Better Auth core | `schema.ts` |
| `allowed_email` | sign-up allowlist (admin-managed) | `schema.ts` |
| `dashboard` | dashboard tabs (per user) | `schema.ts` |
| `dashboard_layout` | grid `layout` + `instances` (JSONB) + `locked`, keyed by dashboard | `schema.ts` |
| `note` | shared notes library (blocks JSONB) | `schema.ts` |
| `cheatsheet_tag`, `cheatsheet_entry`, `cheatsheet_entry_tag` | cheatsheet library + tag hierarchy + M2M | `schema.ts` |
| `activity`, `activity_tag`, `activity_activity_tag` | time-management activities + tags + M2M | `time-management/db.ts` |
| `time_entry` | logged time intervals | `time-management/db.ts` |

User-scoped tables carry a `userId` FK; the DAL filters every query by it (see
[auth-and-data-access.md](auth-and-data-access.md)). Per-instance widget *config*
is **not** a table — it rides in the `dashboard_layout.instances` JSONB (see
[data-ownership.md](data-ownership.md)).

## Migrations

Generate migrations **by hand** with `--custom`, never via schema-diff:

```bash
pnpm db:generate --custom --name=<migration_name>   # creates an empty SQL file you fill in
pnpm db:migrate                                      # apply pending migrations
pnpm db:push                                         # push schema directly (dev convenience)
pnpm db:studio                                       # open Drizzle Studio
```

The full rationale (why diff-based generation is unreliable in this repo) and the
step-by-step workflow are in
[../automation/database-migrations.md](../automation/database-migrations.md).
Committed migrations live in [../../drizzle/](../../drizzle/) and are applied on
deploy (`vercel.json` runs `pnpm db:migrate` before build).
