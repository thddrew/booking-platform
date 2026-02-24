# AGENTS.md

## Cursor Cloud specific instructions

### Overview
This is a multi-tenant booking platform built on Payload CMS v3.69 with Next.js 16 (Turbopack). It uses PostgreSQL, Stripe, S3 storage, and optional Novu/Resend integrations.

### Runtime & Package Manager
- **Bun** is the package manager (lockfile: `bun.lock`). Use `bun install` and `bun run <script>`.
- Node.js >=20.9.0 is required (v22 works).
- Bun must be installed: `curl -fsSL https://bun.sh/install | bash` then add `~/.bun/bin` to PATH.

### Database
- PostgreSQL must be running on port 5432 before starting the dev server.
- Start PostgreSQL: `sudo pg_ctlcluster 16 main start`
- The injected `POSTGRES_URL` secret may point to Supabase port 54342. If so, override it by creating `.env.local` with a local Postgres URL on port 5432 (e.g. `POSTGRES_URL=postgres://<user>:<pass>@127.0.0.1:5432/<dbname>`).
- Create the DB if needed: `sudo -u postgres createdb <dbname>`
- Tables are auto-created by Payload on first startup (no manual migration needed).

### Dev Server
- `bun run dev` starts the dev server on port 4000 with Turbopack + Novu bridge.
- The `novu-bridge` background process (`novu dev`) may fail if `NOVU_SECRET_KEY` is not set; this is non-blocking.
- To skip the Novu bridge: `NODE_OPTIONS=--no-deprecation npx next dev --turbopack --port 4000`

### Key Commands
| Task | Command |
|------|---------|
| Dev server | `bun run dev` |
| Lint | `bun run lint` (Biome) |
| Type check | `bun run tsc` (tsgo) |
| Build | `bun run build` |
| Seed DB | Set `SEED_DB=true` in `.env` and restart dev server |

### Gotchas
- The seed script (`src/seed.ts`) has a known validation error: the `multiTenantPlugin` requires an "Assigned Tenant" field on users, but the seed doesn't provide it. If seeding fails, create the first user via the admin UI at `/admin/create-first-user` (select a tenant from the dropdown).
- The "create first user" page requires selecting an "Assigned Tenant" before the form can be submitted.
- Default credentials (when seed works): `demo@payloadcms.com` / `demo`
- Stripe and S3 plugins are always loaded. Without valid keys they won't crash the app, but related features (media uploads, payments) won't work.
- Pre-existing lint errors (Biome) and TypeScript errors exist in the codebase; these are not regressions.
