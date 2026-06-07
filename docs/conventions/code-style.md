# Code style

## TypeScript

- `strict` mode is on ([../../tsconfig.json](../../tsconfig.json)). No implicit
  `any`; prefer precise types and `unknown` over `any` for opaque values (the
  store types `config` as `unknown` and safe-parses it).
- Path alias: **`@/` → `src/`**. Use it for cross-area imports.
- Derive types from zod where a schema exists: `type NotesConfig = z.infer<typeof notesConfigSchema>`. Export both the schema and its inferred type.

## Imports

Group imports with blank lines between groups, in this order (matches existing
files such as [../../src/dashboard/modules/notes/NotesWidget.tsx](../../src/dashboard/modules/notes/NotesWidget.tsx)):

1. External packages — `react`, `lucide-react`, `drizzle-orm`, `zod`.
2. `@/` absolute imports — shared `lib`, cross-module references.
3. Relative imports — same module / same directory (`./schemas`, `../registry`).

Use `import type { … }` for type-only imports. In DAL files, the **first line**
is `import "server-only";`.

```ts
// src/lib/dal/notes.ts
import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { note } from "@/lib/db/schema";
import type { Note, NoteBlock } from "@/dashboard/modules/notes/schemas";

import { verifySession } from "./session";
```

Within a module use **relative** imports (`./schemas`, `./dal`); reach into other
areas with the `@/` alias.

## The `"use client"` boundary

- Server Components are the default. Pages and layouts under `src/app/` stay
  server components and fetch server-only data (e.g. `verifySession()`), passing
  it down as props.
- The client boundary sits at
  [DashboardGrid](../../src/dashboard/components/DashboardGrid.tsx) (`"use client"`).
  Everything draggable/interactive lives below it.
- Widget files, hooks, context providers, dialogs, and anything using
  `useState`/`useEffect`/zustand start with `"use client"`.
- Server action files start with `"use server"`. DAL files start with
  `import "server-only";`. Never mix these markers in one file.

See [../standards/architecture.md](../standards/architecture.md) for the full
server/client split.

## State

- The dashboard **layout** (instances, grid positions, lock, tabs) is the only
  zustand store: [dashboardStore.ts](../../src/dashboard/store/dashboardStore.ts).
  **Do not add new zustand stores.**
- Everything else is React state: per-instance widget state via `useState`,
  discrete mutations via `useOptimistic` + `useTransition`, shared per-user data
  via a React Context provider registered on the widget definition.
- Full rationale and the per-pattern recipe:
  [../standards/data-ownership.md](../standards/data-ownership.md).

## Forms & validation

- Forms: `react-hook-form` + `@hookform/resolvers` + `zod`.
- Validate **all** server-action input with a zod schema from the colocated
  `schemas.ts` via `.parse()` (throws on bad input). Use `.safeParse()` for
  untrusted/stored values where you want a fallback (e.g. `useWidgetConfig`).

## Comments

The codebase keeps inline comments sparse and reserves them for non-obvious
*why*. Architectural explanation lives in these docs, not in code. When a comment
does appear, it explains intent (e.g. "stop propagation to prevent grid drag from
eating clicks"), not the obvious mechanics. JSDoc is used on exported config
schemas and shared-context methods to document persistence/debounce behavior.
