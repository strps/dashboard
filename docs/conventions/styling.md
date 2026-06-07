# Styling

## Tailwind v4

- Tailwind **v4** with **no `tailwind.config.*`**. Configuration lives in
  [../../src/app/globals.css](../../src/app/globals.css) via `@import "tailwindcss"`
  and the `@theme` directive.
- PostCSS pipeline: [../../postcss.config.mjs](../../postcss.config.mjs) uses the
  `@tailwindcss/postcss` plugin.

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif, …;
}
```

## Visual conventions

The UI is **dark-mode-first**. Patterns seen across the shell and widgets:

- Backgrounds: `bg-neutral-950` page, `bg-white/5` / `bg-white/10` surfaces.
- Text: `text-white` with opacity steps — `text-white/70`, `text-white/30` for
  secondary/placeholder.
- Borders: `border-white/10` (subtle) up to `border-white/30`/`/40` (visible).
- Interactive feedback: always add a hover state plus `transition-colors`;
  focus states use `focus:outline-none focus:border-white/30`.
- Use the Tailwind spacing scale (`px-3 py-2`, `gap-4`) — no hardcoded pixels.
- `shrink-0` on flex items that must not collapse; `cursor-move` on draggable
  surfaces.

Utility-first only — there are no custom CSS component classes beyond the global
resets in `globals.css`.

## Component composition

- Widgets render inside
  [BaseWidget](../../src/dashboard/components/base-widget/BaseWidget.tsx), which
  owns the tile chrome (dashed border, gear/delete buttons) and the drag handle.
- Modals use the shared
  [Dialog](../../src/dashboard/components/Dialog.tsx) component.
- Icons come from `lucide-react`.

## Lock-aware interactivity

When the grid is unlocked, `BaseWidget` wraps content in a `drag-handle` and the
whole tile becomes draggable. Any nested clickable/typeable element must call
`e.stopPropagation()` on `onMouseDown`, and interactive controls should be
disabled while unlocked — otherwise the grid's drag handler eats the event. See
[NotesWidget](../../src/dashboard/modules/notes/NotesWidget.tsx) for the pattern,
and [../standards/grid-system.md](../standards/grid-system.md) for grid details.
