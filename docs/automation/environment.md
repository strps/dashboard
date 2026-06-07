# Environment variables

Copy [../../.env.example](../../.env.example) to `.env` and fill in values. `.env`
is gitignored; never commit it.

| Variable | Used by | Notes |
| --- | --- | --- |
| `DATABASE_URL` | [db/index.ts](../../src/lib/db/index.ts), [drizzle.config.ts](../../drizzle.config.ts) | Postgres connection string. Dev: local Postgres (e.g. `localhost:5432`). Prod: Neon. Both throw at startup if unset. |
| `BETTER_AUTH_SECRET` | Better Auth | Session signing secret. Generate with `openssl rand -base64 32`. |
| `BETTER_AUTH_URL` | Better Auth | Base URL for auth callbacks. Dev default `http://localhost:3000`. |
| `GITHUB_CLIENT_ID` | [auth.ts](../../src/lib/auth.ts) | GitHub OAuth app client id. |
| `GITHUB_CLIENT_SECRET` | [auth.ts](../../src/lib/auth.ts) | GitHub OAuth app client secret. |

## Driver selection

`NODE_ENV` (set by Next.js) selects the DB driver, not a custom env var:
`production` → Neon serverless pool; otherwise → postgres.js. See
[../standards/database.md](../standards/database.md).

## Adding a new variable

1. Add it to `.env.example` with a placeholder/comment.
2. Read it via `process.env.X` only in server-only code (DAL, `auth.ts`,
   `db/index.ts`). Throw early if a required var is missing, matching the existing
   `DATABASE_URL` guard.
3. Document it in the table above.
