# Add a config page

A config page is a `/settings/<module-id>/<slug>` route for settings that affect
**all instances** of a module's widgets (catalogs, libraries, user-wide
preferences). Per-instance options belong in `useWidgetConfig`, not here — see
[../standards/data-ownership.md](../standards/data-ownership.md).

Background: [../standards/modules-and-widgets.md](../standards/modules-and-widgets.md).

## 1. Build the page component

Create a `"use client"` component under the module's `config-pages/`:

```tsx
// src/dashboard/modules/example/config-pages/SomeTab.tsx
"use client";
export function SomeTab() {
  // normal React component; call server actions for data
  return <div>…</div>;
}
```

It's rendered inside a titled wrapper by the dynamic route — don't add your own
page chrome. For shared per-user data, this page is where CRUD lives (it calls
server actions → DAL). See
[time-management/config-pages/ActivitiesTab.tsx](../../src/dashboard/modules/time-management/config-pages/ActivitiesTab.tsx).

## 2. Declare it on the module

Add a `configPages` entry to the module's `defineModule(...)`:

```ts
configPages: [
  {
    slug: "some-tab",            // URL: /settings/example/some-tab
    label: "Some tab",
    icon: Activity,
    component: SomeTab,
    description: "Optional one-liner shown beneath the page title.",
    // adminOnly?: true,
  },
],
```

The route [app/settings/[module]/[page]/page.tsx](../../src/app/settings/) resolves
the page via `getConfigPage(moduleId, slug)`, enforces `adminOnly` with
`verifySession()`, and renders `component`. `SettingsNav` lists it automatically —
no routing code to write.

## 3. Back it with data, if needed

Shared per-user library = user-scoped table (not keyed by `widgetInstanceId`) +
DAL + server actions, and usually a `provider` on the widget definition so every
widget instance reads the same in-memory state. See the shared-data section of
[../standards/data-ownership.md](../standards/data-ownership.md) and
[cheatsheet/libraryContext.tsx](../../src/dashboard/modules/cheatsheet/libraryContext.tsx).

## Note: this is not a new public route

Config pages live under `/settings`, which is already gated. You only touch
`PUBLIC_ROUTE_PREFIXES` in [../../src/proxy.ts](../../src/proxy.ts) when adding a
route that should be reachable **without** a session — which a settings page never
is. See [../standards/auth-and-data-access.md](../standards/auth-and-data-access.md).

## 4. Verify

`pnpm dev`, navigate to `/settings/<module-id>/<slug>`, confirm it appears in the
nav and (if `adminOnly`) is hidden/blocked for non-admins. Then the
[pre-PR checklist](templates/pr-checklist.md).
