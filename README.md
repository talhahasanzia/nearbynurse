# NearbyNurse — Full Stack Application

Full-stack application with React (Vite) frontend + NestJS backend + PostgreSQL + Supabase Auth. Everything runs in Docker for easy local development.

**Status**: ✅ Fully operational with JWT authentication using HS256

---

## Quick Summary

- **Frontend**: React + Vite + TypeScript + Supabase Auth
- **Backend**: NestJS + TypeScript + JWT verification
- **Database**: PostgreSQL 16 (containerized)
- **Authentication**: Supabase Auth with JWT tokens (HS256)
- **Deployment**: Docker Compose orchestration

### Ports
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- PostgreSQL: localhost:5432

### Requirements
- Docker Desktop (must be running)
- Docker Compose (bundled with Docker Desktop)
- Node.js >= 20.19 or >= 22.12 (optional, for local development without Docker)

---

## Quick Start

### 1. Create Root Environment File

Create `.env` in the project root (required for Docker builds):

```bash
# Root .env file for Docker Compose build args
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 2. Configure Backend Environment

Create or update `backend/.env`:

```bash
# Database connection
DATABASE_URL=postgresql://postgres:password@db:5432/mydb

# Supabase JWT Secret (IMPORTANT: Not JWKS URL)
# Get this from: Supabase Dashboard → Settings → API → JWT Settings → JWT Secret
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase-dashboard

# Supabase Anon Key (for API calls to Supabase)
SUPABASE_ANON_KEY=your-supabase-anon-key

# Server configuration
PORT=3000
NODE_ENV=development
```

### 3. Get Your Supabase Credentials

**Required values from Supabase Dashboard:**

1. Go to https://app.supabase.com/project/YOUR_PROJECT_ID/settings/api
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long JWT token starting with `eyJhbG...`
   - **JWT Secret**: From JWT Settings section (click eye icon to reveal)

### 4. Update Environment Files

**Root `.env`** (for Docker frontend builds):
```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**`backend/.env`** (for backend JWT verification):
```env
DATABASE_URL=postgresql://postgres:password@db:5432/mydb
SUPABASE_JWT_SECRET=your-super-secret-jwt-token-here
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3000
```

### 5. Start the Application

```bash
# Build and start all services
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
- **Test endpoint**: http://localhost:3000/ (should return "Hello World!")

---

## Important: JWT Configuration

### ⚠️ Critical Note About JWT Verification

This application uses **HS256 (HMAC with SHA-256)** for JWT verification, NOT RS256 with JWKS.

**Why?** Supabase signs JWT tokens with HS256, which requires a **JWT Secret** (shared secret), not public/private key pairs (JWKS).

### Configuration Required:

```env
# ✅ CORRECT - Use JWT Secret
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase

# ❌ WRONG - JWKS URL doesn't work with Supabase
SUPABASE_JWKS_URL=https://project.supabase.co/auth/v1/keys
```

### How It Works:

1. User signs in → Supabase creates JWT signed with HS256
2. Frontend receives JWT token
3. Frontend sends JWT to backend in `Authorization: Bearer <token>` header
4. Backend verifies JWT using `jwt.verify(token, SECRET, { algorithms: ['HS256'] })`
5. If valid → Request proceeds; If invalid → 401 Unauthorized

---

## Authentication Flow

### Sign Up New User

1. Open http://localhost:5173
2. Click "Need an account? Sign Up"
3. Enter email and password (min 6 characters)
4. Click "Sign Up"
5. Check your email for confirmation link
6. Click confirmation link in email

### Sign In

1. Open http://localhost:5173
2. Enter your email and password
3. Click "Sign In"
4. You should see welcome message with your email

### Test Protected Endpoint

After signing in:
1. Click "Test Protected Endpoint (/me)" button
2. Should display your user data in JSON format
3. This proves JWT authentication is working correctly

---

## Docker Commands

### Rebuild Everything

```bash
# Stop all containers and remove volumes (clears database)
docker-compose down -v

# Rebuild all images without cache
docker-compose build --no-cache

# Start all services
docker-compose up -d
```

### Rebuild Specific Service

```bash
# Rebuild frontend only
docker-compose up -d --build frontend

# Rebuild backend only
docker-compose up -d --build backend
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f db

# Last 50 lines
docker-compose logs --tail 50 frontend
```

### Container Management

```bash
# Check running containers
docker ps

# Check compose services status
docker-compose ps

# Restart a service
docker-compose restart backend

# Stop all services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v
```

---

## API Endpoints

### Public Endpoints

- `GET /` - Health check, returns "Hello World!"

### Protected Endpoints (Require JWT)

- `GET /me` - Returns authenticated user information

**Example:**
```bash
# Without token (returns 401)
curl http://localhost:3000/me

# With token (returns user data)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:3000/me
```

---

## Troubleshooting

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

## Troubleshooting

### Frontend Shows "Loading..." Forever

**Cause**: Browser caching old JavaScript bundle after code changes.

**Solution**:
```bash
# 1. Rebuild frontend
docker-compose up -d --build frontend

# 2. Hard refresh browser
# Mac: Cmd + Shift + R
# Windows/Linux: Ctrl + Shift + R

# 3. Or open in incognito/private window
```

### Backend Returns 500 Error on /me Endpoint

**Cause**: Missing or incorrect `SUPABASE_JWT_SECRET` in `backend/.env`.

**Solution**:
1. Go to Supabase Dashboard → Settings → API → JWT Settings
2. Copy the **JWT Secret** (click eye icon to reveal)
3. Update `backend/.env`:
   ```env
   SUPABASE_JWT_SECRET=your-actual-jwt-secret-here
   ```
4. Rebuild backend:
   ```bash
   docker-compose up -d --build backend
   ```

### Supabase Warning in Browser Console

**Warning Message**:
```
⚠️  Supabase not configured properly!
URL=https://placeholder.supabase.co
```

**Cause**: Using placeholder values instead of real Supabase credentials.

**Solution**:
1. Update root `.env` file with real credentials
2. Rebuild frontend:
   ```bash
   docker-compose up -d --build frontend
   ```
3. Hard refresh browser

### Cannot Sign In After Signing Up

**Cause**: Email not confirmed yet.

**Solution**:
1. Check your email for Supabase confirmation link
2. Click the confirmation link
3. Return to http://localhost:5173 and sign in
4. Or manually confirm in Supabase Dashboard → Authentication → Users

### Database Connection Error

**Error**: `ECONNREFUSED localhost:5432`

**Solution**:
```bash
# Check if database is running
docker-compose ps

# If not running, start it
docker-compose up -d db

# Check database logs
docker-compose logs db
```

### Port Already in Use

**Error**: `Bind for 0.0.0.0:5173 failed: port is already allocated`

**Solution**:
```bash
# Find process using the port
lsof -ti:5173

# Kill the process
kill -9 $(lsof -ti:5173)

# Or change port in docker-compose.yml
```

### Clear Database and Start Fresh

```bash
# Stop all containers and remove volumes
docker-compose down -v

# Rebuild and start
docker-compose up -d --build

# Note: This deletes all user accounts and data
```

---

## Project Structure

```
nearbynurse/
├── .env                          # Root env for Docker build args
├── docker-compose.yml            # Orchestration config
├── README.md                     # This file
│
├── frontend/                     # React + Vite application
│   ├── Dockerfile               # Frontend container config
│   ├── src/
│   │   ├── App.tsx              # Main app component
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx  # Authentication context
│   │   └── lib/
│   │       ├── supabase.ts      # Supabase client config
│   │       └── api.ts           # API client
│   └── .env                     # Frontend env (for local dev)
│
└── backend/                      # NestJS API
    ├── Dockerfile               # Backend container config
    ├── src/
    │   ├── main.ts              # App entry point
    │   ├── app.module.ts        # Root module
    │   ├── app.controller.ts    # API endpoints
    │   └── auth/
    │       └── supabase-auth.guard.ts  # JWT verification
    └── .env                     # Backend env (required)
```

---

## Environment Variables Reference

### Root `.env` (Required for Docker)
```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

### `backend/.env` (Required)
```env
DATABASE_URL=postgresql://postgres:password@db:5432/mydb
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_ANON_KEY=eyJhbG...
PORT=3000
NODE_ENV=development
```

### `frontend/.env` (Optional, for local dev without Docker)
```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

---

## Security Notes

### JWT Secret Security

✅ **Safe Practices:**
- JWT Secret only in `backend/.env` (never in frontend)
- `.env` files in `.gitignore` (not committed to git)
- Use HTTPS in production
- Rotate secrets periodically

❌ **Never Do:**
- Expose JWT Secret in frontend code
- Commit secrets to git
- Log secrets in console
- Send secrets in API responses

### Supabase Keys

- **anon key**: ✅ Safe to use in frontend (public key with limited permissions)
- **service_role key**: ❌ Never use in frontend (full access, backend only)

---

## Production Deployment

### Environment Variables

Update production environment files with:
- Real database connection strings
- Production Supabase credentials
- Secure JWT secrets (generate new ones)
- HTTPS URLs for API and Supabase

### Build for Production

```bash
# Build optimized images
docker-compose -f docker-compose.prod.yml build

# Use production environment files
# Never commit production .env files to git
```

### Security Checklist

- [ ] Use HTTPS for all connections
- [ ] Set secure JWT secret (min 32 characters)
- [ ] Enable Supabase Row Level Security (RLS)
- [ ] Configure CORS properly in backend
- [ ] Use environment-specific .env files
- [ ] Enable rate limiting on API
- [ ] Set up monitoring and logging
- [ ] Regular security updates for dependencies

---

## Development Workflow

### Making Changes

1. **Frontend changes**: Hot reload works automatically (Vite HMR)
2. **Backend changes**: Restart backend container
   ```bash
   docker-compose restart backend
   ```
3. **Database schema changes**: Use migrations or rebuild with `-v` flag

### Adding New API Endpoints

1. Add route in `backend/src/app.controller.ts`
2. Add `@UseGuards(SupabaseAuthGuard)` for protected routes
3. Restart backend: `docker-compose restart backend`
4. Test with curl or frontend

### Testing Authentication

```bash
# Sign up via UI and get JWT token from browser DevTools
# Copy the token from Application → Local Storage

# Test protected endpoint
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/me
```

---

## Common Commands Quick Reference

```bash
# Start everything
docker-compose up -d

# Rebuild and start
docker-compose up -d --build

# Stop everything
docker-compose down

# Stop and clear database
docker-compose down -v

# View logs
docker-compose logs -f [service]

# Restart service
docker-compose restart [service]

# Rebuild single service
docker-compose up -d --build [service]

# Execute command in container
docker-compose exec [service] sh
```

---

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **NestJS Docs**: https://docs.nestjs.com
- **Vite Docs**: https://vitejs.dev
- **Docker Docs**: https://docs.docker.com

---

## License

[Your License Here]

---

**Current Status**: ✅ Fully operational with working authentication system using Supabase JWT (HS256) and protected API endpoints.

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
