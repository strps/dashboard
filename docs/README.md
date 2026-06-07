# Documentation

This tree is the home for everything about *how this project is built and worked
on* — written to be read by both **human developers** and **AI systems**. It is
organized into five areas:

| Folder | What it answers | When you read it |
| --- | --- | --- |
| [conventions/](conventions/) | "How do we write code here?" — naming, style, imports, styling, commits | While writing any code |
| [standards/](standards/) | "How is the system put together?" — architecture, modules/widgets, auth, data, DB, grid | Before changing structure or adding a feature |
| [automation/](automation/) | "What tooling runs the project?" — scripts, migrations, build/deploy, env, linting | Setting up, running, or shipping |
| [planning/](planning/) | "How do I plan a change?" — workflow + reusable plan/ADR templates | Before starting non-trivial work |
| [execution/](execution/) | "How do I carry a change through?" — step-by-step recipes + checklists | While implementing and before opening a PR |

Everything here describes the **actual code** in this repository, not generic
Next.js advice. When the code changes, update the matching doc in the same PR.

## Read this first

> **This is NOT the Next.js you know.** This project runs Next.js 16 with
> breaking changes from older versions. Read the relevant guide in
> `node_modules/next/dist/docs/` before writing Next.js code, and heed
> deprecation notices. See [standards/architecture.md](standards/architecture.md).

## Suggested reading order

1. [standards/architecture.md](standards/architecture.md) — the big picture and `src/` layout.
2. [standards/codemap.md](standards/codemap.md) — task → which files to open.
3. [standards/modules-and-widgets.md](standards/modules-and-widgets.md) — the core extension model.
4. [standards/auth-and-data-access.md](standards/auth-and-data-access.md) — the non-negotiable security model.
5. [automation/running-locally.md](automation/running-locally.md) — get it running and verify changes.
6. [conventions/](conventions/) — the day-to-day writing rules.
7. [execution/add-a-widget.md](execution/add-a-widget.md) — your first concrete change.

## Two-click tasks

- **Find the right file** → [standards/codemap.md](standards/codemap.md)
- **Run it locally** → [automation/running-locally.md](automation/running-locally.md)
- **Add a widget** → [execution/add-a-widget.md](execution/add-a-widget.md)
- **Add a whole module** → [execution/add-a-module.md](execution/add-a-module.md)
- **Add a settings page** → [execution/add-a-config-page.md](execution/add-a-config-page.md)
- **Change the database** → [automation/database-migrations.md](automation/database-migrations.md)
- **Plan a feature** → [planning/README.md](planning/README.md)

## Non-negotiables (the short list)

These are the rules that, if broken, break the system. Each links to the full
explanation.

- [`src/proxy.ts`](../src/proxy.ts) is an **optimistic UX gate only** — never a security boundary. Real auth lives in the DAL. → [standards/auth-and-data-access.md](standards/auth-and-data-access.md)
- **Widgets own their own data.** The zustand store is layout-only; do not add new stores. → [standards/data-ownership.md](standards/data-ownership.md)
- **Generate migrations with `pnpm db:generate --custom`** and write the SQL by hand. → [automation/database-migrations.md](automation/database-migrations.md)
- The canonical entry point for AI agents is [`AGENTS.md`](../AGENTS.md) (re-exported by `CLAUDE.md`), which indexes into this tree.
