<!--
Copy to docs/execution/runs/NNNN-short-title.md (next zero-padded sequence
number) and fill in as you work.
A run is the after-the-fact log of one change: what was done, what broke, how it
was verified. See ../README.md.
-->

# <Short title> — YYYY-MM-DD

> Status: in progress | merged | abandoned
> Plan: link to the feature plan / audit / issue this implements (if any).

## Outcome

One or two sentences: what this change accomplishes, in plain terms.

## What was done

Ordered list of the actual steps, with the canonical files touched
(see [../../../standards/codemap.md](../../../standards/codemap.md)). Note any
hand-written migration (`pnpm db:generate --custom`) and any `proxy.ts` /
`PUBLIC_ROUTE_PREFIXES` change.

1.
2.

## Dead ends & surprises

What didn't work, what the deprecation notices said, anything that would save the
next person time. Omit if there were none.

## Verification

There are no automated tests — record how you actually exercised it:

- [ ] `pnpm lint` / `pnpm build` clean
- [ ] Ran `pnpm dev` and exercised the change end-to-end
- [ ] Reloaded to confirm persistence
- [ ] Grid: tested locked **and** unlocked (if applicable)

## Follow-ups

Deferred work, TODOs left in code, or a pointer to a new entry in
[module-standards-audit.md](../../../planning/module-standards-audit.md).

## Changelog

Entry added to [`CHANGELOG.md`](../../../../CHANGELOG.md): yes / no — <quote the line>
