# Automation

The tooling that runs, builds, and ships the project.

- [running-locally.md](running-locally.md) — set up, run, and verify the app locally (start here).
- [scripts.md](scripts.md) — every `package.json` script.
- [environment.md](environment.md) — required environment variables.
- [database-migrations.md](database-migrations.md) — the hand-written migration workflow.
- [build-and-deploy.md](build-and-deploy.md) — Turbopack, Vercel, deploy-time migrations.
- [linting.md](linting.md) — ESLint flat config, and what tooling deliberately does **not** exist.

## What exists vs. what doesn't

This keeps both humans and AI from assuming tooling that isn't here.

| Tool | Status |
| --- | --- |
| Package manager | **pnpm** (`pnpm-lock.yaml`) |
| Linter | **ESLint** flat config only |
| Formatter (Prettier / Biome) | ❌ none |
| Tests / test runner | ❌ none |
| CI (GitHub Actions, etc.) | ❌ none |
| Git hooks (husky / lint-staged) | ❌ none |
| `.nvmrc` / `engines` pin | ❌ none |
| Deploy | Vercel (`vercel.json`) |
