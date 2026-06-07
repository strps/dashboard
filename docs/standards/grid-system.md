# Grid system

The dashboard uses `react-grid-layout`. A few rules are load-bearing.

## Compaction

- Use **`verticalCompactor`** — it pushes widgets on drag and closes gaps on
  remove. **Do not switch to `noCompactor`.**
- Place a new widget at `x: 0, y: maxY`, where `maxY` is computed from the current
  layout: `layout.reduce((m, l) => Math.max(m, l.y + l.h), 0)`. **Do not use
  `y: Infinity`** — `verticalCompactor` won't resolve it. This is exactly what
  `addWidget` does in
  [dashboardStore.ts](../../src/dashboard/store/dashboardStore.ts).

## Layout model

- Each grid item is a `LayoutItem` (`{ i, x, y, w, h }`) keyed by the widget
  instance `id`. A parallel `WidgetInstance[]` carries `{ id, type, config? }`.
- New instance ids come from `crypto.randomUUID()` (falling back to
  `widget-${Date.now()}`).
- Default sizes per `WidgetType` are in `DEFAULT_SIZES`; widgets may further
  constrain via `minW/maxW/minH/maxH` on their `WidgetDefinition`.

## Client boundary & lock

- [DashboardGrid](../../src/dashboard/components/DashboardGrid.tsx) is the
  `"use client"` boundary. Pages stay server components and pass server-only data
  (e.g. `isAdmin`) down as props.
- A global `locked` flag governs interactivity. When unlocked, `BaseWidget` wraps
  content in a `drag-handle` and the whole tile is draggable; nested interactive
  elements must `e.stopPropagation()` on `onMouseDown` and disable themselves
  while unlocked. See [../conventions/styling.md](../conventions/styling.md) and
  [NotesWidget](../../src/dashboard/modules/notes/NotesWidget.tsx).

## Persistence

Layout, instances, and lock persist via the zustand store: localStorage
immediately, then a 500 ms-debounced `saveDashboardLayoutAction` to
`dashboard_layout`. Multi-tab support means each dashboard tab has its own
`DashboardData` in `dashboardData[dashboardId]`. Details in
[data-ownership.md](data-ownership.md).
