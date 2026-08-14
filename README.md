# FinFlow — Personal Finance Management SaaS

FinFlow is a full-stack personal-finance application for tracking accounts, transactions, budgets, recurring payments, savings goals, and financial trends. It is built as a pnpm monorepo with a premium Next.js frontend and a separate Express REST API backed by PostgreSQL and Prisma.

> The app manages manually entered or CSV-imported data. It does not claim to connect to real bank accounts.

## Table of contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Run locally](#run-locally)
- [Environment variables](#environment-variables)
- [Demo account](#demo-account)
- [Useful commands](#useful-commands)
- [Troubleshooting](#troubleshooting)
- [API overview](#api-overview)
- [Project structure](#project-structure)
- [Quality checks](#quality-checks)
- [Deployment](#deployment)

## Features

- Account management for cash, bank, wallet, card, investment, and other accounts.
- Income, expense, and transfer tracking with Decimal-safe money storage.
- Atomic transfers: both account balances and paired transfer records update in one database transaction.
- Searchable and filterable transaction APIs, plus CSV transaction import/export.
- Monthly category budgets calculated from real expense transactions.
- Savings goals, recurring transaction scheduling, activity history, and dashboard analytics.
- JWT access tokens, rotating hashed refresh-token sessions, Zod validation, rate limits, Helmet, CORS, and ownership-scoped API queries.
- Responsive light/dark fintech dashboard, analytics charts, mobile navigation, polished auth, and landing pages.

## Architecture

```mermaid
flowchart LR
  Browser[Next.js / React web app]
  API[Express REST API]
  Prisma[Prisma ORM]
  Database[(PostgreSQL)]
  Worker[Recurring transaction worker]

  Browser -->|HTTPS / REST + JWT| API
  API --> Prisma
  Prisma --> Database
  Worker --> Prisma
```

The frontend only calls the REST API. Financial records are never hard-coded in the UI: dashboard balances, charts, budgets, goals, and recent activity are queried from PostgreSQL through the API.

## Tech stack

| Area | Technology |
| --- | --- |
| Web | Next.js App Router, React, TypeScript, Tailwind CSS, TanStack Query, Recharts, Lucide |
| API | Node.js, Express 5, TypeScript, Zod, JWT, bcrypt, Multer |
| Database | PostgreSQL 16, Prisma ORM |
| Tooling | pnpm workspaces, ESLint, Vitest, Docker Compose |

## Prerequisites

Install the following before starting:

1. **Node.js 20 or newer** — check with `node --version`.
2. **pnpm 10 or newer** — check with `pnpm --version`.
3. **Docker Desktop** — required for the recommended local PostgreSQL setup. Start Docker Desktop and wait until its engine is running.

The project was verified with Node 22 and pnpm 10.

### Install pnpm if needed

```bash
npm install --global pnpm
```

Or, with Corepack enabled:

```bash
corepack enable
corepack prepare pnpm@10.15.0 --activate
```

## Run locally

These commands start a complete local FinFlow environment: PostgreSQL, API, frontend, migrations, and demo data.

### 1. Clone and enter the project

```bash
git clone <your-repository-url>
cd FinFlow
```

If you already have the project folder, open a terminal in that folder instead.

### 2. Create the local environment file

**Windows PowerShell**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux**

```bash
cp .env.example .env
```

The provided local defaults work with the included Docker PostgreSQL service. Do not commit `.env`.

### 3. Start PostgreSQL with Docker

```bash
docker compose up -d postgres
docker compose ps
```

Wait until the `postgres` service is `running` / `healthy`. It is available at `localhost:5432` with the local development credentials defined in `docker-compose.yml`.

### 4. Install project dependencies

```bash
pnpm install
```

### 5. Generate Prisma client, create tables, and seed demo data

Run these in the repository root:

```bash
pnpm db:generate
pnpm db:migrate -- --name init
pnpm db:seed
```

`db:migrate` creates the PostgreSQL schema. `db:seed` creates a demo user and six months of accounts, transactions, budgets, goals, and recurring payments for a meaningful dashboard immediately after login.

### 6. Start the web app and API

```bash
pnpm dev
```

This starts both applications concurrently:

| Service | URL |
| --- | --- |
| FinFlow web app | http://localhost:3000 |
| API health check | http://localhost:4000/api/health |
| PostgreSQL | `localhost:5432` |

Open http://localhost:3000/login and sign in with the demo account below.

### Run the services separately (optional)

Use separate terminals when you want to read each app’s logs independently:

```bash
# Terminal 1 — REST API
pnpm --filter @finflow/api dev

# Terminal 2 — Next.js web app
pnpm --filter @finflow/web dev
```

## Environment variables

Create `.env` from `.env.example`. The API loads the root `.env` file in local development.

| Variable | Required | Purpose | Local value |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/finflow?schema=public` |
| `JWT_ACCESS_SECRET` | Yes | Signs short-lived access tokens | Use a long random value outside local development |
| `JWT_REFRESH_SECRET` | Yes | Signs refresh tokens | Use a different long random value outside local development |
| `ACCESS_TOKEN_EXPIRES_IN` | No | Access-token TTL | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | No | Refresh-token TTL | `7d` |
| `CLIENT_URL` | Yes | Allowed frontend origin for API CORS | `http://localhost:3000` |
| `API_PORT` | No | Express server port | `4000` |
| `NEXT_PUBLIC_API_URL` | Yes | Browser-visible REST API base URL | `http://localhost:4000/api` |

Never use the supplied local JWT secrets in a deployed environment. Generate separate random secrets for production.

## Demo account

After running `pnpm db:seed`, use:

```text
Email:    demo@finflow.app
Password: Demo@12345
```

If you reseed the database while already logged in, sign out and sign in again. Reseeding replaces the demo user and invalidates existing local sessions.

## Useful commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Starts frontend and API together |
| `pnpm build` | Production build for both workspaces |
| `pnpm lint` | Runs ESLint for web and API |
| `pnpm typecheck` | Runs strict TypeScript checks |
| `pnpm test` | Runs API Vitest tests |
| `pnpm db:generate` | Generates Prisma Client |
| `pnpm db:migrate -- --name <name>` | Creates/applies a development Prisma migration |
| `pnpm db:seed` | Recreates demo data |
| `pnpm db:studio` | Opens Prisma Studio |
| `docker compose logs -f postgres` | Tails PostgreSQL container logs |
| `docker compose down` | Stops local PostgreSQL while keeping its data volume |

### Reset local database data

> Warning: this deletes your local PostgreSQL data, including manually created accounts and transactions.

```bash
docker compose down -v
docker compose up -d postgres
pnpm db:migrate -- --name init
pnpm db:seed
```

## Troubleshooting

### `docker: command not found` or `docker is not recognized`

Open Docker Desktop and wait for the engine to start. Close and reopen your terminal after installing Docker Desktop so its CLI is added to `PATH`.

On some Windows per-user installations, Docker may be at:

```powershell
& "$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin\docker.exe" version
```

### Docker starts, but PostgreSQL is not healthy

```bash
docker compose ps
docker compose logs postgres
```

Port `5432` may already be used by another PostgreSQL instance. Stop that service or change the host-side port in `docker-compose.yml` and update `DATABASE_URL` to match.

### `Failed to fetch` in the browser

1. Confirm the API is running: http://localhost:4000/api/health
2. Confirm `NEXT_PUBLIC_API_URL=http://localhost:4000/api` in `.env`.
3. Confirm `CLIENT_URL=http://localhost:3000` in `.env`.
4. Restart `pnpm dev` after changing environment variables.

### Dashboard says it cannot load data

Your session may be expired or from before a database reset. Visit http://localhost:3000/login and sign in again with the demo credentials. The web app automatically clears invalid local sessions.

### Prisma reports a missing `DATABASE_URL`

Make sure you created `.env`, started PostgreSQL, and are running commands from the repository root:

```bash
docker compose up -d postgres
pnpm db:migrate -- --name init
```

### Prisma reports `EPERM` while generating on Windows

The Prisma query engine can be locked by a running API process. Stop the API/dev server, then run:

```bash
pnpm db:generate
```

Start `pnpm dev` again afterwards.

### Port 3000 or 4000 is already in use

Stop the previous Next.js/Node process, then rerun `pnpm dev`. On Windows, identify the owning process with:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen
Get-NetTCPConnection -LocalPort 4000 -State Listen
```

## API overview

All resource endpoints, except registration/login/refresh/health, require a Bearer access token.

| Area | Routes |
| --- | --- |
| Health | `GET /api/health` |
| Authentication | `POST /api/auth/register`, `/login`, `/refresh`, `/logout`; `GET /api/auth/me` |
| Accounts | `GET/POST /api/accounts`, `GET/PATCH/DELETE /api/accounts/:id` |
| Transactions | `GET/POST /api/transactions`, `GET/PATCH/DELETE /api/transactions/:id`, `GET /api/transactions/export` |
| Transfers | `GET/POST /api/transfers` |
| Budgets | `GET/POST /api/budgets`, `PATCH/DELETE /api/budgets/:id` |
| Recurring | `GET/POST /api/recurring-transactions`, `PATCH/DELETE /api/recurring-transactions/:id`, `POST /api/recurring-transactions/:id/toggle` |
| Goals | `GET/POST /api/goals`, `PATCH/DELETE /api/goals/:id` |
| Analytics | `GET /api/analytics/summary`, `/cashflow`, `/categories` |
| Import/export | `POST /api/imports/transactions`, `GET /api/transactions/export` |
| Activity | `GET /api/activity` |

The API uses a consistent response envelope:

```json
{ "success": true, "data": {} }
```

## Project structure

```text
FinFlow/
├── apps/
│   ├── api/                 # Express API, Prisma schema, services, tests
│   │   ├── prisma/
│   │   └── src/
│   └── web/                 # Next.js App Router frontend
│       ├── app/
│       ├── components/
│       └── lib/
├── .github/workflows/       # CI configuration
├── docker-compose.yml       # Local PostgreSQL
├── .env.example             # Required environment variables
├── package.json             # Workspace scripts
└── pnpm-workspace.yaml
```

## Financial and security notes

- Money uses PostgreSQL `Decimal(18,2)`, not JavaScript floating-point storage.
- Transaction creates, edits, and deletes update the associated account balance atomically.
- Transfers create linked `TRANSFER_OUT` and `TRANSFER_IN` records and update both balances inside one Prisma transaction.
- Refresh tokens are hashed before persistence and rotated on refresh.
- Every user-owned query scopes records to the authenticated JWT subject.
- Recurring executions use a unique `(recurringTransactionId, scheduledDate)` record to prevent duplicate execution after a retry.
- CSV uploads are restricted to CSV, limited in size, row-validated, and exported values are protected against spreadsheet formula injection.

## Quality checks

Run the full local verification suite before opening a pull request or deploying:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Deployment

Use any platform that can run a Node.js service and managed PostgreSQL.

- **Frontend:** Vercel or another Next.js-compatible host.
- **API:** Railway, Render, Fly.io, or another Node.js host.
- **Database:** Railway PostgreSQL, Neon, Supabase PostgreSQL, or another managed PostgreSQL provider.

Set production values for every environment variable, especially `DATABASE_URL`, `CLIENT_URL`, `NEXT_PUBLIC_API_URL`, and unique JWT secrets. Run Prisma migrations as part of deployment. Do not deploy the local Docker credentials or `.env` file.

## Screenshots

Verified screenshots can be added under `docs/screenshots/`:

```text
dashboard-light.png
dashboard-dark.png
transactions.png
analytics.png
mobile-dashboard.png
```

No screenshots are committed automatically; add only screenshots captured from the real running application.
