# Feature plan: Configurable dashboard grid layouts

> Status: Proposed
> Date: 2026-06-07

## Context

Every dashboard tab renders its grid with hard-coded constants —
`GRID_WIDTH = 1200` and `gridConfig={{ cols: 12, rowHeight: 80, margin: [12, 12] }}`
in [DashboardGrid.tsx](../../src/dashboard/components/DashboardGrid.tsx). Users
who want a denser/sparser grid, or a tab that fits the viewport without page
scroll (e.g. an always-visible kiosk-style dashboard), have no way to adjust
this per dashboard. This plan adds per-dashboard grid configuration: column
count, row height, and a "fit-to-screen" sizing strategy.

## Scope

- Module: dashboard core (this is grid-shell behavior owned by
  `DashboardGrid`/`dashboardStore`, not a widget module)
- Surface: a per-dashboard settings dialog reachable from `DashboardHeader`,
  plus matching fields on the existing "new dashboard" dialog
- Out of scope: per-widget sizing (`DEFAULT_SIZES`, `minW/maxW/minH/maxH` are
  unchanged), responsive/multi-breakpoint grids, the `custom` dashboard type
  (still a stub — `cols`/`rowHeight` only affect the `widgets` grid)

## Where state lives

- [ ] Per-instance rendering option → `configSchema` + `defaultConfig` + `useWidgetConfig(id)`
- [ ] Per-instance content → table keyed by `widgetInstanceId` + action + DAL
- [ ] Shared per-user library → config page + user-scoped table + provider
- [x] Dashboard-tab layout state — the store's own remit (see
      [data-ownership.md](../standards/data-ownership.md): "the dashboard store
      carries only the layout … plus an opaque per-instance `config` blob")

Notes: grid config is **not** widget data — it's "how does this dashboard's
grid render", the same category as the existing `locked` flag. It belongs on
`DashboardData`/`dashboard_layout` (the per-tab *grid* record), **not** on
`DashboardMeta`/`dashboard` (that table is tab identity: `name`, `type`,
`order`, persisted through separate non-debounced actions).

Concretely:

- Add a `gridConfig` field to `DashboardData` and `DashboardLayoutRecord`:
  `{ cols: number; rowHeight: number; margin: [number, number]; sizing: "scroll" | "fit-to-screen" }`.
- Reuse the existing debounced `persist()` → `scheduleServerSave` →
  `saveDashboardLayoutAction` path that already carries `layout`/`instances`/
  `locked` (`dashboardStore.ts:167-178`) — no new action or save mechanism. A
  `setGridConfig(patch)` store action mirrors `setLayout`/`toggleLocked`:
  merge into `dashboardData[activeId].gridConfig`, call `persist()`.
- Default for dashboards hydrated without a stored `gridConfig` (pre-migration
  rows): `{ cols: 12, rowHeight: 80, margin: [12, 12], sizing: "scroll" }` —
  i.e. today's hard-coded constants. Apply it in `hydrateFromServer`,
  `switchDashboard`, and `addDashboard` (the three places `DashboardData` is
  constructed from a `DashboardLayoutRecord` or created fresh), and as the
  column's SQL default so existing rows read back populated.

> The original sketch proposed a `DashboardConfig` on `DashboardMeta` plus a
> dedicated `updateDashboardConfig` action and its own persistence path. That
> would duplicate the debounced save plumbing `dashboard_layout` already has
> for `locked` — folding it into `DashboardData` is less code, keeps one save
> path per tab, and matches how `locked` (a sibling "how this tab behaves"
> flag) is already modeled.

## Data & auth

- New/changed tables or columns? Yes — add `grid_config jsonb not null` to
  `dashboard_layout`, with a SQL default matching the fallback above.
  - Migration: `pnpm db:generate --custom --name=add-dashboard-grid-config`,
    then hand-write `ALTER TABLE dashboard_layout ADD COLUMN grid_config jsonb
    NOT NULL DEFAULT '{"cols":12,"rowHeight":80,"margin":[12,12],"sizing":"scroll"}'::jsonb`.
- New user-scoped reads/writes? None — `getDashboardLayout`/`saveDashboardLayout`
  in [lib/dal/dashboardLayout.ts](../../src/lib/dal/dashboardLayout.ts) already
  scope by `userId` via `verifySession()`/ownership check; widening
  `DashboardLayoutRecord` is enough.
- New server actions? None — `getDashboardLayoutAction`/`saveDashboardLayoutAction`
  already cover it once the record type carries `gridConfig`.
- New public route? No.
- Admin-only? No.

## Files to touch

- `src/lib/db/schema.ts` — add `gridConfig` jsonb column + `$type<GridConfig>()` to `dashboardLayout`
- `drizzle/NNNN_add_dashboard_grid_config.sql` — hand-written migration (see SQL above)
- `src/lib/dal/dashboardLayout.ts` — extend `DashboardLayoutRecord` with `gridConfig`
- `src/dashboard/store/dashboardStore.ts`:
  - extend `DashboardData`/`DashboardLayoutRecord`-shaped state with `gridConfig`
  - add `DEFAULT_GRID_CONFIG` constant (replaces the inline `12`/`80`/`[12,12]`)
  - add `setGridConfig` action wired through `persist()` (mirrors `toggleLocked`)
  - apply `DEFAULT_GRID_CONFIG` fallback in `hydrateFromServer`, `switchDashboard`,
    `addDashboard`
- `src/dashboard/components/DashboardGrid.tsx`:
  - read `activeTab`'s `gridConfig` (with the same default), pass
    `cols`/`rowHeight`/`margin` into `<GridLayout gridConfig={…}>`
  - add fields for `cols`/`sizing` to the existing "new dashboard" dialog
  - add the fit-to-screen container + measurement (below)
- `src/dashboard/components/DashboardSettingsDialog.tsx` — **new**; reuses
  [Dialog.tsx](../../src/dashboard/components/Dialog.tsx); edits the active
  tab's `cols`/`rowHeight`/`sizing` via `setGridConfig`
- `src/dashboard/components/DashboardHeader.tsx` — add a settings/gear button
  that opens `DashboardSettingsDialog`, visible only `!locked` (same gating as
  the "add widget" affordance)

### Fit-to-screen sizing

When `gridConfig.sizing === "fit-to-screen"`: measure the grid container's
height with a `ResizeObserver`, derive `rowHeight` from that height, the
configured `margin`, and a target row count, and pass the *computed*
`rowHeight` into `<GridLayout gridConfig={…}>` (the user-configured `rowHeight`
becomes the "preferred/base" value used to derive the target row count, not
the literal pixel value). Wrap the grid area in `h-[calc(100vh-<header-height>)]
overflow-hidden` for that tab only — `scroll` sizing and the `custom` tab keep
today's `<main className="p-6">` scrolling behavior. `GRID_WIDTH` stays a fixed
constant; this plan does not make width responsive (a separate concern from
configurable rows/cols, and `react-grid-layout` here takes an explicit `width`).

## Execution recipe

Which guide applies?
- [ ] `../../execution/add-a-widget.md`
- [ ] `../../execution/add-a-module.md`
- [ ] `../../execution/add-a-config-page.md`
- [x] None directly — this is grid-shell work, not a widget/module/config-page.
  Follow [grid-system.md](../standards/grid-system.md)'s compaction rules:
  changing `cols` downward can leave items with `x + w` beyond the new column
  count, so clamp existing layout items when `cols` shrinks (same spirit as the
  `layoutWithConstraints` mapping already in `DashboardGrid.tsx`), and continue
  to use `verticalCompactor` / `y: maxY` for any structural changes.

## Verification

- [ ] `pnpm lint` clean
- [ ] `pnpm build` (or editor) type-clean
- [ ] Ran the app (`pnpm dev`) and manually exercised:
  - create a dashboard with non-default `cols`/`rowHeight`; reload and confirm
    it persists (localStorage *and* server — check `pnpm db:studio` after the
    debounce)
  - open the settings dialog on an existing dashboard and shrink `cols`;
    confirm existing widgets reflow without overlap or going off-grid
  - switch `sizing` to `fit-to-screen`; confirm the grid fills the viewport
    with no page scroll, and that resizing the browser window recalculates row
    height live
  - confirm a dashboard created *before* this change still loads with the
    default 12/80/`[12,12]`/`scroll` config (migration default + store fallback)
  - test locked **and** unlocked (settings button should only appear unlocked,
    per [grid-system.md](../standards/grid-system.md))
- [ ] Migration applied locally (`pnpm db:migrate`) and `grid_config` looks
  right in `pnpm db:studio` for both new and pre-existing rows
