# ContributorHub

**An open-source, centralized contributor scheduling platform for organizations of all sizes.**

ContributorHub empowers nonprofits, community groups, and event organizers to efficiently manage contributors, coordinate shifts, assign tasks, and track skills — all from a single, modern web application.

---

## Project Goals

### Vision

Contributor coordination is often fragmented across spreadsheets, group chats, and email threads. ContributorHub aims to replace this patchwork with a purpose-built platform that makes scheduling seamless for both organizers and contributors.

### Core Objectives

- **Centralized Scheduling** — Provide a single source of truth for all contributor shifts, tasks, and availability across an organization.
- **Multi-Tenant Architecture** — Support multiple organizations on a single deployment, each with isolated data, branding, and configuration.
- **Role-Based Access Control** — Offer distinct experiences for SuperAdmins (platform-level), OrgAdmins (organization managers), and Contributors.
- **Shift & Task Management** — Enable creation, assignment, and tracking of contributor shifts with granular task breakdowns.
- **Skills Matching** — Allow organizations to define required skills for shifts and match them to contributor capabilities.
- **Calendar Integration** — Support internal event scheduling and future iCal import/export for external calendar sync.
- **Extensibility** — Provide a plugin/hook system so custom logic (notifications, integrations) can be added without modifying core code.
- **Mobile-First Design** — Deliver a responsive UI that works equally well on phones, tablets, and desktops.
- **Open Source** — Remain fully open-source to encourage community contributions, transparency, and self-hosting.

---

## Technical Stack

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                        Client                           │
│              React + TypeScript + Vite                   │
│                   (Port 5173)                           │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP / REST
┌────────────────────────▼────────────────────────────────┐
│                        Server                           │
│           Express + TypeScript + tsx                     │
│                   (Port 4000)                           │
└────────────────────────┬────────────────────────────────┘
                         │ Prisma ORM
┌────────────────────────▼────────────────────────────────┐
│                      PostgreSQL                          │
│                   (Port 5432)                           │
└─────────────────────────────────────────────────────────┘
```

### Frontend — `client/`

| Technology | Purpose |
|-----------|---------|
| [React](https://react.dev/) 19 | Component-based UI library |
| [TypeScript](https://www.typescriptlang.org/) | Static typing for JavaScript |
| [Vite](https://vite.dev/) 8 | Lightning-fast dev server and build tool |
| [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) | JSX/TSX support and Fast Refresh |

The frontend is a single-page application with a responsive layout featuring a desktop header and mobile tab bar navigation. It currently renders a dashboard with mock shift data while the API layer is being built.

### Backend — `server/`

| Technology | Purpose |
|-----------|---------|
| [Express](https://expressjs.com/) 5 | Minimal, fast HTTP framework |
| [TypeScript](https://www.typescriptlang.org/) | Static typing |
| [tsx](https://github.com/privatenumber/tsx) | TypeScript execution with watch mode for development |
| [Zod](https://zod.dev/) | Runtime schema validation (env vars, request payloads) |
| [Prisma](https://www.prisma.io/) 6 | Type-safe ORM for PostgreSQL |

The backend exposes a RESTful API with multi-tenant context via the `x-org-id` header. It includes a plugin hook registry for extensibility (e.g., `onShiftCreated`, `onContributorApplied` events).

### Shared Library — `shared/`

| Technology | Purpose |
|-----------|---------|
| [TypeScript](https://www.typescriptlang.org/) | Shared type definitions |
| [Zod](https://zod.dev/) | Shared validation schemas |

Contains types (roles, RBAC) and schemas (organization theming) shared between client and server to ensure consistency.

### Database — `prisma/`

| Technology | Purpose |
|-----------|---------|
| [PostgreSQL](https://www.postgresql.org/) 16 | Relational database |
| [Prisma](https://www.prisma.io/) 6 | Schema definition, migrations, and client generation |

### Data Model

The database schema includes the following entities:

| Model | Description |
|-------|-------------|
| **Organization** | Multi-tenant org with branding (logo, color, font) and timezone |
| **User** | Members with email auth or Google OAuth, tied to an organization and role |
| **Shift** | Time-bound contributor slots with capacity, status, and location |
| **Task** | Granular work items within a shift, assignable to individual contributors |
| **Skill** | Organization-defined competencies that can be required for shifts |
| **CalendarEvent** | Internal or imported (iCal) events linked to shifts |
| **ShiftSkill** | Many-to-many: skills required for a shift |
| **ShiftContributor** | Many-to-many: contributors assigned to a shift |

### Role-Based Access Control

| Role | Scope | Capabilities |
|------|-------|-------------|
| **SuperAdmin** | Platform-wide | Manage all organizations, users, and platform settings |
| **OrgAdmin** | Single organization | Create/manage shifts, tasks, contributors, and skills |
| **Contributor** | Single organization | View shifts, apply, complete assigned tasks |

---

## Monorepo Structure

```
.
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page-level components
│   │   ├── App.tsx         # Root component
│   │   └── main.tsx        # Entry point
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── server/                 # Express API backend
│   ├── src/
│   │   ├── config/         # Environment validation
│   │   ├── auth/           # Password hashing, JWT, Google OAuth
│   │   ├── middleware/     # Tenant context, auth guards
│   │   ├── plugins/        # Hook registry for extensibility
│   │   ├── routes/         # API route handlers (auth, shifts, tasks, contributors)
│   │   ├── app.ts          # Express app factory
│   │   └── index.ts        # Server entry point
│   └── package.json
├── shared/                 # Shared types and schemas
│   ├── src/
│   │   ├── types/          # TypeScript type definitions
│   │   └── schemas/        # Zod validation schemas
│   └── package.json
├── prisma/                 # Database schema and migrations
│   ├── schema.prisma
│   └── migrations/
├── package.json            # Root workspace configuration
├── tsconfig.base.json      # Shared TypeScript config
├── ENVIRONMENT_SETUP.md    # Step-by-step setup guide
├── TROUBLESHOOTING.md      # Common issues and solutions
└── AGENTS.md               # AI agent development instructions
```

---

## Quick Start

### Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10
- **PostgreSQL** >= 16

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the database

```bash
# Create PostgreSQL user and database
sudo -u postgres psql -c "CREATE USER contributorhub WITH PASSWORD 'contributorhub' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE contributorhub OWNER contributorhub;"
```

### 3. Configure environment

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://contributorhub:contributorhub@localhost:5432/contributorhub"
DIRECT_URL="postgresql://contributorhub:contributorhub@localhost:5432/contributorhub"
NODE_ENV="development"
PORT=4000
```

### 4. Generate Prisma client and run migrations

```bash
npx prisma generate --schema prisma/schema.prisma
npx prisma migrate dev --schema prisma/schema.prisma
```

### 5. Start development servers

```bash
# Terminal 1 — Backend API
DATABASE_URL="postgresql://contributorhub:contributorhub@localhost:5432/contributorhub" \
DIRECT_URL="postgresql://contributorhub:contributorhub@localhost:5432/contributorhub" \
npm run dev -w server

# Terminal 2 — Frontend
npm run dev -w client
```

### 6. Verify

- **Frontend:** http://localhost:5173
- **Backend health check:** http://localhost:4000/health → `{"status":"ok"}`

> For detailed setup instructions, see [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md).
> For common issues, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

---

## Available Scripts

Run from the workspace root:

| Script | Description |
|--------|-------------|
| `npm run dev` | Start all dev servers (client + server) |
| `npm run build` | Build all packages |
| `npm run lint` | Run linting across all packages |
| `npm run test` | Run tests across all packages |
| `npm run dev -w client` | Start only the frontend dev server |
| `npm run dev -w server` | Start only the backend dev server |

---

## API Reference

All API endpoints require authentication via `Authorization: Bearer <token>` header unless noted. Multi-tenant routes require the `x-org-id` header.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register with email/password |
| POST | `/api/auth/login` | Login with email/password |
| GET | `/api/auth/google` | Get Google OAuth redirect URL |
| GET | `/api/auth/google/callback` | Google OAuth callback (redirects to frontend) |
| GET | `/api/auth/google/status` | Check if Google OAuth is configured |
| GET | `/api/auth/me` | Get current user profile |

### Shifts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shifts` | List shifts (filterable by `?status=OPEN`) |
| GET | `/api/shifts/:id` | Get shift with tasks and contributors |
| POST | `/api/shifts` | Create a shift (requires `x-org-id`) |
| PATCH | `/api/shifts/:id` | Update shift fields |
| DELETE | `/api/shifts/:id` | Soft-delete a shift |
| POST | `/api/shifts/:id/contributors` | Admin: assign a contributor to a shift |
| DELETE | `/api/shifts/:id/contributors/:userId` | Admin: remove a contributor from a shift |
| POST | `/api/shifts/:id/signup` | Self-service: sign up for a shift |
| DELETE | `/api/shifts/:id/signup` | Self-service: cancel your own signup |
| GET | `/api/shifts/my/signups` | Get shifts the current user is signed up for |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (filterable by `?shiftId=` and `?status=`) |
| GET | `/api/tasks/:id` | Get task with shift and assignee details |
| POST | `/api/tasks` | Create a task within a shift (requires `x-org-id`) |
| PATCH | `/api/tasks/:id` | Update task fields (title, status, assignee, etc.) |
| DELETE | `/api/tasks/:id` | Soft-delete a task |

### Contributors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contributors` | List contributors (filterable by `?role=` and `?active=`) |
| GET | `/api/contributors/:id` | Get contributor with shifts and tasks |
| PATCH | `/api/contributors/:id` | Update contributor profile or role |

---

## Key Design Decisions

### Multi-Tenancy via Headers

Tenant isolation is achieved through the `x-org-id` HTTP header. The `tenantContextMiddleware` extracts this on every request and attaches it to the Express request object, making it available to all downstream handlers.

### Plugin Hook System

The `HookRegistry` class provides an event-driven extensibility mechanism. Code can register handlers for lifecycle events (e.g., `onShiftCreated`, `onContributorApplied`) without coupling to core logic. This enables features like:
- Email/SMS notifications
- Slack/Discord integrations
- Audit logging
- Analytics tracking

### Shared Package

Types and validation schemas live in `shared/` and are imported by both client and server. This ensures:
- API contracts are consistent across the stack
- Validation logic is written once and reused
- Refactoring propagates type errors immediately

### Prisma as the ORM

Prisma provides a type-safe database client generated from the schema, making it impossible to write queries that reference non-existent columns or tables. Migrations are version-controlled and reproducible.

---

## Roadmap

- [x] Authentication (Google OAuth + email/password)
- [x] Full CRUD API for shifts, tasks, and contributors
- [x] Automated test suite (unit + integration + E2E)
- [x] Contributor self-service shift signup
- [ ] Admin dashboard with analytics
- [ ] Email notifications (shift reminders, assignments)
- [ ] iCal calendar sync (import/export)
- [ ] Skills matching and recommendations
- [ ] Mobile PWA support
- [ ] API rate limiting and security hardening

---

## Contributing

Contributions are welcome! This project is in early scaffold stage, making it a great time to get involved.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Follow the [Environment Setup Guide](./ENVIRONMENT_SETUP.md)
4. Make your changes
5. Commit with clear messages
6. Open a Pull Request

---

## License

This project is open-source. See the repository for license details.
