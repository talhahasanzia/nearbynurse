# NearbyNurse — Full Stack Application

Full-stack application with React (Vite) frontend + NestJS backend + PostgreSQL + Keycloak authentication. Everything runs in Docker for easy local development.

**Status**: ✅ Fully operational with Keycloak authentication

---

## Quick Summary

- **Frontend**: React + Vite + TypeScript + Mock Auth System (UI only)
- **Backend**: NestJS + TypeScript + Keycloak JWT Authentication
- **Database**: PostgreSQL 16 (containerized)
- **Authentication**: Keycloak (OpenID Connect / OAuth 2.0)
- **Deployment**: Docker Compose orchestration

### Ports
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Keycloak: http://localhost:8080
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
```

### 2. Configure Backend Environment

Create or update `backend/.env`:

```bash
# Database connection
DATABASE_URL=postgresql://postgres:password@db:5432/mydb

# Server configuration
PORT=3000
NODE_ENV=development

# Keycloak authentication
KEYCLOAK_ISSUER=http://localhost:8080/realms/master
```

### 3. Start the Application

```bash
# Build and start all services (includes Keycloak)
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

**⏱️ Note:** Keycloak takes 30-60 seconds to start. Wait for it to be fully ready before testing.

### 4. Setup Keycloak

See **[KEYCLOAK-SETUP.md](./KEYCLOAK-SETUP.md)** for complete setup instructions including:
- Accessing admin console (admin:admin)
- Creating users
- Configuring clients
- Getting access tokens
- Testing authentication

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Keycloak Admin**: http://localhost:8080
- **Test endpoint**: http://localhost:3000/ (should return "Hello World!")

---

## Keycloak Authentication

### Backend Protection

The backend uses Keycloak JWT authentication via Passport.js:

- **Strategy**: `KeycloakJwtStrategy` validates JWT tokens against Keycloak's JWKS endpoint
- **Guard**: `KeycloakAuthGuard` protects endpoints
- **Roles**: `RolesGuard` enforces role-based access control

### Protected Endpoints

**Authentication Required:**
- `GET /me` - Returns authenticated user info
- `GET /demo/protected` - Any authenticated user

**Role-Based:**
- `GET /demo/admin-only` - Requires `admin` role

### Testing with cURL

```bash
# Get token from Keycloak
TOKEN=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser" \
  -d "password=password123" \
  -d "grant_type=password" \
  -d "client_id=nearbynurse-backend" \
  | jq -r '.access_token')

# Test protected endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/me
```

### Frontend Integration

The frontend still uses mock authentication for UI development. To integrate real Keycloak authentication in React, see:
- [Keycloak JS Documentation](https://www.keycloak.org/docs/latest/securing_apps/#_javascript_adapter)
- Configure Keycloak client in admin console with redirect URIs

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
- `GET /me` - Mock authenticated endpoint (no authentication required)

**Example:**
```bash
# Health check
curl http://localhost:3000/

# Mock authenticated endpoint (always returns success)
curl http://localhost:3000/me
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

### Mock Authentication Not Working

**Issue**: Authentication pages show errors or don't respond.

**Solution**:
1. Check browser console for JavaScript errors
2. Verify localStorage is enabled in your browser
3. Try clearing localStorage: `localStorage.clear()` in DevTools console
4. Hard refresh the page (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows/Linux)

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
│   │       ├── api.ts           # API client
│   └── .env                     # Frontend env (for local dev)
│
└── backend/                      # NestJS API
    ├── Dockerfile               # Backend container config
    ├── src/
    │   ├── main.ts              # App entry point
    │   ├── app.module.ts        # Root module
    │   └── app.controller.ts    # API endpoints
    └── .env                     # Backend env (required)
```

---

## Environment Variables Reference

### Root `.env` (Required for Docker)
```env
VITE_API_URL=http://localhost:3000
```

### `backend/.env` (Required)
```env
DATABASE_URL=postgresql://postgres:password@db:5432/mydb
PORT=3000
NODE_ENV=development
```

### `frontend/.env` (Optional, for local dev without Docker)
```env
VITE_API_URL=http://localhost:3000
```



---

## Production Deployment

### Environment Variables

Update production environment files with:
- Real database connection strings
- HTTPS URLs for API
- Production-ready configurations

### Build for Production

```bash
# Build optimized images
docker-compose -f docker-compose.prod.yml build

# Use production environment files
# Never commit production .env files to git
```

### Security Checklist

- [ ] Use HTTPS for all connections
- [ ] Configure CORS properly in backend
- [ ] Use environment-specific .env files
- [ ] Enable rate limiting on API
- [ ] Set up monitoring and logging
- [ ] Regular security updates for dependencies
- [ ] Implement proper authentication system for production

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
2. Restart backend: `docker-compose restart backend`
3. Test with curl or frontend

### Testing Mock Authentication

```bash
# Test public endpoints
curl http://localhost:3000/
curl http://localhost:3000/me

# Test frontend mock authentication
# Open http://localhost:5173 and try signing up/in
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

- **NestJS Docs**: https://docs.nestjs.com
- **Vite Docs**: https://vitejs.dev
- **Docker Docs**: https://docs.docker.com

---

## License

[Your License Here]

---

**Current Status**: ✅ Fully operational with mock authentication system for UI development.

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
