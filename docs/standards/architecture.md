# Architecture

## This is NOT the Next.js you know

This project runs **Next.js 16** (`next@16.2.6`) with **React 19.2** and the App
Router, bundled by **Turbopack**. APIs, conventions, and file structure differ
from older Next.js. **Read the relevant guide in `node_modules/next/dist/docs/`
before writing Next.js code**, and heed deprecation notices. Do not assume
behavior from memory of earlier versions.

Stack at a glance:

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 App Router + Turbopack |
| UI | React 19, Tailwind v4, `lucide-react`, `react-grid-layout`, `recharts`, `motion` |
| State | zustand (layout only) + React state everywhere else |
| Auth | Better Auth (email/password + GitHub OAuth) |
| Data | Drizzle ORM over Postgres (postgres.js in dev, Neon serverless in prod) |
| Validation | zod (+ `react-hook-form`, `@hookform/resolvers`) |
| Package manager | pnpm |

## `src/` layout

```
src/
  app/                          Next.js App Router
    page.tsx                    server component → renders <DashboardGrid />
    layout.tsx                  root layout
    sign-in/, sign-up/          auth pages
    settings/                   user + admin settings
      [module]/[page]/page.tsx  dynamic route → renders a module's config page
      security/                 admin-only
    api/auth/[...all]/          Better Auth handler
  proxy.ts                      route gate (middleware-style) — OPTIMISTIC ONLY
  dashboard/
    components/                 shared shell: DashboardGrid, Header, Dialog, base-widget/
    store/dashboardStore.ts     LAYOUT-ONLY zustand store (instances + grid + lock + tabs)
    actions.ts                  server actions for layout persistence
    modules/
      registry.ts               defineModule() + MODULES + WIDGET_REGISTRY
      index.ts                  side-effect imports — every module listed here
      <module-id>/              one directory per module
  lib/
    auth.ts, auth-client.ts     Better Auth server + client
    dal/                        data-access layer — ALL user-scoped DB reads
    db/schema.ts                shared Drizzle schema
    db/index.ts                 driver switches by NODE_ENV
drizzle/                        committed migrations
```

## Server / client boundary

- **Server Components are the default.** Pages and layouts under `src/app/` stay
  server components. They run server-only data access (e.g. `verifySession()`)
  and pass results down as props.
- **The client boundary is
  [DashboardGrid](../../src/dashboard/components/DashboardGrid.tsx)** (`"use client"`).
  `app/page.tsx` is a server component that calls `verifySession()` and renders
  `<DashboardGrid isAdmin={…} userName={…} userEmail={…} />`. Everything
  interactive lives below this boundary.
- The `/settings/[module]/[page]` route is a server component that resolves the
  page from the module registry (`getConfigPage`), enforces `adminOnly` via
  `verifySession()`, and renders the module's client component as the body.

## How a request flows

1. [`proxy.ts`](../../src/proxy.ts) does an **optimistic** cookie check and
   redirects unauthenticated users to `/sign-in` (and authenticated users away
   from auth pages). It is **not** a security boundary — see
   [auth-and-data-access.md](auth-and-data-access.md).
2. The matched server component renders, calling DAL functions that re-verify the
   session and scope every query to the `userId`.
3. Client components below `DashboardGrid` call **server actions**, which validate
   input with zod and delegate to the DAL.

## Extension model

Almost all features are added as **modules**. A module bundles widgets, config
pages, schemas, server actions, and DAL/db files so it can be developed in
isolation, and registers itself with one `defineModule(...)` call. Start at
[modules-and-widgets.md](modules-and-widgets.md), then follow
[../execution/add-a-module.md](../execution/add-a-module.md).
