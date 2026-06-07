<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project structure

```
src/
  app/                          Next.js App Router pages
    page.tsx                    server component → renders <DashboardGrid />
    layout.tsx                  root layout
    sign-in/, sign-up/          auth pages
    settings/                   user + admin settings
      [module]/[page]/page.tsx  dynamic route → renders a module's configPage
      security/                 admin-only
      cheatsheet/               legacy route (not yet a module page)
    api/auth/[...all]/          Better Auth handler
  proxy.ts                      route gate (middleware-style) — OPTIMISTIC ONLY
  dashboard/
    components/                 shared shell: DashboardGrid, Header, Dialog, base-widget/
    store/dashboardStore.ts     LAYOUT-ONLY zustand store (instances + grid + lock)
    actions.ts                  server actions for layout persistence
    modules/
      registry.ts               defineModule() + MODULES + WIDGET_REGISTRY
      index.ts                  side-effect imports — every module listed here
      <module-id>/              one directory per module (see below)
  lib/
    auth.ts, auth-client.ts     Better Auth server + client
    dal/                        data-access layer — ALL user-scoped DB reads
    db/schema.ts                Drizzle schema (user, session, dashboard_layout, note, …)
    db/index.ts                 driver switches by NODE_ENV (postgres.js / neon)
drizzle/                        generated migrations
```

# Auth + data access (non-negotiable)

## GitHub OAuth gotcha — email required

Better Auth's GitHub provider fetches the user's email from `/user/emails` (requires `user:email` scope, already in the defaults). If the user's GitHub account has **no email configured**, that fetch returns nothing and the sign-in fails with `email_not_found`.

Fix on the user side: add an email at github.com → Settings → Emails.

The [auth config](src/lib/auth.ts) also has a `mapProfileToUser` fallback that synthesizes `{id}+{login}@users.noreply.github.com` so the error doesn't surface as a blank redirect. If a GitHub user with no real email needs access, add their noreply address to the `allowed_email` table. See [GitHub noreply email format](https://docs.github.com/en/account-and-profile/reference/email-addresses-reference#your-noreply-email-address).

- [src/proxy.ts](src/proxy.ts) is an **optimistic UX gate** — it only checks that a session cookie *exists*. It does **not** verify the signature or hit the DB. Never treat it as a security boundary.
- Real authorization lives in [src/lib/dal/](src/lib/dal/). Every server-side read of user-scoped data calls `verifySession()` (or `verifyAdmin()`) from [session.ts](src/lib/dal/session.ts), which runs `auth.api.getSession` and returns the verified `userId`.
- DAL functions are marked `import "server-only"` and scope every query by `userId`. Do not bypass them from server actions, route handlers, or RSCs.
- Server actions live next to the feature that uses them (e.g. [src/dashboard/modules/notes/actions.ts](src/dashboard/modules/notes/actions.ts)) and delegate to the DAL — they do **not** call the DB directly. They validate input with zod schemas defined in `schemas.ts` next to the action.

# Modules and widgets

## Concepts

- **Module** — an isolated feature area (e.g. `time-management`, `notes`, `cheatsheet`). A module owns one or more widgets and (optionally) one or more **config pages** that show up under `/settings/<module-id>/<page-slug>`. Modules also own their own zod schemas, server actions, and DAL/db files so they can be developed in isolation. Each module declares itself by calling `defineModule(...)` from its `index.ts` — that's the only thing the dashboard reads.
- **Widget** — a draggable tile rendered on the dashboard grid. A widget has a main `component`. It MAY also declare:
  - `configDialog` — UI for per-instance rendering options. Rendered inside a `Dialog` opened from the gear icon on the widget.
  - `configSchema` + `defaultConfig` — zod schema + default for the per-instance config persisted on `WidgetInstance.config` (travels with the grid state). Read/written via `useWidgetConfig(id)`. A widget can persist config even without a `configDialog` (e.g. activity-selector's clock mode is cycled by a button on the widget itself).
  - `provider` — a React Context provider mounted around the grid whenever any instance of the widget type is present. Use for per-user data shared across multiple instances (e.g. cheatsheet library).
- **Config page** — a full `/settings/...` route that the module exposes for settings affecting **all instances** of its widgets (catalogs, libraries, user-wide preferences). The dynamic route `app/settings/[module]/[page]/page.tsx` resolves the page from `MODULES` and renders the component declared by the module. The `SettingsNav` is auto-built from `MODULES`.

> **Where does this setting belong?**
> - Per-instance **rendering options** (filter buttons, clock mode, selected tab, etc.) → `configSchema` + `defaultConfig` on the widget definition, read/written with `useWidgetConfig(id)`. Persists with the grid state (localStorage + the `dashboard_layout.instances` JSONB row). A `configDialog` is optional UI on top of this; the persistence is the same either way.
> - Per-instance **content/data** (note blocks, etc.) → dedicated table keyed by `widgetInstanceId`. See [note](src/lib/db/schema.ts) for the canonical example.
> - Affects every instance of the widget (catalogs, libraries) → a `configPage` on the module + a per-user table + a `provider` for shared in-memory state.

## Module layout

```
src/dashboard/modules/<module-id>/
  index.ts                   defineModule({ id, label, icon, widgets, configPages })
  db.ts                      drizzle tables owned by this module (optional)
  schemas.ts                 zod schemas + TS types (optional)
  dal.ts                     "server-only" DAL functions (optional)
  actions.ts                 "use server" actions delegating to dal.ts (optional)
  config-pages/              client components surfaced as /settings/<module-id>/<slug>
    <Page>.tsx
  widgets/<widget-id>/       one folder per widget owned by this module
    <Name>Widget.tsx         "use client" — exports component + WidgetDefinition
    use<Name>.ts             per-instance hook
    schemas.ts, actions.ts   optional if the widget has its own persistence
```

Single-widget modules (e.g. `notes`, `weather`, `stats`) collapse the `widgets/` layer — the widget file sits at the module root.

## Adding a module

1. Create `src/dashboard/modules/<module-id>/`.
2. For each widget, add its `WidgetType` literal to the `WidgetType` union in [src/dashboard/store/dashboardStore.ts](src/dashboard/store/dashboardStore.ts) and a default size in `DEFAULT_SIZES`.
3. Implement each widget as a `"use client"` file that exports both the component and a `WidgetDefinition`:

   ```tsx
   // src/dashboard/modules/example/widgets/example/ExampleWidget.tsx
   "use client";
   import { BaseWidget } from "../../../../components/base-widget/BaseWidget";
   import { useWidget } from "../../../../components/base-widget/useWidget";
   import type { WidgetComponentProps, WidgetDefinition } from "../../../registry";

   export function ExampleWidget({ id }: WidgetComponentProps) {
     const { locked, onRemove } = useWidget(id);
     return (
       <BaseWidget id={id} locked={locked} onRemove={onRemove}>
         {/* widget content */}
       </BaseWidget>
     );
   }

   export const exampleWidget: WidgetDefinition = {
     type: "example",
     label: "Example",
     defaultSize: { w: 3, h: 3 },
     minW: 2, minH: 2,
     component: ExampleWidget,
     // configDialog?:  per-instance options dialog (opened by the gear icon)
     // configSchema?:  zod schema for the per-instance config persisted on
     //                 WidgetInstance.config; read/written via useWidgetConfig(id)
     // defaultConfig?: returned by useWidgetConfig when no config is stored
     // provider?:      shared per-user state provider
   };
   ```

4. Implement each config page as a `"use client"` component under `config-pages/`. It's just a normal React component — the dynamic route renders it inside a titled wrapper.

5. Create `src/dashboard/modules/<module-id>/index.ts` and call `defineModule(...)`:

   ```ts
   import { Activity } from "lucide-react";
   import { defineModule } from "../registry";
   import { exampleWidget } from "./widgets/example/ExampleWidget";
   import { SomeTab } from "./config-pages/SomeTab";

   defineModule({
     id: "example",                 // URL: /settings/example/...
     label: "Example",
     icon: Activity,
     widgets: [exampleWidget],
     configPages: [
       {
         slug: "some-tab",          // URL: /settings/example/some-tab
         label: "Some tab",
         icon: Activity,
         component: SomeTab,
         description: "Optional one-liner shown beneath the page title.",
         // adminOnly?: true,
       },
     ],
   });
   export {};
   ```

6. Add `import "./<module-id>";` to [src/dashboard/modules/index.ts](src/dashboard/modules/index.ts) — `defineModule` runs as a side effect of importing the module's index.

## Widget data ownership

**Widgets own their own data.** The dashboard store carries the layout (instances, grid positions, lock) plus an opaque per-instance `config` blob (rendering options). Widget *content* (note blocks, etc.) lives in React state and dedicated per-instance tables. See [useNotes.ts](src/dashboard/modules/notes/useNotes.ts) for the content pattern.

### Per-instance config (rendering options)

For settings that affect only one widget instance — clock mode, filter buttons, selected sub-tab — declare `configSchema` (zod) and `defaultConfig` on the `WidgetDefinition` and read/write the value via `useWidgetConfig(id)`:

```tsx
import { useWidgetConfig } from "@/dashboard/components/base-widget/useWidgetConfig";

const [config, setConfig] = useWidgetConfig<ExampleConfig>(id);
```

The value is stored on `WidgetInstance.config` and persists with the grid state: localStorage immediately, then the same 500 ms-debounced server save as the other layout mutations writes to `dashboard_layout.instances[i].config`. Removing the widget removes the config along with the instance — no orphan rows. The hook safe-parses the stored value on every read and falls back to `defaultConfig` if it doesn't match the schema (handles stale localStorage / older rows). The canonical examples are [activity-selector](src/dashboard/modules/time-management/widgets/activity-selector/ActivitySelectorWidget.tsx) (no `configDialog`, just a button on the widget) and [cheatsheet](src/dashboard/modules/cheatsheet/CheatsheetWidget.tsx) (config edited via the gear-icon `configDialog`).

### Per-instance content

Persistence pattern (used by notes, activity selector, layout itself):
- **Discrete mutations** (add, remove, toggle, reorder, CRUD): wrap in `useOptimistic` + `useTransition`. Apply the optimistic update first, await the server action, commit the canonical row into base `useState` on success. The optimistic state is auto-discarded when the transition ends, so failures revert with no manual rollback. See [useActivitySelector.ts](src/dashboard/modules/time-management/widgets/activity-selector/useActivitySelector.ts).
- **Continuous edits** (text typed into a field): plain `useState` mutation + a module-level debounced `saveAction` call (typical debounce ~500ms; flush immediately on structural changes). `useOptimistic` is intentionally NOT used per keystroke — each keystroke would be its own transition and the optimistic value would churn. See [useNotes.ts](src/dashboard/modules/notes/useNotes.ts) which combines both patterns.
- **Hydration**: on mount, the hook calls `get…Action` once and seeds `useState`; a local `hydrated` flag prevents re-fetching.

### Shared (per-user) widget data

Some widgets surface a per-user **library** that's the same across every instance of that widget (e.g. cheatsheet entries + tags). For these:

- Storage uses normal user-scoped tables — **not** keyed by `widgetInstanceId`. See [src/lib/dal/cheatsheet.ts](src/lib/dal/cheatsheet.ts).
- CRUD UI lives on a module **config page** (`/settings/<module-id>/<slug>`), not in the widget's per-instance config dialog. See [time-management/config-pages/ActivitiesTab.tsx](src/dashboard/modules/time-management/config-pages/ActivitiesTab.tsx).
- Per-instance choices made on top of the shared library (e.g. which tags become filter buttons in *this* cheatsheet) use the per-instance config mechanism above (`useWidgetConfig` + `configSchema`). See [cheatsheet/config/ConfigPanel.tsx](src/dashboard/modules/cheatsheet/config/ConfigPanel.tsx) — the panel receives `filterButtons` + `updateFilterButtons` from the per-instance hook and writes back into `WidgetInstance.config`.
- Shared library state lives in a React Context provider exported from the module directory and registered via `provider:` on the widget definition. The dashboard grid composes the provider around the grid whenever any instance of the widget type is mounted. See [cheatsheet/libraryContext.tsx](src/dashboard/modules/cheatsheet/libraryContext.tsx) — it hydrates once and is consumed by every cheatsheet instance via `useCheatsheetLibrary()`.
- Per-instance widget content/state that isn't config should live in `useState` inside the widget component (or its `use<Name>` hook). If a child dialog (e.g. the config panel) needs the same state, pass it down via props — do NOT call the per-instance hook twice from different subtrees, since each call would get its own `useState`.

## Widget interactivity vs. lock

The dashboard has a global `locked` flag. When `locked === false`, [BaseWidget](src/dashboard/components/base-widget/BaseWidget.tsx) wraps content in a `drag-handle` div — the entire widget becomes draggable. Inside widgets, **disable interactive controls when unlocked** and call `e.stopPropagation()` on `onMouseDown` for any nested clickable/typeable element, otherwise the grid drag handler eats the event. See [NotesWidget](src/dashboard/modules/notes/NotesWidget.tsx) for the pattern.

# Grid system gotchas

- Use `verticalCompactor` — it pushes widgets on drag and closes gaps on remove. Do **not** switch to `noCompactor`.
- Place new widgets at `x: 0, y: maxY` (computed from current layout). Do **not** use `y: Infinity` — `verticalCompactor` won't resolve it.
- [DashboardGrid](src/dashboard/components/DashboardGrid.tsx) is the client boundary (`"use client"`). Pages stay as server components and pass server-only data (e.g. `isAdmin`) down as props.

# Conventions

- Path alias: `@/` → `src/`.
- Styling: Tailwind v4 (no `tailwind.config.*` — config lives in `globals.css`).
- State: the dashboard layout (instances, grid, lock) uses a single zustand store at [src/dashboard/store/dashboardStore.ts](src/dashboard/store/dashboardStore.ts). Everything else uses React state — per-instance widget state via `useState`, discrete mutations via `useOptimistic` + `useTransition`, shared per-user state via a React Context provider registered through the widget definition. Do not add new zustand stores.
- Forms: react-hook-form + `@hookform/resolvers` + zod.
- Icons: `lucide-react`.
- DB: Drizzle ORM. Schemas can live in [src/lib/db/schema.ts](src/lib/db/schema.ts) (shared) or in a module's own `db.ts` (e.g. [time-management/db.ts](src/dashboard/modules/time-management/db.ts)). Every schema file must be listed in [drizzle.config.ts](drizzle.config.ts). Migration commands: `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:push`, `pnpm db:studio`. **Always generate migrations with `pnpm db:generate --custom --name=<migration_name>`** — this produces an empty SQL file you fill in by hand (data migrations, PK swaps, multi-step ALTER, and ordinary column/table changes alike). Do NOT rely on auto-generated schema-diff migrations: this project's drizzle snapshots are intentionally not kept in sync (migrations have historically been applied via `db:push`), so diff-based generation is unreliable. Write the SQL yourself to match the schema change.
- Sign-ups are gated by the `allowed_email` table; admins manage it at `/settings/security`. Don't add new public routes without updating `PUBLIC_ROUTE_PREFIXES` in [src/proxy.ts](src/proxy.ts).
