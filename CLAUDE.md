# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cognify is an AI-assisted study platform. Instructors build courses (by hand or by generating questions from their PDFs); students take quizzes and track progress; admins manage every course and approve instructor requests.

## Commands

### Backend (NestJS)

```bash
cd backend

npm run start:dev        # Development server with watch mode (port 3001)
npm run build            # Compile TypeScript (output: dist/src/main.js)
npm run start:prod       # Production (requires build first)

npm run lint             # ESLint, check only (CI runs this)
npm run lint:fix         # ESLint with auto-fix
npm run format           # Prettier

npm test                 # Unit tests (src/**/*.spec.ts, mocked Prisma)
npm run test:cov         # Unit tests with coverage
npm run test:system      # System tests against a real database (see Testing)

# Database
npm run db:migrate       # prisma migrate deploy
npm run db:seed          # demo accounts (admin/instructor/student @cognify.local, password123)
npm run db:baseline      # one-time, for databases created with `prisma db push`
npx prisma migrate dev --name <name>   # Create a migration after editing schema.prisma
npx prisma generate                    # Regenerate the client after schema changes
```

### Frontend (Next.js)

```bash
cd frontend

npm run dev              # Development server (port 3000)
npm run build            # Production build (needs NEXT_PUBLIC_API_URL at build time)
npm run lint             # ESLint
npm run typecheck        # tsc --noEmit
npm test                 # Vitest unit tests (src/**/*.test.ts(x))
```

### End-to-end (Playwright)

```bash
cd e2e
npm ci
npx playwright test      # Starts both built apps; needs DATABASE_URL, JWT_SECRET, COOKIE_SECRET
```

### Full Stack (Docker)

```bash
docker-compose up -d                   # postgres (pgvector), backend, frontend
docker-compose up postgres -d          # only PostgreSQL, for local development
```

## Architecture

### Services

| Service  | Technology | Port |
|----------|-----------|------|
| Frontend | Next.js 16, React 19, TailwindCSS 4 | 3000 |
| Backend  | NestJS 11, Prisma 7, TypeScript | 3001 |
| Database | PostgreSQL 16 + pgvector | 5432 |

Client components always call the local Next.js proxy at `/api/*`, which `next.config.ts` rewrites to the backend. Server-side code hits `NEXT_PUBLIC_API_URL` directly.

`src/app.setup.ts` (`configureApp`) holds the global HTTP pipeline (helmet, cookie-parser, ValidationPipe, response envelope, exception filter, CORS, `/api` prefix). `main.ts` and the system tests both call it, so tests exercise exactly what production runs.

Responses are `{ success: true, data, message }`; errors are `{ success: false, error: { code, message, details, path, timestamp } }`. The exception filter maps Prisma P2025/P2002/P2003 to 404/409/400.

### Authentication & Session Model

**The session is an HttpOnly cookie, not a bearer token in `localStorage`.**

- On login / email verification / OAuth, the backend sets a `cognify_token` cookie (`HttpOnly`, `SameSite=Lax`, `Secure` in production). The token is **never** in a response body or a URL.
- The frontend cannot read the session. `lib/api.ts` sends `withCredentials: true` and never sets an `Authorization` header; `AuthProvider` learns who the user is by calling `GET /auth/profile` (a 401 there is silent: it just means "signed out").
- Logout is a real round-trip (`POST /auth/logout`) — only the server can clear an HttpOnly cookie.
- CSRF is handled by `SameSite=Lax`, which relies on **every mutating endpoint being non-GET**. Do not add a state-changing `@Get()` route (GET handlers must not write, including "create if missing").
- `JwtStrategy.validate()` re-reads the user from the database on every request, so role changes and deactivations take effect immediately. Never trust the `role` claim in the token.
- Google OAuth uses a signed-cookie `state` (`CookieStateStore`). The `callbackURL` points at the **frontend** origin (`<FRONTEND_URL>/api/auth/google/callback`). Linking Google to an existing **unverified** account discards that account's password, name and role (anyone can register any address); keep it that way.
- Email codes: 6 digits from `crypto.randomInt`, 15-minute expiry, at most 5 submissions per code (spent atomically *before* comparing), and a 60-second resend cooldown per address.
- Without `RESEND_API_KEY` (allowed outside production) codes are logged instead of emailed; without Google credentials the Google routes answer 404.

**Privilege rules:** `role` is not a self-editable field. `RegisterDto` accepts only `STUDENT | INSTRUCTOR` (instructor sign-up is self-service), and `UpdateProfileDto` accepts no role at all. Promotion of existing students goes through `access-control` (request → admin approval; approval only promotes students). Global `ValidationPipe` uses `forbidNonWhitelisted: true`, so sending an unexpected property returns 422 — adding a field to a request means adding it to a DTO class (never type a `@Body()` inline; inline types skip validation).

### Access model (no tenancy)

There is **no organization/multi-tenant layer**. Authorization is per course, decided in one place: `src/common/access/course-access.service.ts`.

- **Manage** a course (edit it, add questions/materials, see answer keys and unapproved questions, generate with AI): the course creator or an admin. Holding the INSTRUCTOR role is **not** enough — check `assertCanManage(courseId, user)` in every course-scoped write.
- **View** a course: everyone if `isPublic`, otherwise only people who can manage it. Private courses answer **404** (not 403) to everyone else, on every read path (courses, questions, materials, leaderboard, attempts). Use `assertCanView` / `canView`.
- **Answer keys** (`Answer.isCorrect`) are only sent to managers. Everyone else gets answers through `stripAnswerKey()`. Learners find out the right option after answering: `POST /attempts` (signed in, recorded) or `POST /questions/:id/check` (guests, not recorded).

### Backend Module Structure (`backend/src/`)

- **common/access/** — `CourseAccessService`, `stripAnswerKey` (global module)
- **modules/auth/** — registration, OTP verification, login, Google OAuth, cookie session, password change, account deletion
- **modules/courses/** — course CRUD, visibility, prerequisites (with cycle detection)
- **modules/questions/** — questions and their answers, image questions, approval, guest grading (`gradeSelection`)
- **modules/attempts/** — scoring, quiz position, personal stats, instructor analytics (`GET /attempts/analytics`)
- **modules/materials/** — PDF upload: extract → chunk → embed → store file → rows
- **modules/embedding/** — OpenRouter embeddings (512-d), text chunker
- **modules/ai/** — retrieval (`RagService`), generation, `question-parser.ts`
- **modules/leaderboard/** — submissions and ranking
- **modules/access-control/** — instructor-access requests
- **modules/email/** — Resend client, contact form
- **modules/storage/** — Supabase Storage (falls back to data URIs without config; development only)
- **health/** — `GET /api/health` (database ping), used by the Docker HEALTHCHECK

### Database (`backend/prisma/schema.prisma`)

- Change the schema with `prisma migrate dev`, never `prisma db push` (it drops the HNSW index on `MaterialChunk.embedding`, which Prisma cannot model and which lives only in the baseline migration). CI fails if `schema.prisma` and the migrations disagree.
- `User.passwordHash` is nullable — Google-only accounts have no password (`hasPassword: false` in the profile).
- `Course.isPublic` is the only visibility flag (there is no `isPublished`).
- `Question.approved`: manual questions are approved on creation; AI drafts are reviewed in the UI and saved through `POST /questions/bulk` already approved.
- `Attempt` keeps one row per user and question; a retry overwrites it.
- `QuizProgress` is unique per user and course; completion = every approved question answered correctly.
- `LeaderboardEntry`: signed-in scores are computed from attempts; guest scores are capped at the real question count.
- `MaterialChunk.embedding` is `vector(512)` and only touched through raw SQL (Prisma `Unsupported`).
- `RoleRequest`, `CoursePrerequisite`: real models (they used to be called through `as any` on a missing model — don't reintroduce `as any` on Prisma calls).
- `Plan`, `Subscription` and the Stripe settings exist but nothing uses them yet.

### Frontend Structure (`frontend/src/`)

- **app/** — Next.js App Router pages; one directory per feature
- **components/ui/** — UI primitives and feature components (`quiz-card`, modals)
- **lib/api.ts** — Axios instance (`withCredentials: true`); all API calls go through here
- **lib/auth.tsx** — `AuthProvider`; hydrates the user from `GET /auth/profile`. There is no `token` — it is not readable by JavaScript by design.
- **lib/quiz.ts** — guest result mapping and score summary
- **lib/error-utils.ts** — read error messages from the API envelope (`getApiErrorMessage`)
- **lib/i18n.tsx** + **lib/translations/** — en/vi/fi; new UI strings go into all three
- **types/** — Shared TypeScript interfaces mirroring backend DTOs

### AI Question Generation Flow

1. The instructor uploads a PDF (`POST /materials/upload`): text is extracted, split into 800-character chunks (100 overlap), embedded (512-d) and stored with pgvector.
2. `POST /ai/generate-questions` (course owner only) embeds the topic, retrieves the 5 nearest chunks of that material, and asks Gemini (via OpenRouter) for questions in a delimited format parsed by `question-parser.ts`.
3. Drafts return to the browser; nothing is saved until the instructor confirms, which saves them through `POST /questions/bulk`.

### Rate limiting

Global `ThrottlerProxyGuard` (`APP_GUARD`, 120/min default; tighter `@Throttle` on auth, AI, uploads, leaderboard, contact). The client IP comes from `X-Forwarded-For` because traffic arrives through the Next.js proxy; set `TRUSTED_PROXY_HOPS` to the number of proxies in front of the API so client-supplied entries are ignored.

## Testing

- **Unit** (`backend/src/**/*.spec.ts`, `frontend/src/**/*.test.ts(x)`): no database. Backend tests use `src/testing/prisma.mock.ts`.
- **System** (`backend/test/system/*.system-spec.ts`): the real `AppModule` over HTTP against PostgreSQL + pgvector, with email and embeddings faked. Needs `DATABASE_URL` set in the shell, pointing at a migrated database whose name contains `test` (the suite truncates every table).
- **End-to-end** (`e2e/`): Playwright against both built apps and a migrated database.
- **CI** (`.github/workflows/ci.yml`): all of the above on pull requests and pushes to `main`.

When fixing a bug, add a test at the lowest layer that can show it.

## Agent Rules

The `.agent/rules/` directory contains detailed pattern guides for AI assistance:
- `nextjs-pattern.md` — App Router patterns, route handlers, Zod validation
- `nestjs-pattern.md` — NestJS decorators, DI, guards, interceptors, DTOs
- `postgresql-pattern.md` — Indexing strategies, CTEs, full-text search
- `web-platform-expert.md` — Browser APIs, fetch, WebSockets

## Key Environment Variables

**Backend** (`backend/.env`, see `.env.example`):
- `DATABASE_URL` — PostgreSQL (with pgvector) connection string
- `JWT_SECRET` / `JWT_EXPIRES_IN` — token signing (secret must be ≥32 chars)
- `COOKIE_SECRET` — signs auth/OAuth-state cookies (≥32 chars, distinct from `JWT_SECRET`)
- `FRONTEND_URL` — public frontend origin; the only allowed CORS origin and the OAuth redirect base
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — required when `NODE_ENV=production`
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `SUPPORT_EMAIL` — email; the key is required in production
- `TRUSTED_PROXY_HOPS` — proxies in front of the API (the Next.js proxy counts as one)
- `OPENROUTER_API_KEY` / `OPENROUTER_MODEL` — AI generation and embeddings
- `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` — file storage (optional in development)
- `STRIPE_*` — not used yet

**Frontend** (`frontend/.env.local`):
- `NEXT_PUBLIC_API_URL` — backend base URL (baked in at build time)
- `NEXT_PUBLIC_APP_NAME` — display name
