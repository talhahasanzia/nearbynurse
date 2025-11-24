# NearbyNurse — Monorepo

Full‑stack starter: React (Vite) frontend + NestJS backend + PostgreSQL + Supabase Auth. This README merges setup, quick reference, and getting-started guidance into one simple reference focused on running the project locally with Docker.

Status: Docker-based local development supported. Docker Desktop must be running locally to use the instructions below.

---

## Quick summary

- Frontend: React + Vite (TypeScript)
- Backend: NestJS (TypeScript)
- Database: PostgreSQL (container)
- Auth: Supabase Auth (JWT)
- Dev with Docker: `docker-compose` brings up `db`, `backend`, and `frontend` services

Ports (defaults)
- Frontend: http://localhost:5173
- Backend:  http://localhost:3000
- Postgres: localhost:5432

Requirements
- Docker Desktop (running)
- Docker Compose (bundled with Docker Desktop)
- (Optional for local non-Docker dev) Node.js >= 20.19 or >= 22.12

---

## Quick start — Run everything with Docker (recommended)

1. Copy env template files and fill values (Supabase info required for auth):

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
# Edit both files and add your Supabase project URL and ANON key, and confirm DATABASE_URL in backend/.env
```

Important env vars (examples)

- `frontend/.env` (client must use VITE_ prefix):
```
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

- `backend/.env`:
```
DATABASE_URL=postgresql://postgres:password@db:5432/mydb
SUPABASE_JWKS_URL=https://<project>.supabase.co/auth/v1/keys
PORT=3000
NODE_ENV=development
```

2. Build and start the stack (from repo root):

```bash
# Build images and start containers in the foreground
docker-compose up --build

# OR start in background
docker-compose up --build -d
```

3. Verify services are running

```bash
# list running containers
docker ps

# check compose status
docker-compose ps
```

4. Open the apps
- Frontend: http://localhost:5173
- Backend:  http://localhost:3000

Notes: If the frontend shows a blank screen or Vite fails to start, see the Troubleshooting section below.

---

## Rebuild, logs, and debug commands

Rebuild frontend & backend without cache and restart:

```bash
docker-compose build --no-cache frontend backend
docker-compose up --build -d
```

Follow logs (all services or a single service):

```bash
docker-compose logs -f        # all
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f db
```

Health & reachability checks

```bash
# Frontend should serve index.html (Vite) or static files
curl -I http://localhost:5173/

# Backend basic check
curl -v http://localhost:3000/

# Protected endpoint (should 401 without token)
curl -v http://localhost:3000/me
```

Exec into containers for troubleshooting

```bash
docker-compose exec frontend sh    # or ash in Alpine images
docker-compose exec backend sh
```

---

## Troubleshooting — common issues

1) Vite / Node version error (example):

```
You are using Node.js 18.xx. Vite requires Node.js version 20.19+ or 22.12+.
```

Cause: Vite or one of its transitive dependencies requires a newer Node runtime than available inside the container image or on your host when running Vite locally.

Fixes:
- Preferred: Ensure the Dockerfile used to run the frontend uses Node >= 20.19 (or 22.12+). Rebuild images after changing the Dockerfile.
- Or run Vite locally on your machine with an appropriate Node version (use `nvm` to install):

```bash
nvm install 22 && nvm use 22
```

Verify inside the running container:

```bash
docker-compose exec frontend node --version
```

If you updated Dockerfiles, force rebuild:

```bash
docker-compose build --no-cache frontend
docker-compose up -d
```

2) Blank frontend screen (page is served but app UI is blank)

Checklist:
- Open browser DevTools Console for JS errors (syntax error, missing module, runtime exception).
- Network tab: check that main JS bundles are loading (200) and API calls succeed.
- Check `docker-compose logs frontend` — Vite should print a line with `Local: http://0.0.0.0:5173/` and `Network: ...` when binding correctly.
- If running Vite inside Docker, ensure Vite listens on all interfaces. Use `--host 0.0.0.0` or set `HOST=0.0.0.0`.
- Verify that `VITE_SUPABASE_ANON_KEY` and `VITE_SUPABASE_URL` are present in `frontend/.env`. Missing keys often cause auth-dependent apps to fail at startup.

Quick commands:

```bash
# show frontend logs
docker-compose logs -f frontend
# check index served by Vite
curl http://localhost:5173/index.html | sed -n '1,120p'
```

Recommended quick fix for blank screen when using Docker dev server:
- Add `--host 0.0.0.0` to the `dev` script in `frontend/package.json` so Vite binds to 0.0.0.0 (see "Recommended edits" section below).

---

## Can I access auth via the frontend UI?

Yes. The frontend uses Supabase client code. If you provide `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `frontend/.env` and the frontend is running, you can sign in from the UI and the app will obtain a Supabase session JWT. That JWT is then sent to protected backend endpoints via the `Authorization: Bearer <JWT>` header.

To test the auth flow quickly:
1. Start stack with Docker
2. Open http://localhost:5173 and sign in (or sign up) using the UI supplied in the app
3. Inspect network requests in DevTools to see the JWT and API calls to `VITE_API_URL`

---

## Recommended (small, optional) edits to make Docker dev smoother

These are optional changes you may apply to avoid common container binding problems.

1) Bind Vite to all interfaces
- Edit `frontend/package.json` script `dev` from:

```json
"dev": "vite"
```

to:

```json
"dev": "vite --host 0.0.0.0"
```

2) Ensure frontend Dockerfile uses a Node image with a compatible Node version (>= 20.19 or 22.12)
- Example base line in `frontend/Dockerfile`:

```
FROM node:20.19.0-alpine
```

Or use Node 22 if you prefer:

```
FROM node:22.12.0-alpine
```

After changing the Dockerfile, rebuild the frontend image:

```bash
docker-compose build --no-cache frontend
docker-compose up -d
```

These edits are small and safe. If you want, I can apply them for you (frontend `package.json` and `frontend/Dockerfile`) and rebuild images. Tell me if you'd like me to make those edits now.

---

## Local development (without Docker)

If you prefer to run services directly on your machine:

Backend

```bash
cd backend
npm install
npm run start:dev    # starts NestJS on port 3000
```

Frontend

```bash
cd frontend
npm install
npm run dev          # starts Vite on 5173
```

Note: Ensure your Node version locally meets Vite's engine requirement (>=20.19 or >=22.12).

---

## Quick reference / cheat sheet

Start everything with Docker (foreground):

```bash
docker-compose up --build
```

Start detached:

```bash
docker-compose up --build -d
```

Stop and remove containers:

```bash
docker-compose down
```

Rebuild frontend only:

```bash
docker-compose build --no-cache frontend
```

View frontend logs:

```bash
docker-compose logs -f frontend
```

Check that frontend serves index:

```bash
curl -I http://localhost:5173/
```

---

## Contributing & next steps

- Prefer small, focused PRs
- Add tests for new backend APIs and UI flows
- Consider adding a `docker-compose.override.yml` for a hot-reload dev workflow that mounts local code into the container

---

## License
MIT
