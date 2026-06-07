<!--
Pre-PR checklist. There is no CI and no test suite, so these local checks are the
only gate before review. Copy into your PR description.
-->

# Pre-PR checklist

## Quality gates (run locally)

- [ ] `pnpm lint` passes
- [ ] `pnpm build` (or the editor) is type-clean
- [ ] No formatter to run — formatting matches the surrounding code by hand
      (there is no Prettier/Biome)

## Manual verification (no automated tests exist)

- [ ] Ran `pnpm dev` and exercised the change end-to-end
- [ ] Persistence checked: reloaded the page and state survived
- [ ] If grid-related: tested locked **and** unlocked; drag/remove behaves
- [ ] If admin-only: confirmed non-admins can't reach it

## Data / auth

- [ ] Any user-scoped read/write goes through the DAL, scoped by `userId`
- [ ] Server actions validate input with zod
- [ ] New tables/columns have a hand-written migration; `pnpm db:migrate` applied
- [ ] New public route (rare) → `PUBLIC_ROUTE_PREFIXES` in `src/proxy.ts` updated

## Docs & hygiene

- [ ] Updated the relevant doc under `docs/` if behavior/structure changed
- [ ] Added a [CHANGELOG.md](../../../CHANGELOG.md) entry; for non-trivial work,
      logged a [run](../runs/README.md)
- [ ] No secrets committed; `.env.example` updated for any new env var
- [ ] Commit messages follow `docs/conventions/git.md` (type prefix, lowercase, no period)
- [ ] Branched off `main`; PR opened (not pushed straight to `main`)
