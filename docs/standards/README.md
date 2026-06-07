# Standards

How the system is put together. Read these before adding a feature or changing
structure.

- [architecture.md](architecture.md) — the big picture, `src/` layout, server/client boundary.
- [codemap.md](codemap.md) — "I'm touching X, which files?" — task → canonical files.
- [modules-and-widgets.md](modules-and-widgets.md) — the module + widget extension model (`defineModule`, `WidgetDefinition`, config pages, providers).
- [data-ownership.md](data-ownership.md) — where each kind of state lives: per-instance config, per-instance content, shared per-user library.
- [auth-and-data-access.md](auth-and-data-access.md) — the security model: optimistic proxy gate, DAL, server actions.
- [database.md](database.md) — Drizzle schema layout, the `NODE_ENV` driver switch, table inventory.
- [grid-system.md](grid-system.md) — react-grid-layout rules and gotchas.

For *how to apply* these standards step-by-step, see [../execution/](../execution/).
