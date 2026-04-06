# Cognify - AI-Powered Study Platform

A production-ready, multi-tenant SaaS platform for Cognify is a modern, full-stack application designed to help students master any subject through AI-generated questions and study materials.

## Tech Stack

**Frontend:** Next.js 14, TypeScript, TailwindCSS  
**Backend:** NestJS, TypeScript, Prisma ORM  
**Database:** PostgreSQL  
**AI:** OpenRouter API (Gemini 2.0 Flash)  
**Billing:** Stripe

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- OpenRouter API key (for AI features)
- Stripe keys (for billing)

### Setup

1. **Clone and install dependencies**

```bash
cd Cognify
npm install --prefix backend
npm install --prefix frontend
```

2. **Configure environment**

```bash
# Backend
cp backend/.env.example backend/.env
# Edit .env with your API keys

# Frontend
cp frontend/.env.local.example frontend/.env.local
```

3. **Start with Docker**

```bash
docker-compose up -d
```

Or run locally:

```bash
# Start database
docker-compose up postgres -d

# Run migrations
cd backend && npx prisma migrate dev

# Start backend
npm run start:dev

# Start frontend (new terminal)
cd ../frontend && npm run dev
```

4. **Access the app**

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api

## Features

### Multi-Tenant Architecture

- Organization isolation at API level
- JWT tokens include `organizationId`
- Role-based access (Admin, Instructor, Student)

### AI Question Generation

- Powered by OpenRouter / Gemini 2.0 Flash
- Generates multiple choice questions from topics
- Approval workflow before student access

### Quiz System

- Interactive question interface
- Real-time answer feedback
- Progress tracking per course

### Billing

- Stripe integration
- Plan-based feature limits
- Customer portal for subscription management

## API Endpoints

| Endpoint                      | Description                 |
| ----------------------------- | --------------------------- |
| `POST /auth/register`         | Create organization + admin |
| `POST /auth/login`            | Get access token            |
| `GET /courses`                | List courses                |
| `POST /ai/generate-questions` | Generate AI questions       |
| `POST /attempts`              | Submit quiz answer          |
| `GET /attempts/stats`         | Get user statistics         |
| `POST /billing/checkout`      | Start subscription          |

## Environment Variables

### Backend

| Variable                | Description                  |
| ----------------------- | ---------------------------- |
| `DATABASE_URL`          | PostgreSQL connection string |
| `JWT_SECRET`            | JWT signing secret           |
| `OPENROUTER_API_KEY`    | OpenRouter API key           |
| `STRIPE_SECRET_KEY`     | Stripe secret key            |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret        |

### Frontend

| Variable              | Description     |
| --------------------- | --------------- |
| `NEXT_PUBLIC_API_URL` | Backend API URL |

## Development

```bash
# Backend tests
cd backend && npm run test

# Prisma studio (database UI)
cd backend && npx prisma studio

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

## License

MIT
