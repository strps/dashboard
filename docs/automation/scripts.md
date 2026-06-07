# Scripts

All scripts are in [../../package.json](../../package.json). The package manager is
**pnpm**.

| Command | Runs | Purpose |
| --- | --- | --- |
| `pnpm dev` | `next dev` | Local dev server (Turbopack) at http://localhost:3000 |
| `pnpm build` | `next build` | Production build |
| `pnpm start` | `next start` | Serve a production build |
| `pnpm lint` | `eslint` | Lint the codebase ([linting.md](linting.md)) |
| `pnpm db:generate` | `drizzle-kit generate` | Generate a migration — **always pass `--custom`** ([database-migrations.md](database-migrations.md)) |
| `pnpm db:migrate` | `drizzle-kit migrate` | Apply pending migrations |
| `pnpm db:push` | `drizzle-kit push` | Push schema straight to the DB (dev convenience) |
| `pnpm db:studio` | `drizzle-kit studio` | Open Drizzle Studio |

## First-time setup

See [running-locally.md](running-locally.md) for the full setup, the first-admin
sign-up rule, and the verify loop. The short version:

```bash
pnpm install && cp .env.example .env && pnpm db:migrate && pnpm dev
```

There is no `pnpm test` (no tests) and no `pnpm format` (no formatter). See
[linting.md](linting.md).
