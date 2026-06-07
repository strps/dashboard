# Planning

How to plan a change in this codebase before writing it. The goal is to decide
*where* code goes (this project is highly structured, so most of planning is
placement) and to surface schema/auth implications early.

## When to plan formally

| Change | Plan effort |
| --- | --- |
| Typo, copy tweak, one-line fix | None — just do it. |
| New widget, new config page, new field | A short [feature plan](templates/feature-plan.md). |
| New module, schema change, cross-cutting refactor, new dependency | A [feature plan](templates/feature-plan.md); add an [ADR](templates/adr.md) if it sets a precedent or rejects an obvious alternative. |

## Planning steps

1. **Restate the outcome** in one or two sentences.
2. **Locate the scope.** Which module does this belong to? Is it a new module?
   Skim [../standards/modules-and-widgets.md](../standards/modules-and-widgets.md).
3. **Answer "where does this state live?"** using the decision table in
   [../standards/data-ownership.md](../standards/data-ownership.md):
   - one widget instance's rendering option → `useWidgetConfig` + `configSchema`;
   - one instance's content → dedicated table keyed by `widgetInstanceId`;
   - shared across all instances → config page + user-scoped table + provider.
4. **Check the data/auth path.** New tables or columns → a hand-written migration
   ([../automation/database-migrations.md](../automation/database-migrations.md)).
   Any new user-scoped read/write → a DAL function scoped by `userId` plus a
   server action ([../standards/auth-and-data-access.md](../standards/auth-and-data-access.md)).
   New public route → update `PUBLIC_ROUTE_PREFIXES` in `proxy.ts`.
5. **List the files to touch** and pick the matching execution recipe in
   [../execution/](../execution/).
6. **Write down how you'll verify it** (there are no automated tests — you must
   run the app).

## Templates

- [templates/feature-plan.md](templates/feature-plan.md) — copy for any non-trivial change.
- [templates/adr.md](templates/adr.md) — copy when recording an architectural decision.

Store ADRs in this folder as `adr-NNNN-short-title.md` (zero-padded, incrementing).

## Audits

- [module-standards-audit.md](module-standards-audit.md) — which modules don't follow
  the standards and how to refactor them. `cheatsheet` was migrated to a registered
  config page (2026-06-07); `stats`/`weather` remain stubs pending implementation.
