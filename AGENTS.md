# AGENTS.md

## Cursor Cloud specific instructions

### Project Overview

ContributorHub is a multi-tenant contributor scheduling platform. It's a TypeScript npm-workspaces monorepo with three packages: `client` (React + Vite), `server` (Express + tsx), and `shared` (types/schemas).

### Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Frontend (Vite) | `npm run dev -w client` | 5173 | Hot-reloads automatically |
| Backend (Express) | `npm run dev -w server` | 4000 | Uses `tsx watch`; requires `DATABASE_URL` and `DIRECT_URL` env vars |
| PostgreSQL | `sudo pg_ctlcluster 16 main start` | 5432 | Must be started before the backend |

### Starting the backend

The backend requires PostgreSQL connection env vars. Export them before running:

```bash
export DATABASE_URL="postgresql://contributorhub:contributorhub@localhost:5432/contributorhub"
export DIRECT_URL="postgresql://contributorhub:contributorhub@localhost:5432/contributorhub"
npm run dev -w server
```

Or inline: `DATABASE_URL=... DIRECT_URL=... npm run dev -w server`

### API Routes

The server exposes a full CRUD API under `/api`:

- `/api/auth/*` — registration, login, Google OAuth, profile
- `/api/shifts/*` — CRUD for shifts + contributor assignment (requires auth + `x-org-id`)
- `/api/tasks/*` — CRUD for tasks within shifts (requires auth + `x-org-id` for create)
- `/api/contributors/*` — list, get, update contributors (requires auth)
- `/api/notifications/*` — email notification status, SMTP verification, manual reminders (requires auth; admin for write ops)

All CRUD routes require a `Bearer` token. Shift/task creation requires the `x-org-id` header for multi-tenancy.

### Database

- PostgreSQL 16 with user `contributorhub` / password `contributorhub` and database `contributorhub`.
- Prisma ORM (v6.x) manages the schema at `prisma/schema.prisma`.
- Models: Organization, User, Shift, Task, Skill, CalendarEvent, ShiftSkill, ShiftContributor.
- Roles: `SuperAdmin`, `OrgAdmin`, `Contributor` (renamed from Volunteer).
- After schema changes: `npx prisma db push --schema prisma/schema.prisma` (dev) or `npx prisma migrate dev` (migration).
- To regenerate client: `npx prisma generate --schema prisma/schema.prisma`

### Lint / Test / Build

- `npm run lint` — stubs only (echoes "not configured yet" in all workspaces)
- `npm run test` — Vitest tests across all 3 workspaces (168+ tests)
- `npm run test:e2e` — Playwright E2E tests
- `npm run build` — client and server succeed; shared fails due to missing `.js` extensions in imports (pre-existing issue)

### Known issues

- The `shared` package build fails with TS2835 because `shared/src/index.ts` uses extensionless imports under NodeNext module resolution. This does not affect runtime (tsx/vite don't enforce extensions).

### Gotchas

- The `.env` file at the workspace root is gitignored. Prisma CLI auto-loads it, but `tsx`/Node do not — pass env vars explicitly or use `dotenv-cli`.
- Prisma v6.x is required. Prisma v7+ rejects the `url`/`directUrl` fields in `schema.prisma`.
- CRUD routes use soft-delete (`deletedAt` column) — records are never hard-deleted.
- Shift contributor assignment checks capacity before allowing new signups.
