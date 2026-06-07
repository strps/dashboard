# Auth & data access (non-negotiable)

This is the project's security model. Breaking these rules creates real
vulnerabilities.

## The layers

```
proxy.ts            optimistic cookie check (UX only) — NOT a security boundary
   │
RSC / server action
   │
DAL  (src/lib/dal/) verifySession()/verifyAdmin() + userId-scoped queries  ← the real boundary
   │
db   (Drizzle)
```

## proxy is optimistic only

[`src/proxy.ts`](../../src/proxy.ts) only checks that a session **cookie exists**.
It does not verify the signature or hit the DB.

```ts
const PUBLIC_ROUTE_PREFIXES = ["/sign-in", "/sign-up"];
// no cookie + non-public route → redirect to /sign-in
// has cookie + public route   → redirect to /
```

- It exists purely to redirect for UX. **Never treat it as authorization.**
- Adding a new public route requires updating `PUBLIC_ROUTE_PREFIXES` (see
  [../execution/add-a-config-page.md](../execution/add-a-config-page.md) and the
  proxy matcher).

## The DAL is the real boundary

Every server-side read/write of user-scoped data goes through the DAL in
[../../src/lib/dal/](../../src/lib/dal/):

- DAL files start with `import "server-only";`.
- They call `verifySession()` (or `verifyAdmin()`) from
  [session.ts](../../src/lib/dal/session.ts), which runs `auth.api.getSession` and
  returns the verified `{ userId, isAdmin, name, email }`. `verifyAdmin()` throws
  `ForbiddenError` for non-admins.
- **Every query is scoped by `userId`** (e.g. `eq(note.userId, userId)`). Records
  that belong to a parent (layouts, time entries) verify ownership through a join.

```ts
// src/lib/dal/notes.ts (shape)
import "server-only";
export async function listNotes(): Promise<Note[]> {
  const { userId } = await verifySession();
  return db.select().from(note).where(eq(note.userId, userId)).orderBy(asc(note.order));
}
```

Do **not** bypass the DAL from server actions, route handlers, or RSCs by calling
the db directly.

## Server actions delegate to the DAL

Server actions live next to the feature (`actions.ts` in the module/widget folder),
start with `"use server"`, validate input with a zod schema from the colocated
`schemas.ts`, then call the DAL:

```ts
// src/dashboard/modules/notes/actions.ts
"use server";
import { createNote } from "@/lib/dal/notes";
import { noteTitleSchema } from "./schemas";

export async function createNoteAction(title: string) {
  return createNote(noteTitleSchema.parse(title));
}
```

The action does validation + delegation only — no DB access, no business logic
that belongs in the DAL.

## Auth configuration

- [auth.ts](../../src/lib/auth.ts) configures Better Auth: email/password +
  GitHub OAuth, the Drizzle adapter, an `isAdmin` additional field, and a
  `databaseHooks.user.create.before` hook that makes the **first** user an admin
  and gates everyone else against the `allowed_email` table.
- [auth-client.ts](../../src/lib/auth-client.ts) exports `authClient` via
  `createAuthClient()`.
- Route handler: `app/api/auth/[...all]/route.ts`.

### GitHub OAuth gotcha — email required

Better Auth's GitHub provider fetches the user's email from `/user/emails`
(`user:email` scope, on by default). If the GitHub account has **no email
configured**, the fetch returns nothing and sign-in fails with `email_not_found`.

- Fix on the user side: add an email at GitHub → Settings → Emails.
- `auth.ts` has a `mapProfileToUser` fallback synthesizing
  `{id}+{login}@users.noreply.github.com` so the failure isn't a blank redirect.
  To grant such a user access, add their noreply address to the `allowed_email`
  table.

## Sign-up gating

Sign-ups are gated by the `allowed_email` table; admins manage it at
`/settings/security` (admin-only route). New users not in the table (and not the
first user) are rejected at creation.
