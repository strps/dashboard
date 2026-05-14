# Dashboard

A personal dashboard with a draggable, resizable widget grid. Built with [Next.js 16](https://nextjs.org) (App Router, Turbopack), [Zustand](https://github.com/pmndrs/zustand) for state, [react-grid-layout](https://github.com/react-grid-layout/react-grid-layout) for the canvas, and [Tailwind CSS v4](https://tailwindcss.com).

The Next.js app lives in [dashboard/](dashboard/). The outer directory still contains the original React Router source under [app/](app/) for reference until the port is verified.

## Getting started

```bash
cd dashboard
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
pnpm build   # production build
pnpm start   # serve the production build
pnpm lint    # eslint
```

## Routes

- `/` — the dashboard grid ([src/app/page.tsx](dashboard/src/app/page.tsx))
- `/sign-in`, `/sign-up` — auth pages ([src/app/sign-in/page.tsx](dashboard/src/app/sign-in/page.tsx), [src/app/sign-up/page.tsx](dashboard/src/app/sign-up/page.tsx))
- `/api/auth/*` — Better Auth handler ([src/app/api/auth/[...all]/route.ts](dashboard/src/app/api/auth/%5B...all%5D/route.ts))
- `/exp` — a scratch route with an animated SVG ([src/app/exp/page.tsx](dashboard/src/app/exp/page.tsx))

## Auth

[Better Auth](https://better-auth.com) backed by Drizzle + Postgres. Email/password and GitHub OAuth are enabled.

### Setup

1. Copy `.env.example` to `.env.local` and fill in:
   - `DATABASE_URL` — Postgres connection string.
   - `BETTER_AUTH_SECRET` — `openssl rand -base64 32`.
   - `BETTER_AUTH_URL` — base URL, e.g. `http://localhost:3000`.
   - `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — from a GitHub OAuth app with callback `http://localhost:3000/api/auth/callback/github`.
2. Push the schema: `pnpm db:push` (or `pnpm db:generate && pnpm db:migrate` for tracked migrations).

The DB client in [src/lib/db/index.ts](dashboard/src/lib/db/index.ts) switches drivers by `NODE_ENV`: `postgres.js` in dev, `@neondatabase/serverless` in production. Schema for `user`, `session`, `account`, `verification` lives in [src/lib/db/schema.ts](dashboard/src/lib/db/schema.ts).

### Gate

[src/proxy.ts](dashboard/src/proxy.ts) is a **public allowlist**: anything under `/sign-in` or `/sign-up` is open, everything else (except `/api/*`, `/_next/*`, `favicon.ico`) requires a session cookie. To open a new public path, add its prefix to `PUBLIC_ROUTE_PREFIXES`.

**The proxy is an optimistic UX gate, not a security boundary.** It uses `getSessionCookie`, which only checks that *some* cookie with the right name exists — it does not verify the signature or hit the DB. A leftover cookie from another Better Auth app on the same `localhost` port will pass it. This is intentional: the proxy runs on every navigation (including prefetches) and has to stay fast and edge-safe.

Real authorization has to happen at the data layer. Every server-side read of user-scoped data must call:

```ts
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const session = await auth.api.getSession({ headers: await headers() });
if (!session) { /* reject */ }
// scope queries with session.user.id
```

`auth.api.getSession` validates against the `session` table, so a stale or forged cookie comes back as `null`.

## Widget system

Every panel on the dashboard is a widget. Adding a new one is three steps:

1. Add the type to `WidgetType` and a default size to `DEFAULT_SIZES` in [src/dashboard/store/dashboardStore.ts](dashboard/src/dashboard/store/dashboardStore.ts).
2. Create `src/dashboard/widgets/<name>/` with a `use<Name>` hook and a `<Name>Widget.tsx` that calls `registerWidget(...)` at the bottom.
3. Import the new widget file in [src/dashboard/widgets/index.ts](dashboard/src/dashboard/widgets/index.ts) so the side-effectful `registerWidget` call runs.

```tsx
// src/dashboard/widgets/example/ExampleWidget.tsx
import { BaseWidget } from "../base/BaseWidget";
import { useWidget } from "../base/useWidget";
import { registerWidget, type WidgetComponentProps } from "../registry";

export function ExampleWidget({ id }: WidgetComponentProps) {
  const { locked, onRemove } = useWidget(id);
  return (
    <BaseWidget id={id} locked={locked} onRemove={onRemove}>
      {/* content */}
    </BaseWidget>
  );
}

registerWidget("example", {
  label: "Example",
  defaultSize: { w: 3, h: 3 },
  minW: 2,
  minH: 2,
  component: ExampleWidget,
});
```

Grid size constraints (`minW`, `maxW`, `minH`, `maxH`) are declared in the `registerWidget` call. `DashboardGrid` reads them from the registry when building the layout.

## Architecture notes

- The dashboard store ([src/dashboard/store/dashboardStore.ts](dashboard/src/dashboard/store/dashboardStore.ts)) is layout-only: widget instances, grid positions, and lock state. Per-widget data (notes content, the active activity, etc.) lives in its own store under the widget's directory.
- [DashboardGrid](dashboard/src/dashboard/components/DashboardGrid.tsx) is the client boundary (`"use client"`). Pages stay as server components and render the grid.
- The grid uses `verticalCompactor` so dragging onto another widget pushes it out of the way and gaps close on remove. Do not switch to `noCompactor` — it disables push-on-drag.
- New widgets are placed at `x: 0, y: maxY` (computed from the existing layout) rather than `y: Infinity`, because `verticalCompactor` won't resolve `Infinity` to a concrete row.
