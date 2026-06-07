# Dashboard

A personal dashboard with a draggable, resizable widget grid. Built with
[Next.js 16](https://nextjs.org) (App Router, Turbopack), [Zustand](https://github.com/pmndrs/zustand)
for layout state, [react-grid-layout](https://github.com/react-grid-layout/react-grid-layout)
for the canvas, [Drizzle](https://orm.drizzle.team) + Postgres for data,
[Better Auth](https://better-auth.com) for auth, and [Tailwind CSS v4](https://tailwindcss.com).

## Quick start

```bash
pnpm install
cp .env.example .env        # fill in values (.env.local also works)
pnpm db:migrate             # apply migrations to your local Postgres
pnpm dev                    # http://localhost:3000
```

The **first user to sign up becomes the admin**; everyone after must be added to
the allowlist at `/settings/security`. Full setup, the first-admin rule, GitHub
OAuth, and the verify loop are in
[docs/automation/running-locally.md](docs/automation/running-locally.md).

```bash
pnpm build   # production build
pnpm start   # serve the production build
pnpm lint    # eslint (the only automated quality gate — there are no tests)
```

## Documentation

Full docs live in **[docs/](docs/README.md)** — organized for both humans and AI
agents into conventions, standards, automation, planning, and execution.
[AGENTS.md](AGENTS.md) is the agent entry point and indexes the same tree.

Start here:

- [docs/standards/architecture.md](docs/standards/architecture.md) — the big picture and `src/` layout.
- [docs/standards/codemap.md](docs/standards/codemap.md) — "I'm touching X, which files?".
- [docs/standards/modules-and-widgets.md](docs/standards/modules-and-widgets.md) — the module + widget model.
- [docs/standards/data-ownership.md](docs/standards/data-ownership.md) — where each kind of state lives.
- [docs/standards/auth-and-data-access.md](docs/standards/auth-and-data-access.md) — the security model.

## Routes

- `/` — the dashboard grid ([src/app/page.tsx](src/app/page.tsx))
- `/sign-in`, `/sign-up` — auth pages
- `/settings/<module>/<page>` — module config pages ([src/app/settings/](src/app/settings/))
- `/settings/security` — admin: manage the sign-up allowlist
- `/api/auth/*` — Better Auth handler ([src/app/api/auth/](src/app/api/auth/))

## Auth (short version)

[src/proxy.ts](src/proxy.ts) is an **optimistic UX gate** — it only checks that a
session cookie exists and is **not** a security boundary. Real authorization lives
in the data-access layer ([src/lib/dal/](src/lib/dal/)), where every user-scoped
query calls `verifySession()`/`verifyAdmin()` and is scoped by `userId`. See
[docs/standards/auth-and-data-access.md](docs/standards/auth-and-data-access.md).
