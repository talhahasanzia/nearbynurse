# Public IP Configuration Summary

## Updated Files

Your application has been configured to use your public IP address: **54.254.253.205**

### 1. Nginx Configuration (`nginx/nginx.conf`)
- Added `54.254.253.205` to `server_name`
- Configured to proxy:
  - `/` → Frontend (React)
  - `/api/` → Backend (NestJS)
  - `/auth/` → Keycloak

### 2. Docker Compose (`docker-compose.yml`)
- Updated Keycloak hostname: `KC_HOSTNAME: 54.254.253.205`
- Added Keycloak environment variables to frontend build args

### 3. Backend Configuration (`backend/.env`)
- Updated `KEYCLOAK_ISSUER=http://54.254.253.205/auth/realms/master`
- Keeps internal Docker URL for backend-to-Keycloak communication

### 4. Frontend Configuration (`frontend/.env`)
- Created with:
  - `VITE_KEYCLOAK_URL=http://54.254.253.205/auth`
  - `VITE_KEYCLOAK_REALM=master`
  - `VITE_KEYCLOAK_CLIENT_ID=nearbynurse-frontend`

### 5. Root .env file (`.env`)
- Created for docker-compose build-time variables

## Deployment Steps

### 1. Stop existing containers (if running)
```bash
docker-compose down
```

### 2. Rebuild containers with new configuration
```bash
docker-compose build --no-cache
```

### 3. Start the services
```bash
docker-compose up -d
```

### 4. Check service status
```bash
docker-compose ps
docker-compose logs -f
```

### 5. Configure Keycloak Client
After starting, access Keycloak admin console at:
- URL: `http://54.254.253.205/auth/admin`
- Username: `admin`
- Password: `admin`

**Important**: Update the client redirect URIs:
1. Go to Clients → `nearbynurse-frontend`
2. Update Valid Redirect URIs to include:
   - `http://54.254.253.205/*`
3. Update Web Origins to include:
   - `http://54.254.253.205`
4. Save changes

## Access Points

- **Frontend**: http://54.254.253.205
- **Backend API**: http://54.254.253.205/api
- **Keycloak**: http://54.254.253.205/auth
- **Keycloak Admin**: http://54.254.253.205/auth/admin

## Security Considerations

⚠️ **Important**: This configuration uses HTTP (not HTTPS). For production:

1. **Add SSL/TLS**:
   - Obtain SSL certificate (Let's Encrypt recommended)
   - Update nginx to listen on port 443
   - Redirect HTTP to HTTPS
   - Update all URLs to use `https://`

2. **Update Keycloak**:
   - Set `KC_HOSTNAME_STRICT: "true"`
   - Set `KC_HOSTNAME_STRICT_HTTPS: "true"`
   - Configure SSL certificates

3. **Firewall Rules**:
   - Ensure ports 80 and 443 are open
   - Close direct access to ports 3000, 5173, 8080

4. **Environment Variables**:
   - Change default passwords
   - Use strong Keycloak admin credentials
   - Consider using secrets management

## Troubleshooting

### If Keycloak authentication fails:
1. Check browser console for errors
2. Verify JWT token issuer matches: `http://54.254.253.205/auth/realms/master`
3. Check Keycloak client configuration (redirect URIs)

### If services don't start:
```bash
# Check logs for specific service
docker-compose logs keycloak
docker-compose logs backend
docker-compose logs frontend

# Restart specific service
docker-compose restart [service-name]
```

### To completely reset:
```bash
docker-compose down -v  # Removes volumes (database data will be lost!)
docker-compose up --build -d
```

