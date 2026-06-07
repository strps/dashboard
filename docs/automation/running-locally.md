# Running locally & verifying

There are no automated tests, so **running the app is how you confirm a change
works.** This is the end-to-end loop.

## Prerequisites

- A current LTS **Node** (supporting Next.js 16) and **pnpm** (no version is
  pinned — see [linting.md](linting.md)).
- A reachable **Postgres** database. The `.env.example` default expects a local
  instance: `postgresql://postgres:postgres@localhost:5432/dashboard` (run one via
  Docker, Postgres.app, or a system install — any Postgres works).

## First-time setup

```bash
pnpm install
cp .env.example .env          # this repo uses .env; .env.local also works (both gitignored)
# fill in .env — see automation/environment.md:
#   DATABASE_URL          (defaults to local Postgres above)
#   BETTER_AUTH_SECRET    openssl rand -base64 32
#   BETTER_AUTH_URL       http://localhost:3000
#   GITHUB_CLIENT_ID/SECRET  (optional locally — only needed to test GitHub OAuth)
pnpm db:migrate               # apply committed migrations (or `pnpm db:push` for quick dev)
pnpm dev                      # http://localhost:3000
```

Inspect the database any time with `pnpm db:studio`.

## Getting an account (the first-admin rule)

Account creation runs the `databaseHooks.user.create.before` hook in
[../../src/lib/auth.ts](../../src/lib/auth.ts):

1. **The very first user to sign up becomes an admin automatically** (`count === 0`
   in the `user` table). So sign up first at `/sign-up` — you'll be the admin.
2. **Every subsequent sign-up must be in the `allowed_email` table**, or it's
   rejected with `FORBIDDEN` ("This email is not permitted to sign up."). As the
   admin, add emails at **`/settings/security`**.

Email/password works out of the box. GitHub OAuth is optional locally — see below.

## GitHub OAuth locally (optional)

- Create a GitHub OAuth app with callback
  **`<BETTER_AUTH_URL>/api/auth/callback/github`** (i.e.
  `http://localhost:3000/api/auth/callback/github`) and set
  `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`.
- If your GitHub account has **no email configured**, sign-in can fail with
  `email_not_found`; `auth.ts` synthesizes a `…@users.noreply.github.com` fallback.
  Full detail and the allowlist workaround are in
  [../standards/auth-and-data-access.md](../standards/auth-and-data-access.md).

## The verify loop (do this for any change)

After `pnpm dev`:

1. **Lint:** `pnpm lint` is the one automated gate — run it.
2. **Types:** `pnpm build` (or your editor) for type errors.
3. **Exercise the feature** in the browser:
   - Add the widget to a dashboard; toggle the lock and drag/resize it.
   - Edit/configure it (gear icon if it has a `configDialog`).
   - **Reload the page** and confirm state survived (persistence is the most common
     thing to get wrong — see [../standards/data-ownership.md](../standards/data-ownership.md)).
   - For shared/library data, open the relevant `/settings/<module>/<slug>` page.
4. **Data changes:** after a migration, confirm rows in `pnpm db:studio`.

Then run the [pre-PR checklist](../execution/templates/pr-checklist.md).

## Common gotchas

- **DB unreachable / `DATABASE_URL is not set`** — both
  [db/index.ts](../../src/lib/db/index.ts) and `drizzle.config.ts` throw early;
  check `.env` is present and Postgres is running.
- **Can't sign up (FORBIDDEN)** — you're not the first user and your email isn't in
  `allowed_email`. Sign in as the admin and add it at `/settings/security`.
- **Stale session cookie passes the proxy but pages 401** — expected; the proxy is
  optimistic and the DAL is the real gate
  ([../standards/auth-and-data-access.md](../standards/auth-and-data-access.md)).
