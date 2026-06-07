# Execution runs

A **run** is the record of carrying one change through — what was actually done,
in what order, what broke, and how it was verified. Where a
[feature plan](../../planning/templates/feature-plan.md) is written *before* the
work and an [audit](../../planning/module-standards-audit.md) describes a *desired*
state, a run is the *after-the-fact log* of a single execution.

Write one for any non-trivial change (new module, schema change, cross-cutting
refactor) — the same threshold that calls for a feature plan. Skip it for typos
and one-line fixes.

## How to use this folder

1. Copy [`templates/run.md`](templates/run.md) to
   `runs/NNNN-short-title.md`, where `NNNN` is the next zero-padded sequence
   number (the first run is `0000-…`). Keep the title slug short and kebab-case.
2. Fill it in as you go, not from memory afterwards.
3. When the change merges, add a one-line entry to the root
   [`CHANGELOG.md`](../../../CHANGELOG.md) and link back to the run.

The run captures the *how* and the dead ends; the CHANGELOG captures the *what*
for someone who wasn't there. Keep them in sync.

## Runs

- [0000 — Calendar: always-selectable entries + circle resize handles](0000-calendar-selectable-entries.md)
