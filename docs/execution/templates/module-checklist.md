<!-- Copy into your PR description when shipping a new module or widget. -->

# Module / widget checklist

## Widget wiring

- [ ] `WidgetType` literal added to the union in `dashboardStore.ts`
- [ ] Entry added to `DEFAULT_SIZES` for that type
- [ ] Widget file is `"use client"` and exports **both** the component and its `WidgetDefinition`
- [ ] Component renders inside `BaseWidget` and uses `useWidget(id)`
- [ ] `minW/minH` (and `maxW/maxH` if relevant) set sensibly
- [ ] Interactive controls disabled when `locked`; `e.stopPropagation()` on nested `onMouseDown`

## Module wiring (new module only)

- [ ] Directory `src/dashboard/modules/<module-id>/` (kebab-case id)
- [ ] `defineModule({ id, label, icon, widgets, configPages })` in `index.ts`
- [ ] `import "./<module-id>";` added to `modules/index.ts`

## State & persistence

- [ ] State placement chosen per `standards/data-ownership.md`:
  - [ ] rendering option → `configSchema` + `defaultConfig` + `useWidgetConfig`
  - [ ] per-instance content → table keyed by `widgetInstanceId` + action + DAL
  - [ ] shared library → config page + user-scoped table + provider
- [ ] `configSchema` safe-parses (falls back to `defaultConfig`) — verified with a stale value

## Data layer (if it persists anything)

- [ ] New tables in `schema.ts` or `<module>/db.ts`
- [ ] New `db.ts` path added to `drizzle.config.ts` `schema: [...]`
- [ ] DAL functions are `import "server-only";`, call `verifySession()`/`verifyAdmin()`, scope by `userId`
- [ ] Server actions are `"use server"`, validate with zod, delegate to DAL (no direct db)
- [ ] Migration generated with `pnpm db:generate --custom --name=<…>` and SQL hand-written
- [ ] `pnpm db:migrate` applied locally; data verified in `pnpm db:studio`

## Config page (if any)

- [ ] `config-pages/<Page>.tsx` is `"use client"`, no extra page chrome
- [ ] `configPages` entry added; `adminOnly` set if appropriate
- [ ] Appears in `SettingsNav` and renders at `/settings/<module-id>/<slug>`

## Then

- [ ] Complete the [pre-PR checklist](pr-checklist.md)
