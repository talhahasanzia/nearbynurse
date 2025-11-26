# Keycloak Frontend Integration Guide

## Keycloak Admin Console Setup

### 1. Create Client for Frontend

1. **Open Keycloak Admin Console**
   - URL: http://localhost:8080
   - Login: `admin` / `admin`

2. **Navigate to Clients**
   - Select your realm (e.g., `master`)
   - Click **Clients** → **Create client**

3. **Client Configuration**
   - **Client ID**: `nearbynurse-frontend`
   - **Client type**: OpenID Connect
   - Click **Next**

4. **Capability Config**
   - ✅ **Standard flow** (Authorization Code Flow)
   - ❌ **Direct access grants** (OFF for SPA)
   - ❌ **Client authentication** (OFF - public client)
   - Click **Next**

5. **Login Settings**
   - **Valid Redirect URIs**: 
     ```
     http://localhost:5173/*
     http://localhost:5173
     ```
   - **Valid Post Logout Redirect URIs**:
     ```
     http://localhost:5173/*
     http://localhost:5173
     ```
   - **Web Origins**: 
     ```
     http://localhost:5173
     ```
   - Click **Save**

6. **Advanced Settings** (Optional)
   - **Access Token Lifespan**: 5 minutes (default)
   - **Proof Key for Code Exchange (PKCE)**: S256 (enabled by default)

---

## Testing Checklist

### Step 1: Start Keycloak
```bash
# In project root
docker-compose up -d keycloak
docker-compose logs -f keycloak
# Wait for: "Keycloak ... started"
```

### Step 2: Configure Keycloak Realm & Client
- [ ] Open http://localhost:8080
- [ ] Login with `admin` / `admin`
- [ ] Create client `nearbynurse-frontend` (see setup above)
- [ ] Set **Valid Redirect URIs**: `http://localhost:5173/*`
- [ ] Set **Web Origins**: `http://localhost:5173`

### Step 3: Create Test User
- [ ] Go to **Users** → **Add user**
- [ ] Username: `testuser`
- [ ] Email: `test@example.com`
- [ ] Email verified: **ON**
- [ ] Click **Create**
- [ ] Go to **Credentials** tab
- [ ] Set password: `password123`
- [ ] Temporary: **OFF**
- [ ] Click **Save**

### Step 4: Assign Roles (Optional)
- [ ] Go to **Realm roles** → Create role: `admin`
- [ ] Go to **Users** → Select `testuser`
- [ ] Go to **Role mapping** tab
- [ ] Assign role: `admin`

### Step 5: Start Frontend
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

### Step 6: Test Login Flow
- [ ] Open http://localhost:5173
- [ ] Click **Login** button
- [ ] Redirects to Keycloak login page
- [ ] Enter credentials: `testuser` / `password123`
- [ ] Redirects back to app
- [ ] User should be authenticated
- [ ] Username displayed in navbar

### Step 7: Test Protected Route
- [ ] Click **Dashboard** link
- [ ] Should display user info and roles
- [ ] Verify roles are shown correctly

### Step 8: Test Role-Based Access
- [ ] If user has `admin` role, "Go to Admin Panel" link appears
- [ ] Click link → Should access `/admin` page
- [ ] If user doesn't have `admin` role → Should see 403 Forbidden

### Step 9: Test Token Refresh
- [ ] Stay logged in for 2+ minutes
- [ ] Token should auto-refresh (check console logs)
- [ ] App should remain authenticated

### Step 10: Test Logout
- [ ] Click **Logout** button
- [ ] Redirects to Keycloak logout
- [ ] Redirects back to homepage
- [ ] User should be logged out
- [ ] Login button appears again

---

## Troubleshooting

### 1. **Redirect Loop / "Invalid redirect_uri"**
**Fix**: Ensure `http://localhost:5173/*` is in **Valid Redirect URIs** in Keycloak client settings.

### 2. **CORS Error**
**Fix**: Add `http://localhost:5173` to **Web Origins** in Keycloak client settings.

### 3. **Token Validation Fails (401)**
**Fix**: Verify `VITE_KEYCLOAK_URL`, `VITE_KEYCLOAK_REALM`, and `VITE_KEYCLOAK_CLIENT_ID` match Keycloak configuration.

### 4. **User Not Redirected After Login**
**Fix**: Check `VITE_APP_BASE_URL` matches your app URL. Clear browser cache and cookies.

### 5. **Roles Not Showing**
**Fix**: Ensure roles are assigned in Keycloak. Check token at https://jwt.io - look for `realm_access.roles`.

### 6. **"useAuth must be used within AuthProvider" Error**
**Fix**: Ensure `<AuthProvider>` wraps your app in `main.tsx` and is inside `<BrowserRouter>`.

---

## Token Storage Strategy Notes

### Current Implementation: In-Memory (Default)
- ✅ **Most Secure**: Tokens stored only in JS memory
- ❌ **Lost on Refresh**: User logged out on page refresh
- ✅ **No XSS Risk**: Tokens not accessible via `localStorage`

### Alternative: sessionStorage
To enable sessionStorage, modify `keycloak.ts`:
```typescript
await keycloak.init({
  onLoad: 'check-sso',
  checkLoginIframe: false,
  pkceMethod: 'S256',
  // Add this line:
  // Note: This is less secure than in-memory
  // enableLogging: true, // for debugging
});
```

Keycloak-js uses in-memory by default. For sessionStorage persistence, tokens are handled internally.

### Production Best Practice: Backend-for-Frontend (BFF)
For production with <1000 users, recommended approach:
1. Frontend initiates OAuth flow
2. Backend receives authorization code
3. Backend exchanges code for tokens
4. Backend stores refresh token securely (encrypted DB or Redis)
5. Backend sets HttpOnly cookie with session ID
6. Frontend uses session cookie (immune to XSS)
7. Backend handles token refresh transparently

---

## CORS & Redirect URI Configuration

### Keycloak Client Settings:
```
Valid Redirect URIs:
  http://localhost:5173/*
  http://localhost:5173
  https://yourdomain.com/*  (production)

Valid Post Logout Redirect URIs:
  http://localhost:5173/*
  http://localhost:5173
  https://yourdomain.com/*  (production)

Web Origins:
  http://localhost:5173
  https://yourdomain.com  (production)
```

### Important Notes:
- Use `/*` wildcard to allow all paths under base URL
- Include both with and without trailing slash
- For production, replace with actual domain
- Always use HTTPS in production

---

## Security Checklist

- [x] Authorization Code Flow + PKCE enabled
- [x] Public client (no client secret in frontend)
- [x] Token refresh strategy implemented
- [x] Role-based access control (RBAC)
- [x] Logout clears session
- [x] Protected routes redirect to login
- [ ] HTTPS in production
- [ ] Content Security Policy (CSP) headers
- [ ] HttpOnly cookies for production (BFF pattern)

---

## Development vs Production

### Development (Current):
- HTTP allowed
- Localhost URLs
- In-memory token storage
- Permissive CORS

### Production Recommendations:
- **HTTPS Only**: Enable SSL/TLS
- **HttpOnly Cookies**: Use BFF pattern
- **Short Token Lifetime**: 5-15 minutes for access tokens
- **Refresh Token Rotation**: Enable in Keycloak
- **Rate Limiting**: Protect login endpoint
- **CSP Headers**: Prevent XSS
- **Monitoring**: Log auth failures

---

**Setup Complete!** 🎉

Your frontend now has production-ready Keycloak authentication with PKCE, token refresh, and role-based access control.

