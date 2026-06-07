# Linting (and what's not here)

## ESLint

The only linter/quality tool configured. Config:
[../../eslint.config.mjs](../../eslint.config.mjs) — ESLint **flat config**.

- Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`.
- Ignores `.next/**`, `out/**`, `build/**`, `next-env.d.ts`.

Run it:

```bash
pnpm lint
```

There is no separate type-check script; rely on `pnpm build` (and the editor) for
type errors, and `pnpm lint` for lint rules.

## Deliberately absent

Do not assume these exist — they don't, and AI agents should not invent commands
for them:

- **No Prettier or Biome.** Formatting follows the surrounding code by hand. Match
  the style of the file you're editing.
- **No tests / test runner** (no vitest, jest, Playwright). There is no
  `pnpm test`. Verify changes by running the app — see
  [../execution/README.md](../execution/README.md).
- **No git hooks** (no husky / lint-staged). Nothing runs automatically on commit.
- **No CI.** See [build-and-deploy.md](build-and-deploy.md).
- **No Node version pin** (`.nvmrc` / `engines`). Use a current LTS Node that
  supports Next.js 16.

Because nothing runs automatically, **run `pnpm lint` yourself before opening a
PR** ([pre-PR checklist](../execution/templates/pr-checklist.md)).
