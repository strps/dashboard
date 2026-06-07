# Code map

"I'm touching X — which files do I open?" A fast index from task to canonical
files. Each row links to the standard that explains the *why*.

## By task

| You're changing… | Open these | Deep dive |
| --- | --- | --- |
| Grid layout, drag, lock, multi-tab | [dashboardStore.ts](../../src/dashboard/store/dashboardStore.ts), [DashboardGrid.tsx](../../src/dashboard/components/DashboardGrid.tsx), [base-widget/](../../src/dashboard/components/base-widget/) | [grid-system.md](grid-system.md), [data-ownership.md](data-ownership.md) |
| A widget's UI/behavior | `modules/<id>/…Widget.tsx` (e.g. [notes/NotesWidget.tsx](../../src/dashboard/modules/notes/NotesWidget.tsx)), [registry.ts](../../src/dashboard/modules/registry.ts) | [modules-and-widgets.md](modules-and-widgets.md) |
| Adding a widget *type* | `WidgetType` union + `DEFAULT_SIZES` in [dashboardStore.ts](../../src/dashboard/store/dashboardStore.ts) | [../execution/add-a-widget.md](../execution/add-a-widget.md) |
| Per-instance config (rendering options) | [base-widget/useWidgetConfig.ts](../../src/dashboard/components/base-widget/useWidgetConfig.ts), widget `schemas.ts` | [data-ownership.md](data-ownership.md) |
| Registering / discovering a module | [modules/index.ts](../../src/dashboard/modules/index.ts), [registry.ts](../../src/dashboard/modules/registry.ts) | [modules-and-widgets.md](modules-and-widgets.md) |
| A `/settings` page | [app/settings/[module]/[page]/page.tsx](../../src/app/settings/), [app/settings/SettingsNav.tsx](../../src/app/settings/SettingsNav.tsx), module `config-pages/` | [../execution/add-a-config-page.md](../execution/add-a-config-page.md) |
| Auth / sessions / sign-up gating | [lib/auth.ts](../../src/lib/auth.ts), [lib/dal/session.ts](../../src/lib/dal/session.ts), [proxy.ts](../../src/proxy.ts) | [auth-and-data-access.md](auth-and-data-access.md) |
| Reading/writing user data | [lib/dal/](../../src/lib/dal/) or module `dal.ts` | [auth-and-data-access.md](auth-and-data-access.md) |
| Server actions (validation + delegation) | module `actions.ts`, [dashboard/actions.ts](../../src/dashboard/actions.ts) | [auth-and-data-access.md](auth-and-data-access.md) |
| DB schema / tables | [lib/db/schema.ts](../../src/lib/db/schema.ts), module `db.ts` (e.g. [time-management/db.ts](../../src/dashboard/modules/time-management/db.ts)) | [database.md](database.md) |
| Migrations | [drizzle.config.ts](../../drizzle.config.ts), [drizzle/](../../drizzle/) | [../automation/database-migrations.md](../automation/database-migrations.md) |
| DB driver / connection | [lib/db/index.ts](../../src/lib/db/index.ts) | [database.md](database.md) |
| Routing / app shell | [app/page.tsx](../../src/app/page.tsx), [app/layout.tsx](../../src/app/layout.tsx) | [architecture.md](architecture.md) |
| Auth route handler | [app/api/auth/[...all]/route.ts](../../src/app/api/auth/) | [auth-and-data-access.md](auth-and-data-access.md) |
| Build / deploy config | [next.config.ts](../../next.config.ts), [vercel.json](../../vercel.json) | [../automation/build-and-deploy.md](../automation/build-and-deploy.md) |
| Lint config | [eslint.config.mjs](../../eslint.config.mjs) | [../automation/linting.md](../automation/linting.md) |
| Global styles / theme | [app/globals.css](../../src/app/globals.css), [postcss.config.mjs](../../postcss.config.mjs) | [../conventions/styling.md](../conventions/styling.md) |

## The three "always touch together" sets

Some changes span multiple files by design — miss one and it silently won't work:

- **New widget type** = `WidgetType` union **+** `DEFAULT_SIZES` (both in
  `dashboardStore.ts`) **+** the widget's `WidgetDefinition` **+** the module's
  `defineModule({ widgets })`.
- **New module** = the above **+** `import "./<module-id>";` in `modules/index.ts`
  (without it, `defineModule` never runs).
- **New table** = schema in `schema.ts`/module `db.ts` **+** the file path in
  `drizzle.config.ts` `schema: [...]` **+** a hand-written migration in `drizzle/`.

## Canonical reference modules

- **notes** — cleanest single-widget module end-to-end (`index.ts`, `schemas.ts`,
  `actions.ts`, `NotesWidget.tsx`, `notesLibraryContext.tsx`,
  `config-pages/NotesTab.tsx`).
- **time-management** — multi-widget module with `widgets/<id>/` subfolders and a
  relational `db.ts`/`dal.ts`.
