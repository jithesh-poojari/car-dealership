# DriveHub: Car Dealership Inventory System

A full-stack inventory app for a car dealership, built for the TDD Kata. Staff and customers can browse vehicles, search and filter them, and buy one. Admins can add, edit, delete and restock vehicles.

- **Backend:** Node.js, TypeScript, Express 5, Prisma, PostgreSQL (Supabase), JWT auth
- **Frontend:** Next.js (React), Tailwind CSS v4, client-rendered
- **Tests:** Vitest + Supertest for the API, Vitest + Testing Library for the UI
- **Monorepo:** pnpm workspace (`apps/api`, `apps/web`)

**Live demo:** _add link if deployed_

## Screenshots

| Login | Dashboard (admin) |
|---|---|
| ![Login](docs/screenshots/login.png) | ![Dashboard](docs/screenshots/dashboard.png) |

| Add vehicle | Search and filters |
|---|---|
| ![Add vehicle](docs/screenshots/add-vehicle.png) | ![Filters](docs/screenshots/filters.png) |

## Features

- Register and log in with email and password (passwords hashed with bcrypt, sessions via JWT)
- Roles: `USER` and `ADMIN`. The role is decided on the server. Whoever registers with the email in `ADMIN_EMAIL` becomes an admin.
- Vehicle list, search (make, model, category, price range), purchase
- Admin only: add, edit, delete, restock
- Purchase is disabled in the UI when stock is zero, and the API also refuses it with `409`

## API

All vehicle routes need `Authorization: Bearer <token>`.

| Method | Route | Access | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | public | `201`, `409` if the email exists |
| POST | `/api/auth/login` | public | returns `{ token, user }` |
| GET | `/api/auth/me` | user | current user |
| POST | `/api/vehicles` | user | add a vehicle |
| GET | `/api/vehicles` | user | list all vehicles |
| GET | `/api/vehicles/search` | user | `make`, `model`, `category`, `minPrice`, `maxPrice` |
| GET | `/api/vehicles/:id` | user | one vehicle |
| PUT | `/api/vehicles/:id` | user | partial update |
| DELETE | `/api/vehicles/:id` | admin | `204` |
| POST | `/api/vehicles/:id/purchase` | user | decrements stock, `409` if out of stock |
| POST | `/api/vehicles/:id/restock` | admin | body `{ "quantity": 5 }` |
| GET | `/api/health` | public | health check |

Errors are always `{ "error": "message" }`. Validation errors also include `details`.

### Design notes

- `routes` parse and validate input, `services` hold the logic, and one error handler turns errors into HTTP responses.
- Purchase is one conditional `UPDATE ... WHERE quantity > 0`, so two people buying the last car at the same time can't push stock below zero. There is a test for this.

## Running it locally

**Requirements:** Node 20+, pnpm, a PostgreSQL database (I used a free Supabase project).

```bash
git clone <repo-url>
cd <repo>
pnpm install
```

### 1. Backend

```bash
cd apps/api
cp .env.example .env
cp .env.test.example .env.test
```

Fill in `.env`:

| Variable | Meaning |
|---|---|
| `DATABASE_URL` | Pooled connection string (Supabase port 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | Direct connection string (port 5432), used by `prisma db push` |
| `JWT_SECRET` | Long random string |
| `ADMIN_EMAIL` | The email that becomes admin when it registers |
| `FRONTEND_URL` | Allowed browser origin, e.g. `http://localhost:3000` |

Then:

```bash
pnpm prisma generate
pnpm db:push
pnpm dev          # http://localhost:4000
```

### 2. Frontend

```bash
cd apps/web
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:4000
pnpm dev                       # http://localhost:3000
```

Register with the `ADMIN_EMAIL` address to get the admin view.

## Tests

Tests for the API run against a separate `test` schema in the same database (`.env.test`, with `?schema=test`). The setup and the reset helper both refuse to run if the URL doesn't point at that schema, so they can't wipe real data.

```bash
cd apps/api && pnpm test
cd apps/api && pnpm test:coverage
cd apps/web && pnpm test
```

### Test report

_Paste the real output here after running the commands above. Don't edit the numbers._

```
<output of: pnpm --filter api test:coverage>
```

```
<output of: pnpm --filter web test>
```

### How I followed TDD

Each backend feature was built in commits of the form `test:` (red), `feat:` (green), then `refactor:` where it applied. `git log --oneline` shows the order.

## Deployment

- **API:** Render web service. Build: `pnpm install && pnpm --filter api build`. Start: `pnpm --filter api start`. Set the same variables as `.env`. The free tier sleeps after idle time, so the first request is slow.
- **Frontend:** Vercel, root directory `apps/web`, with `NEXT_PUBLIC_API_URL` set to the Render URL. Add the Vercel URL to `FRONTEND_URL` on the API.

## My AI Usage

> I wrote this section myself. Fill in the brackets with what actually happened.

**Tools used**

- Claude (chat and Claude Code) for planning, tests, refactoring and the frontend port.
- [Any other tools, e.g. Copilot, Cursor, Gemini. Name them and say where they were used. If none, delete this line.]

**How I used them**

- **Planning:** I asked Claude for a one-hour plan split into branches (`feature/auth`, `feature/vehicles`, `feature/inventory`, `feature/frontend`, `docs`) and a red/green/refactor commit pattern.
- **Tests first:** Claude drafted the Vitest/Supertest cases for auth, vehicles and inventory, and the Prisma/Vitest setup. I read through them and [describe what you changed or removed].
- **Implementation:** [Say who wrote what. For example: I wrote the first version of the auth and vehicle routes with ___, then asked Claude to review them.]
- **Review and refactor:** Claude pointed out that purchase did a read-then-write and could oversell under concurrent requests. It rewrote it as a single conditional update, and I kept the concurrency test it suggested. It also moved logic out of the routes into services and added input validation for search and restock.
- **Frontend:** [Say what you built yourself and what Claude produced. For example: the first dashboard and card components were mine, and Claude ported them to the Next.js app router and added restock and the edit page.]
- **Docs:** Claude drafted this README and I edited it.

**Where the AI got it wrong, or I had to step in**

- Claude's first scaffold used SQLite. That doesn't work for the deployment, because the file is wiped on every redeploy on Render's free tier, so I switched to Supabase Postgres and the scaffold was changed.
- Some commands and versions it gave me needed fixing on my machine (for example a Vitest startup error and the Windows file extraction path).
- I accidentally pasted my real `.env` into a chat. I rotated the database password and the JWT secret afterwards. [Keep this only if you want to; it is true.]
- [Add anything else.]

**Reflection**

[Write 3 to 5 sentences in your own words. Ideas: what got faster (boilerplate, test cases), what you had to check by hand (version numbers, config, security), what you would do differently next time, and how you decided what to accept.]

## Project structure

```
apps/
  api/   Express API: src/routes, src/services, src/middleware, prisma/, tests/
  web/   Next.js app: src/app, src/components, src/lib, src/context
PROMPTS.md
```
