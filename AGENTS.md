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
    settings/                   user + admin settings (security/)
    api/auth/[...all]/          Better Auth handler
  proxy.ts                      route gate (middleware-style) — OPTIMISTIC ONLY
  dashboard/
    components/                 client components: DashboardGrid, Header, Dialogs
    store/dashboardStore.ts     LAYOUT-ONLY zustand store (instances + grid + lock)
    actions.ts                  server actions for layout persistence
    widgets/
      index.ts                  side-effect imports — every widget must be listed
      registry.ts               WIDGET_REGISTRY + registerWidget()
      base/                     BaseWidget shell + useWidget() hook
      <name>/                   one directory per widget (see below)
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
- Server actions live next to the feature that uses them (e.g. [src/dashboard/widgets/notes/actions.ts](src/dashboard/widgets/notes/actions.ts)) and delegate to the DAL — they do **not** call the DB directly. They validate input with zod schemas defined in `schemas.ts` next to the action.

# Adding a widget

Three steps:

1. Add the new type to the `WidgetType` union and a default size in `DEFAULT_SIZES` in [src/dashboard/store/dashboardStore.ts](src/dashboard/store/dashboardStore.ts).
2. Create `src/dashboard/widgets/<name>/` with at minimum:
   - `<Name>Widget.tsx` — component + `registerWidget(...)` call at module scope.
   - `use<Name>.ts` — hook owning the widget's logic. Hold per-instance state with `useState`; wrap discrete mutations in `useOptimistic` + `useTransition`. See [activity selector](src/dashboard/widgets/activitySelector/useActivitySelector.ts) for the canonical pattern.
   - If the widget has persistent state: `schemas.ts` (zod), `actions.ts` (`"use server"`), and a DAL module under [src/lib/dal/](src/lib/dal/).
   - If the widget needs **shared per-user state across instances** (a library / catalog): add `libraryContext.tsx` exporting a `<Name>LibraryProvider` + `use<Name>Library` hook, and pass `provider: <Name>LibraryProvider` to `registerWidget(...)`. The dashboard grid composes the provider around the grid whenever at least one instance of the widget type is mounted. See [cheatsheet/libraryContext.tsx](src/dashboard/widgets/cheatsheet/libraryContext.tsx).
3. Add `import "./<name>/<Name>Widget";` to [src/dashboard/widgets/index.ts](src/dashboard/widgets/index.ts) — `registerWidget` runs as a side effect of importing the file.

Minimal widget skeleton:

```tsx
// src/dashboard/widgets/example/ExampleWidget.tsx
import { BaseWidget } from "../base/BaseWidget";
import { useWidget } from "../base/useWidget";
import { registerWidget, type WidgetComponentProps } from "../registry";

export function ExampleWidget({ id }: WidgetComponentProps) {
  const { locked, onRemove } = useWidget(id);
  return (
    <BaseWidget id={id} locked={locked} onRemove={onRemove}>
      {/* widget content */}
    </BaseWidget>
  );
}

registerWidget("example", {
  label: "Example",
  defaultSize: { w: 3, h: 3 },
  minW: 2,
  minH: 2,
  component: ExampleWidget,
  // configComponent?: optional, surfaced in WidgetConfigDialog
});
```

Grid size constraints (`minW`, `maxW`, `minH`, `maxH`) belong in `registerWidget` — [DashboardGrid](src/dashboard/components/DashboardGrid.tsx) reads them from the registry when building each layout item.

## Widget data ownership

**Widgets own their own data.** The dashboard store is layout-only — instances, grid positions, lock state. Anything widget-specific (notes content, selected activity, etc.) lives in React state inside the widget's component tree, keyed by the widget instance `id`. See [useNotes.ts](src/dashboard/widgets/notes/useNotes.ts) for the canonical pattern.

Persistence pattern (used by notes, activity selector, layout itself):
- **Discrete mutations** (add, remove, toggle, reorder, CRUD): wrap in `useOptimistic` + `useTransition`. Apply the optimistic update first, await the server action, commit the canonical row into base `useState` on success. The optimistic state is auto-discarded when the transition ends, so failures revert with no manual rollback. See [useActivitySelector.ts](src/dashboard/widgets/activitySelector/useActivitySelector.ts).
- **Continuous edits** (text typed into a field): plain `useState` mutation + a module-level debounced `saveAction` call (typical debounce ~500ms; flush immediately on structural changes). `useOptimistic` is intentionally NOT used per keystroke — each keystroke would be its own transition and the optimistic value would churn. See [useNotes.ts](src/dashboard/widgets/notes/useNotes.ts) which combines both patterns.
- **Hydration**: on mount, the hook calls `get…Action` once and seeds `useState`; a local `hydrated` flag prevents re-fetching.

### Shared (per-user) widget data

Some widgets surface a per-user **library** that's the same across every instance of that widget (e.g. cheatsheet entries + tags). For these:

- Storage uses normal user-scoped tables — **not** keyed by `widgetInstanceId`. See [src/lib/dal/cheatsheet.ts](src/lib/dal/cheatsheet.ts).
- CRUD UI lives on a dedicated `/settings/<widget>` page (signed-in users, not admin-only), **not** in the widget config dialog. See [src/app/settings/cheatsheet/](src/app/settings/cheatsheet/).
- Per-instance config (e.g. which tags become filter buttons in *this* cheatsheet) lives in a config dialog opened from a gear icon on the widget itself, and is keyed by `widgetInstanceId` in its own table. See [src/dashboard/widgets/cheatsheet/config/ConfigPanel.tsx](src/dashboard/widgets/cheatsheet/config/ConfigPanel.tsx) and the `cheatsheet_widget_config` table.
- Shared library state lives in a per-widget React Context provider exported from the widget directory and registered via `provider:` on `registerWidget(...)`. The dashboard grid composes the provider around the grid whenever any instance of the widget type is mounted. See [cheatsheet/libraryContext.tsx](src/dashboard/widgets/cheatsheet/libraryContext.tsx) — it hydrates once and is consumed by every cheatsheet instance via `useCheatsheetLibrary()`.
- Per-instance widget state should live in `useState` inside the widget component (or its `use<Name>` hook). If a child dialog (e.g. the config panel) needs the same state, pass it down via props — do NOT call the per-instance hook twice from different subtrees, since each call would get its own `useState`.
- The global `WidgetConfigDialog` is per-widget-*type* (not per-instance), so don't use its `configComponent` slot for per-instance settings — host your own `Dialog` inside the widget instead.

## Widget interactivity vs. lock

The dashboard has a global `locked` flag. When `locked === false`, [BaseWidget](src/dashboard/widgets/base/BaseWidget.tsx) wraps content in a `drag-handle` div — the entire widget becomes draggable. Inside widgets, **disable interactive controls when unlocked** and call `e.stopPropagation()` on `onMouseDown` for any nested clickable/typeable element, otherwise the grid drag handler eats the event. See [NotesWidget](src/dashboard/widgets/notes/NotesWidget.tsx) for the pattern.

# Grid system gotchas

- Use `verticalCompactor` — it pushes widgets on drag and closes gaps on remove. Do **not** switch to `noCompactor`.
- Place new widgets at `x: 0, y: maxY` (computed from current layout). Do **not** use `y: Infinity` — `verticalCompactor` won't resolve it.
- [DashboardGrid](src/dashboard/components/DashboardGrid.tsx) is the client boundary (`"use client"`). Pages stay as server components and pass server-only data (e.g. `isAdmin`) down as props.

# Conventions

- Path alias: `@/` → `src/`.
- Styling: Tailwind v4 (no `tailwind.config.*` — config lives in `globals.css`).
- State: the dashboard layout (instances, grid, lock) uses a single zustand store at [src/dashboard/store/dashboardStore.ts](src/dashboard/store/dashboardStore.ts). Everything else uses React state — per-instance widget state via `useState`, discrete mutations via `useOptimistic` + `useTransition`, shared per-user state via a React Context provider registered through the widget registry. Do not add new zustand stores; see "Widget data ownership" below.
- Forms: react-hook-form + `@hookform/resolvers` + zod.
- Icons: `lucide-react`.
- DB: Drizzle ORM. Schema in [src/lib/db/schema.ts](src/lib/db/schema.ts). Migration commands: `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:push`, `pnpm db:studio`.
- Sign-ups are gated by the `allowed_email` table; admins manage it at `/settings/security`. Don't add new public routes without updating `PUBLIC_ROUTE_PREFIXES` in [src/proxy.ts](src/proxy.ts).
