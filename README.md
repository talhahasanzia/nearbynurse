# NearbyNurse Monorepo

Full‑stack starter with React (Vite) + NestJS + PostgreSQL + Supabase Auth, packaged for local Docker dev and easy cloud deployment.

## Tech Stack
Frontend: React 18, Vite, TypeScript, Supabase JS
Backend: NestJS, TypeScript, Axios, JWT (Supabase JWKS)
Database: PostgreSQL
Tooling: Docker / Docker Compose, GitHub Actions (CI), Node.js ≥ 20.19 or ≥ 22.12

## Project Structure
```
nearbynurse/
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── contexts/AuthContext.tsx   # Auth state & hooks
│   │   └── lib/{supabase.ts, api.ts}  # Supabase client & API helper
│   ├── .env(.example)
│   └── Dockerfile
├── backend/           # NestJS API
│   ├── src/
│   │   ├── auth/supabase-auth.guard.ts  # JWT validation
│   │   ├── app.{controller,module,service}.ts
│   │   └── main.ts
│   ├── .env(.example)
│   └── Dockerfile
├── docker-compose.yml # Dev stack: db + backend + frontend
├── .github/workflows/{frontend.yml,backend.yml}
└── README.md          # You are here
```

## Prerequisites
- Node.js 20.19+ (or 22.12+) — required by Vite (use nvm if needed)
- Docker Desktop (optional but recommended)
- Supabase account & project (for auth)

Check versions:
```
node --version
docker --version
```

## Environment Variables
Create `.env` files from provided `.env.example` templates.

Frontend `frontend/.env`:
```
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```
(Frontend vars must start with VITE_ to be exposed.)

Backend `backend/.env`:
```
DATABASE_URL=postgresql://postgres:password@db:5432/mydb
SUPABASE_JWKS_URL=https://<project>.supabase.co/auth/v1/keys
PORT=3000
NODE_ENV=development
```

## Quick Start (All Services via Docker)
```
# From repo root
docker-compose up --build
```
Access:
- Frontend: http://localhost:5173
- Backend:  http://localhost:3000
- PostgreSQL: localhost:5432

Stop:
```
docker-compose down
```

## Local Development (Without docker-compose)
Terminal 1 – Database (optional if you already have Postgres):
```
docker run --name postgres-dev \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=mydb \
  -p 5432:5432 -d postgres:16
```
Terminal 2 – Backend:
```
cd backend
npm install
npm run start:dev   # http://localhost:3000
```
Terminal 3 – Frontend:
```
cd frontend
npm install
npm run dev         # http://localhost:5173
```

## Root Helper Scripts
```
npm run dev:frontend    # Frontend dev server
npm run dev:backend     # Backend dev server
npm run build:frontend  # Production build (frontend)
npm run build:backend   # Production build (backend)
npm run docker:up       # docker-compose up --build
npm run docker:down     # docker-compose down
npm run install:all     # Install all dependencies
```

## Frontend Scripts
```
npm run dev
npm run build
npm run preview
npm run lint
```
## Backend Scripts
```
npm run start            # Prod
npm run start:dev        # Dev watch
npm run start:debug
npm run build
npm run test             # Unit tests
npm run test:e2e         # E2E tests
```

## Authentication Flow (Supabase)
1. User signs in via Supabase (AuthContext handles session).
2. JWT retrieved from Supabase session.
3. Requests to protected API endpoints send `Authorization: Bearer <JWT>`.
4. Backend `SupabaseAuthGuard` fetches JWKS from Supabase and validates token.

Protected endpoint example:
```ts
@UseGuards(SupabaseAuthGuard)
@Get('me')
getProfile() { return { msg: 'Authenticated!' }; }
```

## Test the Setup
Backend health:
```
curl http://localhost:3000
# → "Hello World!"
```
Unauthorized check:
```
curl http://localhost:3000/me   # → 401 without token
```

## Troubleshooting
Node version error (Vite):
```
nvm install 22 && nvm use 22
```
Ports in use:
```
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```
Reset Docker stack:
```
docker-compose down -v
docker system prune -a
docker-compose up --build
```
Check Postgres running:
```
docker ps | grep postgres
```

## Common Issues
Unauthorized errors:
- Verify Supabase URL/key and JWKS URL in backend `.env`
- Ensure Authorization header sent by frontend
Database connection issues:
- Confirm container running; restart: `docker-compose restart db`

## Next Steps
1. Add ORM (Prisma / TypeORM) & migrations.
2. Implement additional API modules & React pages.
3. Add Swagger/OpenAPI for backend docs.
4. Extend test coverage (frontend + e2e scenarios).
5. Set up monitoring (Sentry) & performance analytics.

## Contributing
- Use feature branches (`feat/your-feature`)
- Write tests & update docs
- Conventional commits (feat:, fix:, docs:, chore:)
- Submit PRs after CI passes

## License
MIT

## Quick Reference (Cheat Sheet)
Start all (Docker): `docker-compose up --build`
Local dev: backend `npm run start:dev` | frontend `npm run dev`
Env template: use `.env.example` files, never commit secrets.
Key files: `frontend/src/contexts/AuthContext.tsx`, `frontend/src/lib/{api.ts,supabase.ts}`, `backend/src/auth/supabase-auth.guard.ts`.

You're ready to build 🚀

