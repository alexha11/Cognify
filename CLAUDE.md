# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cognify is a multi-tenant SaaS platform for AI-powered educational content and quiz generation. Students study through AI-generated questions; instructors manage courses and materials; admins oversee organizations.

## Commands

### Backend (NestJS)

```bash
cd backend

npm run start:dev        # Development server with watch mode (port 3001)
npm run build            # Compile TypeScript
npm run start:prod       # Production (requires build first)

npm run test             # Unit tests
npm run test:watch       # Watch mode
npm run test:cov         # Coverage report
npm run test:e2e         # End-to-end tests

npm run lint             # ESLint with auto-fix
npm run format           # Prettier formatting

# Prisma
npx prisma migrate dev --name <name>   # Create and apply a migration
npx prisma migrate deploy              # Apply migrations (prod/CI)
npx prisma generate                    # Regenerate Prisma client after schema changes
npx prisma studio                      # Database browser UI
```

### Frontend (Next.js)

```bash
cd frontend

npm run dev              # Development server (port 3000)
npm run build            # Production build
npm run lint             # ESLint
```

### Full Stack (Docker)

```bash
docker-compose up -d                   # Start all services (postgres, backend, frontend)
docker-compose up postgres -d          # Start only PostgreSQL (for local dev)
```

### Initial Setup

```bash
npm install --prefix backend
npm install --prefix frontend
cp backend/.env.example backend/.env   # Then fill in secrets
```

## Architecture

### Services

| Service  | Technology | Port |
|----------|-----------|------|
| Frontend | Next.js 16, React 19, TailwindCSS 4 | 3000 |
| Backend  | NestJS 11, TypeScript | 3001 |
| Database | PostgreSQL 16 | 5432 |

The frontend calls `NEXT_PUBLIC_API_URL` (default: `http://localhost:3001/api`) via Axios (`frontend/src/lib/api.ts`). The backend validates JWT tokens on every request via `JwtAuthGuard`.

### Multi-Tenancy Model

Every resource (Course, Question, Material, etc.) is scoped to an `organizationId`. JWT tokens carry `sub` (userId), `organizationId`, and `role`. The backend reads these from the `@CurrentUser()` decorator to enforce tenant isolation — never trust client-supplied org IDs for authorization.

### Backend Module Structure (`backend/src/modules/`)

- **auth/** — JWT registration/login; creates org + admin user in one transaction
- **organizations/** — org CRUD, slug-based routing, public discovery
- **courses/** — course CRUD, prerequisites, publish/visibility toggle
- **questions/** — question CRUD, AI-generated flag, approval workflow
- **answers/** — answer options for questions (always created with the question)
- **attempts/** — records student answer submissions, computes `isCorrect`
- **materials/** — file uploads associated with courses (optional Supabase storage)
- **ai/** — calls OpenRouter API (Gemini 2.0 Flash), parses JSON into questions, enforces plan limits
- **billing/** — Stripe checkout, webhooks, customer portal, syncs `Organization.plan`
- **access-control/** — role request workflow (STUDENT → INSTRUCTOR requests)
- **users/** — user profile management

### Database Schema Key Points (`backend/prisma/schema.prisma`)

- `Organization` is the multi-tenant root; all resources cascade-delete with it
- `User.organizationId` is nullable (users without an org can exist)
- `Question.approved` gates whether students see AI-generated questions
- `Attempt` records one answer per question attempt; `isCorrect` is stored
- `Subscription` links Stripe subscription state to an organization
- `Plan` enum: `FREE | PRO | ENTERPRISE` — controls AI generation limits

### Frontend Structure (`frontend/src/`)

- **app/** — Next.js App Router pages; one directory per feature
- **components/ui/** — Radix UI primitives wrapped with Tailwind/CVA
- **lib/api.ts** — Axios instance with JWT auth interceptor; all API calls go through here
- **lib/auth.tsx** — Token decode, role checks, auth state helpers
- **types/** — Shared TypeScript interfaces mirroring backend DTOs

### AI Question Generation Flow

1. Instructor submits topic + course ID to `POST /ai/generate-questions`
2. Backend checks plan limits, calls OpenRouter with a structured prompt
3. Response is parsed into `Question` + `Answer` records with `aiGenerated: true`, `approved: false`
4. Admin/instructor reviews and approves questions before students can attempt them

### Role-Based Access

Roles: `ADMIN > INSTRUCTOR > STUDENT`. Guards (`RolesGuard` + `@Roles()` decorator) protect endpoints. Students can only read approved questions and submit attempts. Instructors can create/edit courses and questions. Admins manage org settings and billing.

## Agent Rules

The `.agent/rules/` directory contains detailed pattern guides for AI assistance:
- `nextjs-pattern.md` — App Router patterns, route handlers, Zod validation
- `nestjs-pattern.md` — NestJS decorators, DI, guards, interceptors, DTOs
- `postgresql-pattern.md` — Indexing strategies, CTEs, full-text search
- `web-platform-expert.md` — Browser APIs, fetch, WebSockets

## Key Environment Variables

**Backend** (`backend/.env`):
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` / `JWT_EXPIRES_IN` — token signing
- `OPENROUTER_API_KEY` / `OPENROUTER_MODEL` — AI generation
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_ID_PRO` / `STRIPE_PRICE_ID_ENTERPRISE`
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_KEY` — optional file storage

**Frontend** (`frontend/.env.local`):
- `NEXT_PUBLIC_API_URL` — backend base URL
- `NEXT_PUBLIC_APP_NAME` — display name
