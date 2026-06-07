# Execution

Step-by-step recipes for carrying a change from plan to merged PR. These assume
you've read the relevant [standards](../standards/) and, for non-trivial work,
written a [feature plan](../planning/templates/feature-plan.md).

## Recipes

- [add-a-widget.md](add-a-widget.md) — add a widget to a new or existing module.
- [add-a-module.md](add-a-module.md) — add a whole module from scratch.
- [add-a-config-page.md](add-a-config-page.md) — add a `/settings/<module>/<slug>` page.

## Checklists

- [templates/module-checklist.md](templates/module-checklist.md) — copy-paste checklist for shipping a module/widget.
- [templates/pr-checklist.md](templates/pr-checklist.md) — run before opening a PR.

## Recording what you did

- [runs/](runs/README.md) — after-the-fact logs of individual changes (what was
  done, what broke, how it was verified). Write one for any non-trivial change.
- When a change merges, add an entry to the root
  [CHANGELOG.md](../../CHANGELOG.md) and link back to its run.

## How to verify (there are no automated tests)

The only way to confirm a change works is to run the app:

```bash
pnpm dev        # http://localhost:3000
pnpm lint       # the one automated quality gate
pnpm db:studio  # inspect data after migrations
```

Manually exercise the feature: add the widget to a dashboard, unlock the grid,
edit/configure it, reload to confirm persistence, and (for shared data) open the
config page. See [../automation/linting.md](../automation/linting.md) for what is
and isn't automated.
