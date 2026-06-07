# Calendar: always-selectable entries + circle resize handles — 2026-06-07

> Status: in progress
> Plan: `~/.claude/plans/in-the-calendar-widget-greedy-milner.md` (local plan, not in repo).

## Outcome

Calendar day-view entries are now selectable whenever the widget is locked,
regardless of the calendar's `editor` config flag — so the
[calendar-properties widget](../../standards/codemap.md) can be used to inspect
any entry without first turning on editor mode. The resize affordance changed
from full-width drag bars to a small circle at each end of the **selected**
entry, shown only when editing is enabled.

## What was done

1. [DayView.tsx](../../../src/dashboard/modules/time-management/widgets/calendar/DayView.tsx)
   — split the single `editable = editingEnabled` gate into two per-block flags:
   - `selectable = locked` drives click-to-select, the `onMouseDown`
     stop-propagation, the `select-none` class, and the selection ring.
   - `editable = editingEnabled` (`editor && locked`) still gates move-drag and
     the resize handles.
2. Same file — changed the selection-clearing effect to fire on **unlock**
   (`if (locked) return;`) instead of on leaving editor mode, so a selection
   persists across `editor` toggles and is only dropped when entering arrange
   mode.
3. Same file — gated the resize handles on `editable && selected` and replaced
   the two `inset-x-0 h-1.5` bars with `h-3 w-3 rounded-full` circles centered
   at the top end (start) and bottom end (closed entries only); the existing
   `startDrag(..., "resize-start" | "resize-end")` wiring is unchanged.
4. [CalendarPropertiesWidget.tsx](../../../src/dashboard/modules/time-management/widgets/calendar-properties/CalendarPropertiesWidget.tsx)
   — empty-state copy now reads "Select an entry in a calendar to edit it."
   (dropped the "(editor mode)" qualifier, which no longer applies).

No schema, migration, `proxy.ts`, or `PUBLIC_ROUTE_PREFIXES` changes.

## Dead ends & surprises

- The entry block has `overflow-hidden` (it keeps the activity-name label
  truncated). Positioning the handle circles with negative offsets (`-top-1.5`)
  clipped them, so they sit just inside the edges (`top-0.5` / `bottom-0.5`).
- `pnpm lint` reports pre-existing errors in unrelated files
  (`time-chart/useTimeChart.ts`, `react-hooks/purity` on `Date.now()`); the
  files touched here are clean.

## Verification

There are no automated tests — record how you actually exercised it:

- [x] `pnpm lint` clean **for the edited files** (pre-existing errors remain in
  `time-chart`, untouched here)
- [ ] Ran `pnpm dev` and exercised the change end-to-end — _not yet run_
- [ ] Reloaded to confirm persistence — _not yet run_
- [ ] Grid: tested locked **and** unlocked — _not yet run_

Manual run-through to do before merge: with `editor` OFF + locked, clicking an
entry shows the ring and loads the properties widget; with `editor` ON, the
selected entry shows top/bottom circles that resize on drag while the body
drags to move; toggling `editor` OFF keeps the selection; unlocking the
dashboard clears it.

## Follow-ups

None.

## Changelog

Entry added to [`CHANGELOG.md`](../../../CHANGELOG.md): yes — "Calendar entries
are selectable whenever the widget is locked … Resize handles are now a small
circle at each end of the selected entry".
