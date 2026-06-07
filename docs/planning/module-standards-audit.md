# Module standards audit & refactor plan

An audit of the modules under [`src/dashboard/modules/`](../../src/dashboard/modules/)
against the standards in [modules-and-widgets.md](../standards/modules-and-widgets.md),
[data-ownership.md](../standards/data-ownership.md), and
[database.md](../standards/database.md). For each non-compliant module it lists the
specific deviations and a step-by-step plan to bring it into the standard.

> Status snapshot: written 2026-06-07. Re-derive against the code before acting —
> the registry ([modules/index.ts](../../src/dashboard/modules/index.ts)) and
> `defineModule(...)` are the source of truth.

## The standard, in one paragraph

A module declares itself with `defineModule(...)` from its `index.ts`. It owns its
widgets, its zod `schemas.ts`, its `actions.ts` (`"use server"`, validate + delegate),
its `dal.ts`/`db.ts` (or a user-scoped DAL under [`src/lib/dal/`](../../src/lib/dal/)),
and any **config pages**. Settings that affect **every instance** of a widget (a
shared per-user library or catalog) live on a module **config page** registered via
`configPages` and surfaced at `/settings/<module-id>/<slug>` — the dynamic route
[`app/settings/[module]/[page]/page.tsx`](../../src/app/settings/) resolves it and
[`SettingsNav`](../../src/app/settings/SettingsNav.tsx) is auto-built from `MODULES`.
The **notes** and **time-management** modules are the canonical references.

## Compliance summary

| Module | Status | Headline issue |
| --- | --- | --- |
| `notes` | ✅ Compliant | Canonical reference. |
| `time-management` | ✅ Compliant | Canonical multi-widget reference (owns `db.ts`/`dal.ts`). |
| `cheatsheet` | ✅ Compliant (migrated 2026-06-07) | Settings now a registered `configPages` entry; legacy route removed. See §1. |
| `stats` | ⚠️ Stub | No data layer; `useStats` returns hardcoded `MOCK_STATS`. Pattern-incomplete, not wrong. |
| `weather` | ⚠️ Stub | "coming soon" placeholder; no schema/actions/dal at all. |

---

## 1. `cheatsheet` — ✅ migrated (2026-06-07)

**Done.** The shared library settings are now a registered config page at
`/settings/cheatsheet/cheatsheet`:

- `config-pages/CheatsheetManager.tsx`, `EntriesTab.tsx`, `TagsTab.tsx` moved into the
  module; a new `config-pages/CheatsheetTab.tsx` hydrates entries/tags client-side via
  `listEntriesAction`/`listTagsAction` (matching `NotesTab`).
- Registered via `configPages` in [cheatsheet/index.ts](../../src/dashboard/modules/cheatsheet/index.ts).
- `LEGACY_ITEMS` removed from [SettingsNav.tsx](../../src/app/settings/SettingsNav.tsx);
  the legacy `src/app/settings/cheatsheet/` route deleted; the settings index and the
  widget's config dialog link now point at the new path.

**Not done (deferred, optional):** the per-instance filter-button dialog still lives in
`cheatsheet/config/ConfigPanel.tsx` (folder name collides with the `config-pages/`
convention); the DAL remains at `src/lib/dal/cheatsheet.ts`. Both are allowed by the
standards — left as future cleanup.

### Original findings (for reference)

The widget itself is fine (it correctly uses `configSchema`/`defaultConfig` for
per-instance filter buttons and a `provider` for the shared library). The problem is
**where the shared library's CRUD settings live**.

### Deviations

1. **Settings are a legacy route, not a config page.** The entries + tags manager
   lives under [`src/app/settings/cheatsheet/`](../../src/app/settings/cheatsheet/)
   (`page.tsx`, `CheatsheetManager.tsx`, `EntriesTab.tsx`, `TagsTab.tsx`) — a
   hand-built route outside the module. The standard says shared-library CRUD UI is a
   module **config page** at `/settings/<module-id>/<slug>`. The module's
   [`index.ts`](../../src/dashboard/modules/cheatsheet/index.ts) has **no
   `configPages`** and an explicit "migrate when ready" comment.

2. **`SettingsNav` carries a hardcoded `LEGACY_ITEMS` entry** for it
   ([SettingsNav.tsx:16-19](../../src/app/settings/SettingsNav.tsx#L16-L19)), bypassing
   the registry-driven `buildModuleGroups()`. Every other module's nav is derived from
   `MODULES`; cheatsheet is special-cased.

3. **Folder naming drift.** The in-widget config panel is at
   [`cheatsheet/config/ConfigPanel.tsx`](../../src/dashboard/modules/cheatsheet/config/ConfigPanel.tsx);
   the standard module layout names this folder `config-pages/`. (The panel manages
   per-instance filter buttons, so it's mechanism #1 and *may* legitimately stay an
   in-widget dialog — but the folder name should not collide with the `config-pages/`
   convention.)

4. **DAL placement is borderline.** [`src/lib/dal/cheatsheet.ts`](../../src/lib/dal/cheatsheet.ts)
   and tables in central [`schema.ts`](../../src/lib/db/schema.ts). This is *allowed*
   by [database.md](../standards/database.md) (notes does the same), so treat it as
   optional cleanup, not a violation.

### Refactor plan

1. **Build the config page component.** Add
   `cheatsheet/config-pages/CheatsheetTab.tsx` (`"use client"`). Move the UI from the
   legacy `CheatsheetManager` / `EntriesTab` / `TagsTab` into it. Mirror the shape of
   [time-management/config-pages/ActivitiesTab.tsx](../../src/dashboard/modules/time-management/config-pages/ActivitiesTab.tsx)
   and [notes/config-pages/NotesTab.tsx](../../src/dashboard/modules/notes/config-pages/NotesTab.tsx).
   Initial data: keep calling the existing `listEntries`/`listTags` DAL, but hydrate
   client-side (the dynamic settings route renders the component without passing
   server props), or add a small server wrapper consistent with the other tabs.
2. **Register it.** Add a `configPages: [{ slug: "cheatsheet", label: "Cheatsheet",
   icon: BookOpen, component: CheatsheetTab, description: … }]` to
   [cheatsheet/index.ts](../../src/dashboard/modules/cheatsheet/index.ts) and delete
   the stale comment.
3. **Drop the legacy nav special-case.** Remove `LEGACY_ITEMS` (and the now-unused
   `BookOpen` import) from [SettingsNav.tsx](../../src/app/settings/SettingsNav.tsx);
   the page now appears automatically via `buildModuleGroups()`.
4. **Delete the legacy route.** Remove [`src/app/settings/cheatsheet/`](../../src/app/settings/cheatsheet/)
   once the config page works. Verify nothing else links to `/settings/cheatsheet`.
5. **Rename the folder.** `cheatsheet/config/` → `cheatsheet/config-pages/`? No —
   that folder holds the per-instance dialog, not a settings page. Rename it to
   something unambiguous (e.g. keep the dialog co-located as
   `CheatsheetConfigDialog.tsx` at the module/widget root, matching the calendar
   widget's `CalendarConfigDialog.tsx`) and drop the `config/` folder.
6. **Verify** (no automated tests — run the app): the page renders under
   `/settings/cheatsheet/cheatsheet`, CRUD on entries/tags works, the nav entry shows
   under a "Cheatsheet" group, and the per-widget filter-button dialog still works.

---

## 2. `stats` — stub, pattern-incomplete

[`useStats.ts`](../../src/dashboard/modules/stats/useStats.ts) returns a hardcoded
`MOCK_STATS` array; there is no `schemas.ts`, `actions.ts`, or `dal.ts`. This is not a
*violation* of the data-ownership rules (it stores nothing), but the module can't
follow the standard until it has a real data source.

### Plan (when stats become real)

1. Decide scope using the [data-ownership decision table](../standards/data-ownership.md):
   live system metrics are likely an external fetch (no table), while user-configured
   stat definitions would be a shared library (config page + user table + provider).
2. If per-instance rendering options appear (which metrics to show, layout), add
   `configSchema` + `defaultConfig` and read via `useWidgetConfig`.
3. Replace `MOCK_STATS` with a typed fetch/hook; keep the widget dumb.

Until then, leave a `// TODO: stub data` marker and track it here.

---

## 3. `weather` — stub, unimplemented

[`WeatherWidget.tsx`](../../src/dashboard/modules/weather/WeatherWidget.tsx) renders a
"coming soon" placeholder. No schema/actions/dal. Nothing to refactor — it just isn't
built yet.

### Plan (when implemented)

1. Per-instance location/units → `configSchema` + `defaultConfig` + a `configDialog`
   (follow the calendar widget for the dialog pattern).
2. Weather data is an external API fetch — no table needed; fetch in a hook or a
   server action that proxies the provider. If an API key is involved, it belongs in
   env/config, not the client.
3. Register any settings as a config page only if they're shared across instances.

---

## Suggested order of work

1. **`cheatsheet`** — the only real standards violation; the migration is well-scoped
   and removes the last legacy settings route. Do this first.
2. **`stats`** / **`weather`** — defer until the features are actually built; the
   "fix" is implementation, not refactoring. Tracked here so they aren't mistaken for
   compliant modules.

## Definition of done

- No `LEGACY_ITEMS` in `SettingsNav`; every settings entry derives from `MODULES`.
- No routes under `src/app/settings/` except the dynamic `[module]/[page]` route and
  admin-only pages (`security`).
- Every module that has shareable settings exposes them via `configPages`.
- Stub modules carry an explicit marker and an entry in this audit.
</content>
</invoke>
