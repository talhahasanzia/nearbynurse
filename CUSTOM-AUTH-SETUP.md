# Custom UI Authentication with Keycloak Backend

## Overview

Your app now has **custom login and registration pages** on the frontend with **Keycloak hidden in the backend**. Users never see Keycloak - they only interact with your branded UI.

---

## Architecture

```
Frontend (Custom UI)          Backend (BFF Pattern)           Keycloak (Hidden)
┌─────────────────┐          ┌──────────────────┐          ┌─────────────┐
│  /register      │          │  POST /auth/     │          │   Admin API │
│  Form           ├──────────► register          ├──────────►  Create User│
│                 │          │                  │          │             │
└─────────────────┘          └──────────────────┘          └─────────────┘

┌─────────────────┐          ┌──────────────────┐          ┌─────────────┐
│  /login         │          │  POST /auth/     │          │   Token     │
│  Form           ├──────────►  login           ├──────────►  Endpoint   │
│                 │◄─────────┤  Returns tokens  │◄─────────┤  (Password  │
└─────────────────┘          └──────────────────┘          │   Grant)    │
                                                            └─────────────┘

┌─────────────────┐          ┌──────────────────┐          ┌─────────────┐
│  Protected      │          │  GET /me         │          │   JWKS      │
│  API Calls      ├──────────►  Validates JWT   ├──────────►  Validate   │
│  (Bearer token) │◄─────────┤                  │          │   Token     │
└─────────────────┘          └──────────────────┘          └─────────────┘
```

---

## How It Works

1. **Registration**: User fills form → Frontend POSTs to `/auth/register` → Backend calls Keycloak Admin API → User created
2. **Login**: User enters credentials → Frontend POSTs to `/auth/login` → Backend gets token from Keycloak → Returns to frontend
3. **Token Storage**: Frontend stores access_token + refresh_token in `sessionStorage`
4. **API Calls**: Frontend attaches `Authorization: Bearer {token}` → Backend validates via Keycloak JWKS
5. **Token Refresh**: Every 60s, frontend checks expiry and calls `/auth/refresh` if needed

**No Keycloak redirects, no visible Keycloak URLs to end users.**

---

## Setup Steps

### 1. Enable Direct Access Grants in Keycloak

This is required for password grant (username/password login):

1. Open http://localhost:8080/admin
2. Login: `admin` / `admin`
3. Go to **Clients** → `nearbynurse-frontend`
4. **Capability config** tab
5. Enable: ✅ **Direct access grants**
6. Click **Save**

### 2. Verify Backend Environment

Ensure `backend/.env` has:
```env
KEYCLOAK_ISSUER=http://localhost:8080/realms/master
KEYCLOAK_CLIENT_ID=nearbynurse-frontend
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=admin
```

### 3. Start Services

```bash
docker-compose up -d
```

---

## Testing the Flow

### Register a New User

1. Open http://localhost:5173/register
2. Fill in the form:
   - Username: `johndoe`
   - Email: `john@example.com`
   - Password: `password123`
   - First Name: `John`
   - Last Name: `Doe`
3. Click **Register**
4. Should redirect to login page with success message

### Login

1. Open http://localhost:5173/login
2. Enter:
   - Username: `johndoe`
   - Password: `password123`
3. Click **Login**
4. Should redirect to `/dashboard`

### Call Protected Endpoint

1. On Dashboard, click **Call /me endpoint**
2. Should see JSON response with user info and roles

### Verify Token

Open DevTools Console:
```javascript
sessionStorage.getItem('access_token')
// Should see JWT token

// Decode it at jwt.io to see claims
```

---

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login with username/password |
| POST | `/auth/refresh` | Refresh access token |

### Protected Endpoints (Require Bearer Token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/me` | Get current user info |
| GET | `/demo/protected` | Any authenticated user |
| GET | `/demo/admin-only` | Requires `admin` role |

---

## Testing with cURL

### Register

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser2",
    "email": "test2@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser2",
    "password": "password123"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "expires_in": 300,
  "token_type": "Bearer"
}
```

### Call Protected Endpoint

```bash
TOKEN="<paste-access-token>"
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/me
```

---

## Security Notes

### ✅ What's Hidden from Users

- Keycloak URL (http://localhost:8080)
- Keycloak realm structure
- Keycloak admin console
- OAuth redirect flows
- JWKS endpoints

Users only see:
- Your custom login page
- Your custom registration page
- Your branded error messages

### 🔒 Token Storage

**Current**: `sessionStorage`
- ✅ Cleared when tab closes
- ✅ Not shared across tabs
- ⚠️ Vulnerable to XSS (same domain)

**Production Best Practice**: HttpOnly Cookies
- Backend sets cookie after login
- Cookie contains session ID (not JWT)
- Backend stores session → user mapping
- Immune to XSS attacks

### 🔐 Keycloak Admin Access

Backend uses admin credentials to create users. In production:
- Create a dedicated service account
- Limit permissions to user management only
- Store credentials in secrets manager
- Rotate regularly

---

## Troubleshooting

### "Invalid credentials" on login

- Check username/password are correct
- Verify user exists in Keycloak (http://localhost:8080/admin → Users)
- Check backend logs: `docker-compose logs backend`

### "Registration failed: User already exists"

- Username or email already taken
- Try different username/email
- Or delete existing user in Keycloak admin

### "Direct access grants not enabled"

- Go to Keycloak → Clients → nearbynurse-frontend
- Capability config → Enable "Direct access grants"
- Save and try again

### Token validation fails (401)

- Check token is being sent: DevTools → Network → Headers
- Verify `KEYCLOAK_ISSUER` in backend/.env
- Check backend can reach Keycloak: `docker-compose exec backend curl http://keycloak:8080`

### CORS errors

- Backend has `app.enableCors()` in main.ts
- Should allow all origins in development
- For production, configure specific origins

---

## Production Checklist

- [ ] Use HTTPS everywhere
- [ ] Store admin credentials in secrets manager
- [ ] Implement rate limiting on /auth/login (prevent brute force)
- [ ] Add CAPTCHA to registration
- [ ] Use HttpOnly cookies instead of sessionStorage
- [ ] Implement email verification flow
- [ ] Add password reset functionality
- [ ] Set up Keycloak backup/recovery
- [ ] Monitor failed login attempts
- [ ] Implement account lockout after X failed attempts
- [ ] Add audit logging for user creation/modification

---

## Next Steps

1. **Email Verification**: Configure SMTP in Keycloak, enable email verification
2. **Password Reset**: Add "Forgot password?" flow
3. **Social Login**: Add Google/GitHub login (hidden behind "Continue with Google" button that talks to your backend)
4. **2FA**: Enable TOTP in Keycloak, add UI for 2FA setup
5. **User Profile**: Add profile editing page that updates Keycloak user attributes

---

**You now have a fully custom-branded authentication system powered by Keycloak!** 🎉

No users will ever know Keycloak exists.

