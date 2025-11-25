# Keycloak Authentication Setup Guide

This guide walks you through setting up Keycloak authentication for local development and testing.

---

## 🚀 Quick Start

### 1. Start All Services

```bash
docker-compose up -d
```

This starts:
- **Keycloak** on http://localhost:8080
- **Backend API** on http://localhost:3000
- **Frontend** on http://localhost:5173
- **PostgreSQL** (app database) on localhost:5432
- **Keycloak DB** (internal, not exposed)

### 2. Wait for Keycloak to Start

Keycloak takes 30-60 seconds to initialize. Check logs:

```bash
docker-compose logs -f keycloak
```

Wait for: `Keycloak ... started in ...ms`

---

## 🔐 Keycloak Admin Console Setup

### Access Admin Console

1. Open: http://localhost:8080
2. Click **Administration Console**
3. Login:
   - **Username**: `admin`
   - **Password**: `admin`

### Create a Realm (or use Master)

**Option A: Use Master Realm (Quick Start)**
- Skip this step, use `master` realm
- Set `KEYCLOAK_ISSUER=http://localhost:8080/realms/master` in `backend/.env`

**Option B: Create Custom Realm (Recommended)**

1. Hover over **Master** (top left) → Click **Create Realm**
2. **Realm name**: `nearbynurse` (or your choice)
3. Click **Create**
4. Set `KEYCLOAK_ISSUER=http://localhost:8080/realms/nearbynurse` in `backend/.env`

---

## 🔧 Create a Client for Backend (and Frontend SPA)

You will typically create TWO clients:
1. Frontend SPA public client (uses Authorization Code Flow + PKCE)
2. (Optional) Backend bearer-only or direct-grant client (only if you want password grant or service-to-service calls)

### A) Frontend Client (recommended)
- **Client ID**: `nearbynurse-frontend`
- **Client type**: OpenID Connect
- **Root URL**: `http://localhost:5173` (base URL of the SPA)
- **Home URL**: `http://localhost:5173/` (where users land after login/logout)
  - If Keycloak shows separate fields for these, use the same base.
- Click **Next**

**Capability config**:
- ✅ Standard flow (Authorization Code Flow)
- ✅ Proof Key for Code Exchange (PKCE) auto-enabled
- ❌ Direct access grants (OFF for pure SPA; only enable if you explicitly use password grant)
- ❌ Client authentication (OFF – public client)
- Click **Next**

**Login settings**:
- **Valid redirect URIs**: `http://localhost:5173/*`
- **Valid post logout redirect URIs**: `http://localhost:5173/*`
- **Web origins**: `http://localhost:5173`
- Save

Update frontend `.env`:
```
VITE_KEYCLOAK_CLIENT_ID=nearbynurse-frontend
```

### B) Backend Client (optional – only if using password grant or service calls)
If you want to test with `curl` using password grant, create a second client:
- **Client ID**: `nearbynurse-backend`
- **Client type**: OpenID Connect
- **Root URL**: (leave blank OR `http://localhost:3000` if you plan redirect flows)
- **Home URL**: leave blank
- Click **Next**

**Capability config**:
- ✅ Direct access grants (ON – enables password grant for curl testing)
- ❌ Standard flow (OFF if you are not doing browser redirects for backend client)
- ✅ Client authentication (ON if you want a secret; OFF if public password grant is acceptable)
- ❌ Authorization (OFF unless using Keycloak authorization services)
- Click **Next**

**Login settings** (only needed if you enabled Standard flow):
- **Valid redirect URIs**: `http://localhost:3000/*` (omit if standard flow OFF)
- **Web origins**: `http://localhost:3000` (omit if standard flow OFF)
- Save

If you keep using the curl examples with password grant:
- Ensure `nearbynurse-backend` has Direct access grants enabled.
- Use `client_id=nearbynurse-backend` in the token request (as shown below).

> NOTE: For most frontend → backend JWT validation cases, you ONLY need the frontend client. The backend just validates tokens; no separate Keycloak client required unless you need password grant or service account flows.

---

## 👤 Create a Test User

1. Go to **Users** → **Add user**
2. Configure:
   - **Username**: `testuser`
   - **Email**: `test@example.com`
   - **First name**: Test
   - **Last name**: User
   - ✅ **Email verified**: ON
   - Click **Create**
3. Set password:
   - Go to **Credentials** tab
   - Click **Set password**
   - **Password**: `password123`
   - **Temporary**: OFF
   - Click **Save**

---

## 🎭 Create Roles (Optional)

### Create Realm Roles

1. Go to **Realm roles** → **Create role**
2. Create roles:
   - **Role name**: `admin`
   - **Description**: Admin role
   - Click **Save**
3. Repeat for other roles: `user`, `nurse`, etc.

### Assign Roles to User

1. Go to **Users** → Select your test user
2. Go to **Role mapping** tab
3. Click **Assign role**
4. Select roles (e.g., `admin`, `user`)
5. Click **Assign**

---

## 🧪 Testing Authentication

### Get an Access Token (Password Grant - Optional Backend Client)

If you created the optional backend client with direct access grants:
```bash
curl -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser" \
  -d "password=password123" \
  -d "grant_type=password" \
  -d "client_id=nearbynurse-backend"
```
If you only have the frontend client and want interactive login, use the browser flow (no password grant curl).

**Response** (example):
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI...",
  "expires_in": 300,
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "token_type": "Bearer"
}
```

### Test Protected Endpoints

**Without Token (should fail with 401):**
```bash
curl -v http://localhost:3000/me
```

**With Valid Token (should succeed):**
```bash
TOKEN="<paste-access-token-here>"
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/me
```

**Expected Response:**
```json
{
  "user": {
    "exp": 1234567890,
    "iat": 1234567890,
    "jti": "...",
    "iss": "http://localhost:8080/realms/master",
    "sub": "...",
    "typ": "Bearer",
    "azp": "nearbynurse-backend",
    "preferred_username": "testuser",
    "email": "test@example.com",
    "realm_access": {
      "roles": ["admin", "user"]
    }
  }
}
```

### Test Role-Protected Endpoints

**Protected Endpoint (any authenticated user):**
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/demo/protected
```

**Admin-Only Endpoint (requires 'admin' role):**
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/demo/admin-only
```

If user doesn't have `admin` role, you'll get `403 Forbidden`.

---

## 📝 Backend Environment Variables

Ensure `backend/.env` contains:

```env
DATABASE_URL=postgresql://postgres:password@db:5432/mydb
PORT=3000
NODE_ENV=development

# Keycloak issuer (adjust realm name if needed)
KEYCLOAK_ISSUER=http://localhost:8080/realms/master
```

---

## 🐛 Troubleshooting

### Keycloak Not Starting

**Check logs:**
```bash
docker-compose logs keycloak
```

**Common issues:**
- Port 8080 already in use → Change port in docker-compose.yml
- Database not ready → Wait for keycloak-db healthcheck to pass

### Token Validation Fails

**Symptoms:** `401 Unauthorized` even with valid token

**Solutions:**
1. Verify `KEYCLOAK_ISSUER` matches your realm:
   ```bash
   echo $KEYCLOAK_ISSUER
   # Should be: http://localhost:8080/realms/master (or your realm name)
   ```

2. Check token issuer (`iss` claim):
   ```bash
   # Decode JWT at https://jwt.io
   # Ensure "iss" matches KEYCLOAK_ISSUER exactly
   ```

3. Verify backend can reach Keycloak:
   ```bash
   docker-compose exec backend curl -v http://keycloak:8080/realms/master/.well-known/openid-configuration
   ```

### Role Check Fails

**Issue:** User has role in Keycloak but `403 Forbidden` on role-protected endpoint

**Solution:**
- Ensure role is in `realm_access.roles` (not `resource_access`)
- Check token payload:
  ```bash
  # In token, look for:
  "realm_access": {
    "roles": ["admin", "user"]
  }
  ```

### JWKS Fetch Fails

**Error:** `Unable to fetch JWKS`

**Solution:**
- Verify JWKS URI is reachable:
  ```bash
  curl http://localhost:8080/realms/master/protocol/openid-connect/certs
  ```
- Check network between backend and Keycloak containers
- Restart backend: `docker-compose restart backend`

---

## 🔄 Reset Everything

```bash
# Stop and remove all containers and volumes
docker-compose down -v

# Rebuild and start fresh
docker-compose up -d --build
```

---

## 📚 Useful Keycloak Endpoints

- **OpenID Configuration**: http://localhost:8080/realms/master/.well-known/openid-configuration
- **JWKS (Public Keys)**: http://localhost:8080/realms/master/protocol/openid-connect/certs
- **Token Endpoint**: http://localhost:8080/realms/master/protocol/openid-connect/token
- **Admin Console**: http://localhost:8080/admin

---

## 🎯 Next Steps

1. **Frontend Integration**: Set up Keycloak JS client in React (see KEYCLOAK-FRONTEND.md)
2. **Production Setup**: Use proper realm, enable HTTPS, configure token expiration
3. **Custom Claims**: Add custom attributes to tokens (user metadata, permissions)
4. **Social Login**: Configure Google/GitHub/Facebook login in Keycloak
5. **User Registration**: Enable self-registration in Keycloak realm settings

---

## 🔐 Security Notes

- Default credentials (`admin:admin`) are for **development only**
- In production:
  - Use strong passwords
  - Enable HTTPS
  - Configure proper CORS and redirect URIs
  - Set token expiration appropriately (5-15 minutes for access tokens)
  - Use refresh tokens with secure HttpOnly cookies

---

**Happy Authenticating! 🎉**
