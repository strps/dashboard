# Modules and widgets

The dashboard is extended almost entirely through **modules**. The only thing the
dashboard reads is the registry populated by `defineModule(...)`.

## Concepts

- **Module** — an isolated feature area (e.g. `time-management`, `notes`,
  `cheatsheet`). A module owns one or more widgets and optionally one or more
  **config pages** under `/settings/<module-id>/<page-slug>`. It also owns its own
  zod schemas, server actions, and DAL/db files. A module declares itself by
  calling `defineModule(...)` from its `index.ts`.
- **Widget** — a draggable tile on the grid. It has a main `component` and may
  also declare a `configDialog`, `configSchema` + `defaultConfig`, and/or a
  `provider` (see below and [data-ownership.md](data-ownership.md)).
- **Config page** — a full `/settings/...` route for settings that affect **all
  instances** of a widget (catalogs, libraries, user-wide preferences). The
  dynamic route `app/settings/[module]/[page]/page.tsx` resolves it from the
  registry; `SettingsNav` is auto-built from `MODULES`.

## The registry API

Defined in [../../src/dashboard/modules/registry.ts](../../src/dashboard/modules/registry.ts):

```ts
interface WidgetDefinition<TConfig = unknown> {
  type: WidgetType;                 // must match a literal in the WidgetType union
  label: string;
  defaultSize: { w: number; h: number };
  minW?: number; maxW?: number; minH?: number; maxH?: number;
  component: ComponentType<WidgetComponentProps>;        // { id: string }
  configDialog?: ComponentType<WidgetConfigDialogProps>; // { widgetId, onClose }
  provider?: ComponentType<{ children: ReactNode }>;
  configSchema?: ZodType<TConfig>;
  defaultConfig?: TConfig;
}

interface ConfigPageDefinition {
  slug: string;            // URL: /settings/<module-id>/<slug>
  label: string;
  icon?: LucideIcon;
  component: ComponentType;
  description?: string;
  adminOnly?: boolean;
}

interface ModuleDefinition {
  id: string;              // kebab-case URL slug, e.g. "time-management"
  label: string;
  icon?: LucideIcon;
  widgets: WidgetDefinition[];
  configPages?: ConfigPageDefinition[];
}

function defineModule(mod: ModuleDefinition): ModuleDefinition
function getModule(id: string): ModuleDefinition | undefined
function getConfigPage(moduleId, slug): { module, page } | undefined
```

`defineModule` pushes the module into `MODULES` and registers each widget into
`WIDGET_REGISTRY` (keyed by `WidgetType`). It runs as a **side effect** of
importing the module — so every module must be imported in
[../../src/dashboard/modules/index.ts](../../src/dashboard/modules/index.ts):

```ts
import "./time-management";
import "./notes";
// …add one line per module
```

## Module layout

```
src/dashboard/modules/<module-id>/
  index.ts                   defineModule({ id, label, icon, widgets, configPages })
  db.ts                      drizzle tables owned by this module (optional)
  schemas.ts                 zod schemas + TS types (optional)
  dal.ts                     "server-only" DAL functions (optional)
  actions.ts                 "use server" actions delegating to dal.ts (optional)
  config-pages/<Page>.tsx    client components surfaced as /settings/<module-id>/<slug>
  widgets/<widget-id>/       one folder per widget owned by this module
    <Name>Widget.tsx         "use client" — exports component + WidgetDefinition
    use<Name>.ts             per-instance hook
    schemas.ts, actions.ts   optional, if the widget has its own persistence
```

Single-widget modules (`notes`, `weather`, `stats`) collapse the `widgets/` layer
— the widget file sits at the module root.

## Current module inventory

> **A map, not the source of truth** — current as of writing and likely to drift.
> The authoritative list is what's imported in
> [modules/index.ts](../../src/dashboard/modules/index.ts) and registered via
> `defineModule`. If this disagrees with the code, the code wins.

| Module id | Label | Widgets (`WidgetType`) | Config pages |
| --- | --- | --- | --- |
| `notes` | Notes | `notes` | `notes` |
| `time-management` | Time management | `clock`, `activitySelector`, `calendar`, `calendarProperties`, `timeChart` | `activities`, `tags` |
| `stats` | Stats | `stats` | — |
| `weather` | Weather | `weather` (stub) | — |
| `cheatsheet` | Cheatsheet | `cheatsheet` | — (legacy route `/settings/cheatsheet`) |

The full `WidgetType` union and per-type `DEFAULT_SIZES` live in
[dashboardStore.ts](../../src/dashboard/store/dashboardStore.ts).

## Where does a setting belong?

| The setting affects… | Put it in… | Mechanism |
| --- | --- | --- |
| One widget instance's **rendering** (clock mode, filter buttons, active tab) | `configSchema` + `defaultConfig` on the widget | `useWidgetConfig(id)`, persists with grid state |
| One widget instance's **content** (note blocks, etc.) | a dedicated table keyed by `widgetInstanceId` | server action + DAL |
| **Every instance** of a widget (catalogs, libraries) | a module `configPage` + per-user table + a `provider` | shared context |

Full treatment with code: [data-ownership.md](data-ownership.md).

## Canonical example

The **notes** module is the cleanest end-to-end reference: `index.ts`,
`schemas.ts`, `actions.ts`, `NotesWidget.tsx`, `notesLibraryContext.tsx`, and
`config-pages/NotesTab.tsx`. The **time-management** module shows the multi-widget
layout with `widgets/<id>/` subfolders and a relational `db.ts`/`dal.ts`.

To build one, follow [../execution/add-a-module.md](../execution/add-a-module.md).
