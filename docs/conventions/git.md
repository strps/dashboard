# Git & commits

## Commit messages

Conventional-commit style, taken from the actual history:

```
feat: make notes a shared library with multi-note tabs
fix: refresh calendar when activity selector changes entry
refactor: introduce module system + add calendar widget
chore: add vercel.json to run migrations before build
docs: add comprehensive AGENTS.md with project structure …
```

Rules:

- Prefix with a type: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`.
- Lowercase summary, **no trailing period**.
- Imperative/action phrasing: "add X", "switch Y", "introduce Z" — not "updated".
- Keep the summary to roughly one line (~50 chars after the prefix). Add a body
  only when the *why* isn't obvious from the summary.

## Branching & PRs

- `main` is the default and integration branch.
- Branch before committing if you're on `main`; open a PR rather than pushing
  directly.
- Run the [pre-PR checklist](../execution/templates/pr-checklist.md) before
  requesting review. There is **no CI** (see
  [../automation/linting.md](../automation/linting.md)), so local checks are the
  only gate.

## What's tracked

- `.env` is gitignored; `.env.example` is committed. Never commit secrets.
- Generated migrations under [../../drizzle/](../../drizzle/) **are** committed —
  they're part of the deploy (`vercel.json` runs `pnpm db:migrate` before build).
