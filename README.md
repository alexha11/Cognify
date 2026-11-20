# Cognify

An AI-assisted study platform. Instructors build courses by hand or generate
multiple-choice questions from their own PDFs; students take quizzes, track
progress and compete on course leaderboards; anyone can take a quiz through a
share link.

## Stack

| Part      | Technology                                             | Port |
| --------- | ------------------------------------------------------ | ---- |
| Frontend  | Next.js 16 (App Router), React 19, Tailwind CSS 4      | 3000 |
| Backend   | NestJS 11, Prisma 7                                     | 3001 |
| Database  | PostgreSQL 16 with pgvector                             | 5432 |
| AI        | OpenRouter: Gemini 2.0 Flash, text-embedding-3-small    |      |
| Email     | Resend (optional in development)                        |      |

Browsers only talk to the frontend: it proxies `/api/*` to the backend, and
the session is an HttpOnly cookie.

## Getting started

Requires Node.js 20.19 or later (CI uses 22) and Docker (for PostgreSQL).

```bash
npm install --prefix backend
npm install --prefix frontend
cp backend/.env.example backend/.env   # then set JWT_SECRET and COOKIE_SECRET
docker-compose up postgres -d
```

```bash
cd backend
npm run db:migrate    # apply migrations
npm run db:seed       # optional: demo accounts and courses
npm run start:dev
```

```bash
cd frontend
npm run dev
```

Open http://localhost:3000. The seed creates `admin@cognify.local`,
`instructor@cognify.local` and `student@cognify.local`, all with the password
`password123`. Without `RESEND_API_KEY`, verification codes for new sign-ups
are printed in the backend log.

To run everything in containers instead: `docker-compose up -d`.

### Migrations

`npm run db:migrate` (`backend/scripts/migrate.mjs`) brings any database up to
date: an empty one, one with a migration history, and one created with
`prisma db push`. The migration history was replaced by an idempotent baseline
in November 2026, so for a `db push` database the script runs that baseline
(adding only what is missing) and records it before applying the rest; a
leftover failed record from the old history is marked rolled back.

Change the schema with `npx prisma migrate dev --name <name>`. Do not use
`prisma db push`: it drops the vector index that Prisma cannot model.

## Deploying

The API image (`backend/Dockerfile`) and `npm run start:prod` both run the
migrations before starting the server. If a migration fails, the process
exits instead of serving an API whose queries would fail, so on a host such as
Render the deploy fails and the previous version stays live; the log names the
migration to resolve.

Production needs `DATABASE_URL`, `JWT_SECRET`, `COOKIE_SECRET`,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL` (the public https
origin) and `NODE_ENV=production`, plus `TRUSTED_PROXY_HOPS` when behind a
proxy. `RESEND_API_KEY` is optional: without it the API runs, but email sign-up
and the contact form answer 503 until it is set (Google sign-in works).

## Tests

| Layer             | Command (from its folder)  | What it covers                                               |
| ----------------- | -------------------------- | ------------------------------------------------------------ |
| Backend unit      | `npm test`                 | Services with a mocked database: auth, access rules, scoring |
| Backend system    | `npm run test:system`      | The real API over HTTP against PostgreSQL + pgvector         |
| Frontend unit     | `npm test`                 | API client, quiz helpers, components (Vitest)                |
| End-to-end        | `npx playwright test`      | Browser flows across frontend, backend and database          |

System and end-to-end tests need a migrated, disposable database:

```bash
docker-compose up postgres -d
docker exec cognify-db createdb -U cognify cognify_test
cd backend
DATABASE_URL=postgresql://cognify:cognify_local_password@localhost:5432/cognify_test npm run db:migrate
DATABASE_URL=postgresql://cognify:cognify_local_password@localhost:5432/cognify_test npm run test:system
```

System tests delete all data, so they refuse to run against a database whose
name does not contain `test`. For end-to-end tests, build both apps
(`npm run build` in each, with `NEXT_PUBLIC_API_URL=http://localhost:3001/api`
for the frontend), install the e2e dependencies (`npm ci` in `e2e/`), set
`DATABASE_URL`, `JWT_SECRET` and `COOKIE_SECRET`, and run
`npx playwright test` in `e2e/`; Playwright starts both servers.

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request and every push to `main`:

1. Backend: lint, build, unit tests with coverage.
2. Backend system: migrations on an empty database, a check that
   `schema.prisma` matches the migrations, system tests.
3. Production image: builds `backend/Dockerfile`, starts it with
   `NODE_ENV=production` on an empty database (no email key), checks that it
   is healthy with every migration applied, then restarts it.
4. Frontend: lint, type-check, unit tests, production build.
5. End-to-end: builds both apps and runs Playwright (after 1 and 4 pass).

## Configuration

See [`backend/.env.example`](backend/.env.example) for every backend setting.
In production, `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are required,
`RESEND_API_KEY` is needed for email sign-up (see Deploying), and
`TRUSTED_PROXY_HOPS` should be set to the number of proxies in front of the API
so rate limits cannot be dodged by forging `X-Forwarded-For`.

The frontend needs `NEXT_PUBLIC_API_URL` (the backend's URL) at build time.

## Roles

- **Student**: takes quizzes, sees progress and leaderboards, can ask to become
  an instructor.
- **Instructor**: everything a student can do, plus creating courses,
  questions and materials in their own courses. Sign-up offers this role
  directly.
- **Admin**: manages every course and approves instructor requests. Create the
  first admin with the seed or by setting `role = 'ADMIN'` in the database.

## License

MIT
