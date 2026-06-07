# Naming

Conventions observed throughout the codebase. Match them exactly.

## Files

| Kind | Convention | Examples |
| --- | --- | --- |
| React components | `PascalCase.tsx` | `BaseWidget.tsx`, `NotesWidget.tsx`, `DashboardGrid.tsx` |
| Hooks | `useCamelCase.ts` | `useWidget.ts`, `useWidgetConfig.ts`, `useNotes.ts`, `useActivitySelector.ts` |
| React context modules | `camelCaseContext.tsx` | `notesLibraryContext.tsx`, `libraryContext.tsx` |
| Non-component modules | `camelCase.ts` | `registry.ts`, `dashboardStore.ts`, `schemas.ts`, `actions.ts`, `dal.ts`, `db.ts` |
| Next.js route files | framework-mandated | `page.tsx`, `layout.tsx`, `route.ts` |

## Folders

Kebab-case for feature/module/widget folders and all route segments:

- Modules: `time-management/`, `notes/`, `cheatsheet/`
- Widget folders inside a multi-widget module: `widgets/activity-selector/`, `widgets/time-chart/`
- Route segments: `sign-in/`, `sign-up/`, `settings/[module]/[page]/`
- Shared component folders: `base-widget/`

Single-widget modules (`notes`, `weather`, `stats`) skip the `widgets/` layer and
put the widget file at the module root.

## Symbols

| Kind | Convention | Examples |
| --- | --- | --- |
| Components | `PascalCase` | `NotesWidget`, `NotesLibraryProvider` |
| Hooks | `useCamelCase` | `useWidget`, `useNotesLibrary` |
| Server actions | `verbNounAction` | `listNotesAction`, `createNoteAction`, `saveNoteBlocksAction` |
| DAL functions | `verbNoun` (no suffix) | `listNotes`, `createNote`, `saveNoteBlocks` |
| Zod schemas | `nounSchema` | `noteTitleSchema`, `blocksSchema`, `notesConfigSchema` |
| Inferred config types | `PascalCaseConfig` | `NotesConfig` (= `z.infer<typeof notesConfigSchema>`) |
| Config defaults | `defaultNounConfig` | `defaultNotesConfig` |
| Widget definitions | `camelCaseWidget` | `notesWidget`, `clockWidget`, `statsWidget` |

The action-vs-DAL pairing is deliberate: the `*Action` server action validates
input then delegates to the same-named DAL function. See
[../standards/auth-and-data-access.md](../standards/auth-and-data-access.md).

## Exports

- Components, hooks, schemas, and functions are **named exports**. Avoid default
  exports except for Next.js route files (`page.tsx`, `layout.tsx`), which the
  framework requires to default-export.
- A widget file exports both its component **and** its `WidgetDefinition`
  constant (e.g. `NotesWidget` and `notesWidget`).
