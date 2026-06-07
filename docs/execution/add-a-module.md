# Add a module

A module is an isolated feature area that owns its widgets, config pages, schemas,
server actions, and DAL/db files. Background:
[../standards/modules-and-widgets.md](../standards/modules-and-widgets.md).

## 1. Create the directory

```
src/dashboard/modules/<module-id>/      # kebab-case, becomes /settings/<module-id>
  index.ts
  db.ts          (optional — tables owned by this module)
  schemas.ts     (optional — zod schemas + types)
  dal.ts         (optional — "server-only" data access)
  actions.ts     (optional — "use server" actions delegating to dal.ts)
  config-pages/<Page>.tsx        (optional)
  widgets/<widget-id>/<Name>Widget.tsx   (or module root for single-widget modules)
```

Single-widget modules (`notes`, `weather`, `stats`) skip `widgets/` and put the
widget file at the module root.

## 2. Build each widget

Follow [add-a-widget.md](add-a-widget.md): register the `WidgetType` + size in
[dashboardStore.ts](../../src/dashboard/store/dashboardStore.ts), and export the
component + `WidgetDefinition`.

## 3. Add data files, if the module persists anything

- `db.ts` — Drizzle tables for this module. **Add the file path to `schema: [...]`
  in [../../drizzle.config.ts](../../drizzle.config.ts).** User-scoped tables get a
  `userId` FK.
- `dal.ts` — `import "server-only";`, `verifySession()`/`verifyAdmin()`, every
  query scoped by `userId`.
- `schemas.ts` — zod schemas + inferred types.
- `actions.ts` — `"use server"`, validate with the schema, delegate to the DAL.

See [../standards/auth-and-data-access.md](../standards/auth-and-data-access.md)
and [../standards/database.md](../standards/database.md). Generate a migration with
`pnpm db:generate --custom`
([../automation/database-migrations.md](../automation/database-migrations.md)).

## 4. Add config pages, if needed

For settings affecting **all** instances of a widget, add a `config-pages/`
component and a `configPages` entry — see
[add-a-config-page.md](add-a-config-page.md).

## 5. Declare the module

Create `index.ts` and call `defineModule(...)`:

```ts
import { Activity } from "lucide-react";
import { defineModule } from "../registry";
import { exampleWidget } from "./widgets/example/ExampleWidget";
import { SomeTab } from "./config-pages/SomeTab";

defineModule({
  id: "example",                 // URL: /settings/example/...
  label: "Example",
  icon: Activity,
  widgets: [exampleWidget],
  configPages: [
    {
      slug: "some-tab",          // URL: /settings/example/some-tab
      label: "Some tab",
      icon: Activity,
      component: SomeTab,
      description: "Optional one-liner shown beneath the page title.",
      // adminOnly?: true,
    },
  ],
});
export {};
```

## 6. Register the module

Add `import "./<module-id>";` to
[../../src/dashboard/modules/index.ts](../../src/dashboard/modules/index.ts).
`defineModule` runs as a side effect of that import; the `SettingsNav` and the
`/settings/[module]/[page]` route pick it up automatically.

## 7. Verify

Work through [templates/module-checklist.md](templates/module-checklist.md) and the
[pre-PR checklist](templates/pr-checklist.md).
