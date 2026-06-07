# Data ownership

> **Widgets own their own data.** The dashboard store carries only the layout
> (instances, grid positions, lock, tabs) plus an opaque per-instance `config`
> blob. **Do not add new zustand stores.** Everything else is React state or a
> dedicated table.

There are three places state can live. Pick by *scope*.

## 1. Per-instance config (rendering options)

For settings that affect a single widget instance — clock mode, which tags are
filter buttons, the selected sub-tab.

- Declare `configSchema` (zod) and `defaultConfig` on the `WidgetDefinition`.
- Read/write with `useWidgetConfig(id)`:

  ```tsx
  import { useWidgetConfig } from "@/dashboard/components/base-widget/useWidgetConfig";
  const [config, setConfig] = useWidgetConfig<ExampleConfig>(id);
  ```

- The value is stored on `WidgetInstance.config` and **persists with the grid
  state**: localStorage immediately, then a 500 ms-debounced server save (the same
  path as every other layout mutation) writes to
  `dashboard_layout.instances[i].config`.
- Removing the widget removes its config — no orphan rows.
- The hook **safe-parses** the stored value against `configSchema` on every read
  and falls back to `defaultConfig` on mismatch (handles stale localStorage / old
  rows).

Canonical examples: the activity-selector widget (config cycled by a button on the
widget, no dialog) and the cheatsheet widget (config edited via the gear-icon
`configDialog`).

## 2. Per-instance content

For substantial per-instance data (note blocks, etc.): a dedicated table keyed by
`widgetInstanceId`, accessed via server actions → DAL. Three sub-patterns:

- **Discrete mutations** (add / remove / toggle / reorder / CRUD): `useOptimistic`
  + `useTransition`. Apply the optimistic update, await the server action, commit
  the canonical row into base `useState` on success. Optimistic state is
  auto-discarded when the transition ends, so failures revert with no manual
  rollback. Reference: `useActivitySelector.ts`.
- **Continuous edits** (text typed into a field): plain `useState` + a
  module-level debounced `saveAction` (~500 ms; flush immediately on structural
  changes). `useOptimistic` is intentionally **not** used per keystroke — each
  keystroke would be its own transition and the optimistic value would churn.
  Reference: `useNotes.ts` (combines both patterns).
- **Hydration**: on mount the hook calls `get…Action` once and seeds `useState`; a
  local `hydrated` flag prevents re-fetching.

## 3. Shared (per-user) widget data

For a per-user **library** that's identical across every instance of a widget
type (e.g. cheatsheet entries + tags, the notes library):

- Storage uses normal **user-scoped** tables — *not* keyed by `widgetInstanceId`.
  See [../../src/lib/dal/cheatsheet.ts](../../src/lib/dal/cheatsheet.ts).
- CRUD UI lives on a module **config page** (`/settings/<module-id>/<slug>`), not
  in the per-instance config dialog. See
  [time-management/config-pages/ActivitiesTab.tsx](../../src/dashboard/modules/time-management/config-pages/ActivitiesTab.tsx).
- Per-instance choices made *on top of* the shared library (e.g. which tags become
  filter buttons in *this* cheatsheet) use mechanism #1 (`useWidgetConfig` +
  `configSchema`).
- Shared state lives in a **React Context provider** exported from the module and
  registered via `provider:` on the widget definition. The grid composes the
  provider around itself whenever any instance of that widget type is mounted; it
  hydrates once and is consumed via a `use…Library()` hook. See
  [cheatsheet/libraryContext.tsx](../../src/dashboard/modules/cheatsheet/libraryContext.tsx)
  and [notes/notesLibraryContext.tsx](../../src/dashboard/modules/notes/notesLibraryContext.tsx).
- If a child (e.g. a config dialog) needs the same per-instance state, **pass it
  down via props** — do not call the per-instance hook twice from different
  subtrees, since each call gets its own `useState`.

## The store, precisely

[dashboardStore.ts](../../src/dashboard/store/dashboardStore.ts) holds multi-tab
metadata (`dashboards`, `activeDashboardId`, `dashboardData`), the derived active
`layout` / `instances` / `locked`, and a `hydrated` flag. Mutations call
`persist()`, which writes localStorage synchronously and schedules a 500 ms
debounced `saveDashboardLayoutAction`. Server save failures are swallowed —
localStorage is the source of truth for that tab (optimistic). That is the entire
remit of zustand here; nothing widget-specific belongs in it.
