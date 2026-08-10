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

Client components always call the local Next.js proxy at `/api/*`, which `next.config.ts` rewrites to the backend. Server-side code hits `NEXT_PUBLIC_API_URL` directly. The backend validates JWT tokens on every request via `JwtAuthGuard`.

### Authentication & Session Model

**The session is an HttpOnly cookie, not a bearer token in `localStorage`.**

- On login / email verification / OAuth, the backend sets a `cognify_token` cookie (`HttpOnly`, `SameSite=Lax`, `Secure` in production). The token is **never** in a response body or a URL.
- The frontend cannot read the session. `lib/api.ts` sends `withCredentials: true` and never sets an `Authorization` header; `AuthProvider` learns who the user is by calling `GET /auth/profile`.
- Logout is a real round-trip (`POST /auth/logout`) — only the server can clear an HttpOnly cookie.
- CSRF is handled by `SameSite=Lax`, which relies on **every mutating endpoint being non-GET**. Do not add a state-changing `@Get()` route.
- `JwtStrategy.validate()` re-reads the user from the database on every request, so role changes and deactivations take effect immediately rather than at token expiry. Never trust the `role` claim in the token.
- Google OAuth uses a signed-cookie `state` parameter (`CookieStateStore`) to prevent login CSRF. The `callbackURL` is absolute and points at the **frontend** origin (`<FRONTEND_URL>/api/auth/google/callback`) so the proxy puts the cookie on the origin the browser uses.

**Privilege rules:** `role` is not a self-editable field. `RegisterDto` accepts only `STUDENT | INSTRUCTOR`, and `UpdateProfileDto` accepts no role at all. Promotion happens exclusively through the `access-control` request/approval flow. Global `ValidationPipe` uses `forbidNonWhitelisted: true`, so sending an unexpected property returns 422 — adding a field to a request means adding it to the DTO.

### Tenancy Model

There is currently **no organization/multi-tenant layer** — `Organization` and `organizationId` do not exist in the schema, and the JWT carries only `sub`, `email`, and `role`. Authorization is per-user: resources are owned via `createdById` / `uploadedById`, and services compare that against the current user (admins bypass). Do not assume tenant isolation exists.

### Backend Module Structure (`backend/src/modules/`)

- **auth/** — registration, OTP email verification, login, Google OAuth, cookie session
- **courses/** — course CRUD, prerequisites, publish/visibility toggle
- **questions/** — question CRUD, AI-generated flag, approval workflow
- **answers/** — answer options for questions (always created with the question)
- **attempts/** — records student answer submissions, computes `isCorrect`
- **materials/** — file uploads associated with courses (optional Supabase storage)
- **ai/** — calls OpenRouter API (Gemini 2.0 Flash), parses JSON into questions, enforces plan limits
- **access-control/** — role request workflow (STUDENT → INSTRUCTOR requests)
- **users/** — user profile management

### Database Schema Key Points (`backend/prisma/schema.prisma`)

- `User.passwordHash` is nullable — Google-only accounts have no password
- `User.googleId` links an OAuth identity; `isEmailVerified` is set to true on Google sign-in
- `EmailVerification.attempts` caps OTP guesses; the record is destroyed at `OTP_MAX_ATTEMPTS`
- `Question.approved` gates whether students see AI-generated questions
- `Attempt` records one answer per question attempt; `isCorrect` is stored
- `Plan` enum: `FREE | PRO | ENTERPRISE` — controls AI generation limits
- **Course Visibility Controls:**
  - `isPublished`: Content readiness gate. If false (Draft), the course is still being written and is hidden from all students.
  - `isPublic`: Cross-org sharing gate. If true, the course is discoverable by students from *other* organizations who follow the course's organization. A course must be both published and public to appear in followers' feeds.

### Frontend Structure (`frontend/src/`)

- **app/** — Next.js App Router pages; one directory per feature
- **components/ui/** — Radix UI primitives wrapped with Tailwind/CVA
- **lib/api.ts** — Axios instance (`withCredentials: true`); all API calls go through here. No token handling — the session cookie is attached by the browser.
- **lib/auth.tsx** — `AuthProvider`; hydrates the user from `GET /auth/profile`. Exposes `user`, `isLoading`, `login`, `register`, `verifyEmail`, `refreshUser`, `logout`. There is no `token` — it is not readable by JavaScript by design.
- **types/** — Shared TypeScript interfaces mirroring backend DTOs

### AI Question Generation Flow

1. Instructor submits topic + course ID to `POST /ai/generate-questions`
2. Backend checks plan limits, calls OpenRouter with a structured prompt
3. Response is parsed into `Question` + `Answer` records with `aiGenerated: true`, `approved: false`
4. Admin/instructor reviews and approves questions before students can attempt them

### Role-Based Access

Roles: `ADMIN > INSTRUCTOR > STUDENT`. Guards (`RolesGuard` + `@Roles()` decorator) protect endpoints. Students can only read approved questions and submit attempts. Instructors can create/edit courses and questions. Admins manage settings and approve role requests.

Rate limiting is global via `ThrottlerProxyGuard` (`APP_GUARD`), which reads the client IP from `X-Forwarded-For` because traffic arrives through the Next.js proxy. Auth endpoints tighten the default with `@Throttle`.

## Agent Rules

The `.agent/rules/` directory contains detailed pattern guides for AI assistance:
- `nextjs-pattern.md` — App Router patterns, route handlers, Zod validation
- `nestjs-pattern.md` — NestJS decorators, DI, guards, interceptors, DTOs
- `postgresql-pattern.md` — Indexing strategies, CTEs, full-text search
- `web-platform-expert.md` — Browser APIs, fetch, WebSockets

## Key Environment Variables

**Backend** (`backend/.env`):
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` / `JWT_EXPIRES_IN` — token signing (secret must be ≥32 chars)
- `COOKIE_SECRET` — signs auth/OAuth-state cookies (≥32 chars, distinct from `JWT_SECRET`)
- `FRONTEND_URL` — public frontend origin; the only allowed CORS origin and the OAuth redirect base
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — required when `NODE_ENV=production`
- `OPENROUTER_API_KEY` / `OPENROUTER_MODEL` — AI generation
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_ID_PRO` / `STRIPE_PRICE_ID_ENTERPRISE`
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_KEY` — optional file storage

**Frontend** (`frontend/.env.local`):
- `NEXT_PUBLIC_API_URL` — backend base URL
- `NEXT_PUBLIC_APP_NAME` — display name
