# Changelog

All notable changes to this project are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); entries are grouped
under **Added / Changed / Fixed / Removed** and written for a reader who wasn't
in the PR.

This project is not versioned with releases yet, so everything lands under
**Unreleased**. Add an entry in the same PR as the change, and — for non-trivial
work — link the matching execution run under
[`docs/execution/runs/`](docs/execution/runs/README.md).

## [Unreleased]

### Added

- Multi-note tabs: the notes module is now a shared per-user library with a
  registered config page.
- Calendar widget: editor mode for drag-editing entry times, plus an element
  properties widget for editing entries.
- Time-management module: time chart widget with period navigation and
  per-bucket series breakdown.
- Multi-dashboard tabs in the header.
- Structured [`docs/`](docs/README.md) tree (conventions, standards, automation,
  planning, execution); `AGENTS.md` slimmed to an index.

### Changed

- Calendar entries are selectable whenever the widget is locked, independent of
  editor mode; the selection persists across editor-mode toggles. Resize handles
  are now a small circle at each end of the selected entry (shown only in editor
  mode) instead of full-width drag bars. See
  [docs/execution/runs/0000-calendar-selectable-entries.md](docs/execution/runs/0000-calendar-selectable-entries.md).
- Cheatsheet settings migrated from the legacy `src/app/settings/cheatsheet/`
  route to a registered module config page; the `SettingsNav` legacy special-case
  was removed. See
  [docs/planning/module-standards-audit.md](docs/planning/module-standards-audit.md).
- Introduced the module system (`defineModule` + registry); widgets now own their
  own data and per-widget config instead of shared zustand stores.

### Fixed

- Calendar refreshes when the activity selector changes an entry.
- Switched the Neon driver to `neon-serverless` so transactions work.
- Synthesize a `noreply` email for GitHub accounts without a configured email.

[Unreleased]: https://keepachangelog.com/en/1.1.0/
