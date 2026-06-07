# Add a widget

A widget is a draggable tile. This recipe adds one to an existing module (or the
module root for a single-widget module). For a brand-new module, do
[add-a-module.md](add-a-module.md) first, then return here.

Background: [../standards/modules-and-widgets.md](../standards/modules-and-widgets.md),
[../standards/data-ownership.md](../standards/data-ownership.md).

## 1. Register the `WidgetType`

In [../../src/dashboard/store/dashboardStore.ts](../../src/dashboard/store/dashboardStore.ts):

- Add a literal to the `WidgetType` union (camelCase, e.g. `"example"`).
- Add a default size to `DEFAULT_SIZES` for that type.

```ts
export type WidgetType = /* … */ | "example";

const DEFAULT_SIZES: Record<WidgetType, { w: number; h: number }> = {
  /* … */
  example: { w: 3, h: 3 },
};
```

`DEFAULT_SIZES` is a `Record<WidgetType, …>`, so a missing entry is a type error —
that's your reminder.

## 2. Implement the widget component + definition

Create the `"use client"` file. Single-widget module → module root
(`ExampleWidget.tsx`); multi-widget module → `widgets/example/ExampleWidget.tsx`.

```tsx
"use client";
import { BaseWidget } from "@/dashboard/components/base-widget/BaseWidget";
import { useWidget } from "@/dashboard/components/base-widget/useWidget";
import type { WidgetComponentProps, WidgetDefinition } from "@/dashboard/modules/registry";

export function ExampleWidget({ id }: WidgetComponentProps) {
  const { locked, onRemove } = useWidget(id);
  return (
    <BaseWidget id={id} locked={locked} onRemove={onRemove}>
      {/* widget content */}
    </BaseWidget>
  );
}

export const exampleWidget: WidgetDefinition = {
  type: "example",
  label: "Example",
  defaultSize: { w: 3, h: 3 },
  minW: 2, minH: 2,
  component: ExampleWidget,
  // configDialog?:  per-instance options dialog (gear icon)
  // configSchema?:  zod schema for per-instance config on WidgetInstance.config
  // defaultConfig?: returned by useWidgetConfig when nothing is stored
  // provider?:      shared per-user state provider
};
```

(Use the relative-import form shown in
[../standards/modules-and-widgets.md](../standards/modules-and-widgets.md) if you
prefer to match neighboring files.)

## 3. Wire it into the module

Add the widget to the module's `defineModule({ widgets: [...] })` call in its
`index.ts`. A new module also needs `import "./<module-id>";` in
[../../src/dashboard/modules/index.ts](../../src/dashboard/modules/index.ts).

## 4. Add state, if any

Decide where state lives using
[../standards/data-ownership.md](../standards/data-ownership.md):

- **Rendering option** → add `configSchema` + `defaultConfig` to the definition;
  read/write via `useWidgetConfig<ExampleConfig>(id)`. No table needed.
- **Per-instance content** → a table keyed by `widgetInstanceId`, plus a server
  action (`schemas.ts` + `actions.ts`) and a DAL function scoped by `userId`. Add
  a migration ([../automation/database-migrations.md](../automation/database-migrations.md)).
- **Shared library** → see [add-a-config-page.md](add-a-config-page.md) and the
  provider pattern.

## 5. Respect the lock

Disable interactive controls when `locked`, and `e.stopPropagation()` on
`onMouseDown` for nested clickable/typeable elements, or the grid drag eats the
event ([../standards/grid-system.md](../standards/grid-system.md)).

## 6. Verify

Run through [templates/module-checklist.md](templates/module-checklist.md) and the
[pre-PR checklist](templates/pr-checklist.md). At minimum: `pnpm dev`, add the
widget, configure it, reload to confirm persistence.
