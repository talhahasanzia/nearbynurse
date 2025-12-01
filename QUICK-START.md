# Quick Start with Nginx Reverse Proxy

## ✅ Setup Complete!

Your project now has Nginx configured as a reverse proxy running in a Docker container.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Browser (localhost:80)                             │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│  Nginx Container (port 80) - ONLY PUBLIC PORT       │
│  ├─ /           → Frontend (React)                  │
│  ├─ /api/*      → Backend (NestJS)                  │
│  └─ /auth/*     → Keycloak                          │
└─────────────────────────────────────────────────────┘
                    ↓
┌──────────────┬──────────────┬──────────────┐
│  Frontend    │   Backend    │  Keycloak    │
│  Container   │   Container  │  Container   │
│  (port 5173) │  (port 3000) │  (port 8080) │
│  Internal    │  Internal    │  Internal    │
└──────────────┴──────────────┴──────────────┘
```

## What Changed?

### Files Created:
1. **`nginx/nginx.conf`** - Nginx configuration for routing
2. **`frontend/.env`** - Frontend environment variables
3. **`NGINX-SETUP.md`** - Detailed documentation

### Files Modified:
1. **`docker-compose.yml`** - Added Nginx service, changed port exposure

## Start Your Application

```bash
# Start all services (first time - will build images)
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

## Access Your Services

Once running, access via:
- **Frontend**: http://localhost
- **Backend API**: http://localhost/api
- **Keycloak**: http://localhost/auth
- **Keycloak Admin**: http://localhost/auth/admin
  - Username: `admin`
  - Password: `admin`

## Important: Configure Keycloak Client

After Keycloak starts, update your client settings:

1. Go to: http://localhost/auth/admin
2. Login with admin/admin
3. Navigate to: **Clients** → **nearbynurse-frontend**
4. Update these settings:
   ```
   Root URL: http://localhost
   Valid Redirect URIs: http://localhost/*
   Web Origins: http://localhost
   ```
5. Click **Save**

## View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f nginx
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Stop Services

```bash
# Stop and remove containers
docker-compose down

# Stop, remove containers, and volumes (clean slate)
docker-compose down -v
```

## Troubleshooting

### Port 80 in use?
If port 80 is already taken, edit `docker-compose.yml`:
```yaml
nginx:
  ports:
    - "8000:80"  # Change to any free port
```
Then access via http://localhost:8000

### Check Nginx is routing correctly
```bash
# Test frontend
curl http://localhost/

# Test backend
curl http://localhost/api/

# Test Keycloak
curl http://localhost/auth/
```

### Rebuild after code changes
```bash
docker-compose up --build
```

## Next Steps

1. Start the services: `docker-compose up --build`
2. Wait for all health checks to pass (~1-2 minutes)
3. Configure Keycloak client (see above)
4. Access your app at http://localhost

## Benefits of This Setup

✅ **Production-like** - Same setup you'd use in production  
✅ **No CORS issues** - All services from same origin  
✅ **Single port** - Only port 80 exposed  
✅ **Containerized** - No local Nginx installation needed  
✅ **Easy SSL** - Can add HTTPS later with minimal changes  

For more details, see `NGINX-SETUP.md`

