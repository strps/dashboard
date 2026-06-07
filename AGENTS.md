<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project guide

The full documentation lives in [`docs/`](docs/README.md) — it's organized for
both humans and AI agents into **conventions**, **standards**, **automation**,
**planning**, and **execution**. This file is just the index. Start at
[`docs/README.md`](docs/README.md).

## Non-negotiables (read these first)

- **`src/proxy.ts` is an optimistic UX gate only — never a security boundary.**
  Real authorization lives in the DAL ([`src/lib/dal/`](src/lib/dal/)), where
  every user-scoped query calls `verifySession()`/`verifyAdmin()` and is scoped by
  `userId`. Server actions validate input with zod and delegate to the DAL; they
  never touch the db directly. →
  [docs/standards/auth-and-data-access.md](docs/standards/auth-and-data-access.md)
- **Widgets own their own data.** The zustand store
  ([`dashboardStore.ts`](src/dashboard/store/dashboardStore.ts)) is layout-only;
  do not add new stores. Per-instance rendering options use
  `useWidgetConfig`/`configSchema`; per-instance content uses a table keyed by
  `widgetInstanceId`; shared per-user data uses a config page + user table +
  provider. →
  [docs/standards/data-ownership.md](docs/standards/data-ownership.md)
- **Always generate migrations with `pnpm db:generate --custom --name=<name>` and
  write the SQL by hand.** Diff-based generation is unreliable here. →
  [docs/automation/database-migrations.md](docs/automation/database-migrations.md)
- **Use `verticalCompactor`; place new widgets at `x: 0, y: maxY`** (never
  `y: Infinity`). →
  [docs/standards/grid-system.md](docs/standards/grid-system.md)
- Tooling reality: **pnpm**, **ESLint only** (no Prettier/Biome), **no tests**,
  **no CI**, **no git hooks**. →
  [docs/automation/linting.md](docs/automation/linting.md)

## Where things are documented

| Topic | Doc |
| --- | --- |
| **"I'm touching X, which files?"** — task → canonical files | [docs/standards/codemap.md](docs/standards/codemap.md) |
| Big picture, `src/` layout, server/client boundary | [docs/standards/architecture.md](docs/standards/architecture.md) |
| Module + widget model (`defineModule`, registry, config pages) | [docs/standards/modules-and-widgets.md](docs/standards/modules-and-widgets.md) |
| Where state lives (config / content / shared library) | [docs/standards/data-ownership.md](docs/standards/data-ownership.md) |
| Auth, DAL, server actions, GitHub OAuth gotcha, sign-up gating | [docs/standards/auth-and-data-access.md](docs/standards/auth-and-data-access.md) |
| Drizzle schema, driver switch, table inventory | [docs/standards/database.md](docs/standards/database.md) |
| Grid rules & gotchas | [docs/standards/grid-system.md](docs/standards/grid-system.md) |
| Naming, code style, styling, commits | [docs/conventions/](docs/conventions/README.md) |
| Run & verify locally (setup, first-admin, OAuth) | [docs/automation/running-locally.md](docs/automation/running-locally.md) |
| Scripts, env vars, migrations, build/deploy, linting | [docs/automation/](docs/automation/README.md) |
| Planning a change + templates (feature plan, ADR) | [docs/planning/](docs/planning/README.md) |
| Step-by-step recipes (add a widget/module/config page) + checklists | [docs/execution/](docs/execution/README.md) |

## Common tasks

- Add a widget → [docs/execution/add-a-widget.md](docs/execution/add-a-widget.md)
- Add a module → [docs/execution/add-a-module.md](docs/execution/add-a-module.md)
- Add a settings page → [docs/execution/add-a-config-page.md](docs/execution/add-a-config-page.md)
- Change the database → [docs/automation/database-migrations.md](docs/automation/database-migrations.md)
