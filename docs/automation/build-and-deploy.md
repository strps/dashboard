# Build & deploy

## Build

- `pnpm build` runs `next build`. Dev (`pnpm dev`) and build use **Turbopack**.
- [../../next.config.ts](../../next.config.ts) is minimal — it sets the Turbopack
  `root` to the project directory:

  ```ts
  const nextConfig: NextConfig = { turbopack: { root: __dirname } };
  ```

## Deploy (Vercel)

[../../vercel.json](../../vercel.json) overrides the build command so migrations
run before the build:

```json
{ "buildCommand": "pnpm db:migrate && pnpm build" }
```

So a deploy = **apply committed migrations → build**. This is why migrations must
be committed and correct (see [database-migrations.md](database-migrations.md)) —
a bad migration fails the deploy.

## Production runtime

- `NODE_ENV=production` selects the Neon serverless driver in
  [db/index.ts](../../src/lib/db/index.ts) (see
  [../standards/database.md](../standards/database.md)).
- All env vars from [environment.md](environment.md) must be configured in the
  Vercel project settings.

## No CI

There is no GitHub Actions / CI pipeline. The only automated gate is the Vercel
build (which runs migrations + `next build`). Linting and verification are
**local responsibilities** — see [linting.md](linting.md) and the
[pre-PR checklist](../execution/templates/pr-checklist.md).
