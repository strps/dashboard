<!--
Copy this file to a scratch location (or your PR description) and fill it in.
Keep it short — it's a thinking tool, not a deliverable.
-->

# Feature plan: <name>

## Context

Why are we doing this? What problem or need does it address, what prompted it, and
what's the intended outcome? (1–3 sentences.)

## Scope

- Module: <existing module-id | NEW module-id>
- Surface: <widget | config page | field | backend only>
- Out of scope: <what we are explicitly not doing>

## Where state lives

Use the decision table in `../../standards/data-ownership.md`.

- [ ] Per-instance rendering option → `configSchema` + `defaultConfig` + `useWidgetConfig(id)`
- [ ] Per-instance content → table keyed by `widgetInstanceId` + action + DAL
- [ ] Shared per-user library → config page + user-scoped table + provider
- [ ] No new state (UI/logic only)

Notes: <which fields, which table, which config shape>

## Data & auth

- New/changed tables or columns? <yes/no — if yes, list them>
  - Migration: `pnpm db:generate --custom --name=<…>` then hand-write SQL.
- New user-scoped reads/writes? <list DAL functions, each scoped by `userId`>
- New server actions? <list `*Action` names + the zod schema each validates>
- New public route? <if yes, update `PUBLIC_ROUTE_PREFIXES` in `src/proxy.ts`>
- Admin-only? <if yes, `verifyAdmin()` in DAL and/or `adminOnly: true` on the config page>

## Files to touch

- `src/dashboard/modules/<id>/…`
- `src/lib/dal/…` or `<module>/dal.ts`
- `src/lib/db/schema.ts` or `<module>/db.ts`
- `drizzle/NNNN_<name>.sql`
- Registry wiring: `WidgetType` union + `DEFAULT_SIZES` in `dashboardStore.ts`,
  `defineModule(...)`, and an import in `modules/index.ts` (for new modules/widgets)

## Execution recipe

Which guide applies?
- [ ] `../../execution/add-a-widget.md`
- [ ] `../../execution/add-a-module.md`
- [ ] `../../execution/add-a-config-page.md`

## Verification

How will I confirm this works end-to-end? (There are no automated tests.)

- [ ] `pnpm lint` clean
- [ ] `pnpm build` (or editor) type-clean
- [ ] Ran the app (`pnpm dev`) and manually exercised: <steps>
- [ ] Migration applied locally (`pnpm db:migrate`) and data looks right in `pnpm db:studio`
