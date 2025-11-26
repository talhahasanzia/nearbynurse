# Quick Start Guide - Custom Registration & Login

## Prerequisites Check

Before starting, verify:
1. Docker Desktop is **running** (check menu bar icon)
2. You're in the project directory

---

## Step 1: Start All Services

Open terminal and run:

```bash
cd /Users/talhazia/WebstormProjects/nearbynurse

# Stop any existing containers
docker-compose down

# Rebuild images with latest code
docker-compose build --no-cache

# Start all services
docker-compose up -d

# Wait 30-60 seconds for Keycloak to fully start
# Then check status
docker-compose ps
```

**Expected output:**
```
NAME                                COMMAND                  SERVICE             STATUS
nearbynurse-backend-1              "docker-entrypoint.s…"   backend             Up 1 minute
nearbynurse-db-1                   "docker-entrypoint.s…"   db                  Up 1 minute
nearbynurse-frontend-1             "docker-entrypoint.s…"   frontend            Up 1 minute
nearbynurse-keycloak-1             "/opt/keycloak/bin/k…"   keycloak            Up 1 minute
nearbynurse-keycloak-db-1          "docker-entrypoint.s…"   keycloak-db         Up 1 minute (healthy)
```

---

## Step 2: Configure Keycloak (One-Time Setup)

### Enable Direct Access Grants

1. Open: **http://localhost:8080/admin**
2. Login: `admin` / `admin`
3. Click **Clients** (left sidebar)
4. Click **nearbynurse-frontend**
5. Go to **Capability config** tab
6. Enable: ✅ **Direct access grants**
7. Click **Save**

**Why?** This allows username/password login (ROPC flow) instead of OAuth redirects.

---

## Step 3: Test Registration Flow

### A. Open Registration Page

1. Open browser: **http://localhost:5173/register**

**What you should see:**
- A form with fields: Username, Email, First Name, Last Name, Password, Confirm Password
- A green "Register" button
- A link to login page at the bottom

### B. Fill Registration Form

```
Username:         johndoe
Email:            john@example.com
First Name:       John
Last Name:        Doe
Password:         password123
Confirm Password: password123
```

### C. Click "Register"

**Expected behavior:**
- Button shows "Creating account..."
- After 1-2 seconds: "✓ Registration Successful!"
- Auto-redirects to `/login` after 2 seconds

**If error occurs:**
- "User already exists" → Try different username/email
- "Registration failed" → Check backend logs (see troubleshooting below)

---

## Step 4: Test Login Flow

### A. On Login Page

**URL:** http://localhost:5173/login

**Form:**
```
Username: johndoe
Password: password123
```

### B. Click "Login"

**Expected behavior:**
- Button shows "Logging in..."
- Redirects to `/dashboard`
- You see your username in navbar
- Dashboard shows user info

---

## Step 5: Test Protected Endpoint

On Dashboard page:
1. Click **"Call /me endpoint"** button
2. Should display JSON with your user data:
   ```json
   {
     "user": {
       "preferred_username": "johndoe",
       "email": "john@example.com",
       "realm_access": {
         "roles": ["default-roles-master", "offline_access", ...]
       }
     }
   }
   ```

---

## Troubleshooting

### Registration page shows blank/white screen

**Check frontend is running:**
```bash
curl -I http://localhost:5173
# Should return: HTTP/1.1 200 OK
```

**Check frontend logs:**
```bash
docker-compose logs frontend | tail -50
```

**If container not running:**
```bash
docker-compose restart frontend
docker-compose logs -f frontend
```

---

### "Registration failed" error

**Check backend is running:**
```bash
curl http://localhost:3000/auth/register \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"pass123"}'
```

**Check backend logs:**
```bash
docker-compose logs backend | grep -i error | tail -20
```

**Common issues:**
1. Keycloak not ready → Wait 60 seconds after `docker-compose up`
2. Direct access grants not enabled → See Step 2
3. Admin credentials wrong → Check `backend/.env`

---

### "Invalid credentials" on login

**Verify user was created in Keycloak:**
1. Go to: http://localhost:8080/admin
2. Login: `admin` / `admin`
3. Click **Users** (left sidebar)
4. Search for your username
5. Should see user in list

**If user not found:**
- Registration failed silently
- Check backend logs
- Try registering again with different username

---

### Keycloak not responding

**Check Keycloak is running:**
```bash
curl http://localhost:8080/health
# Should return JSON with status
```

**Check logs:**
```bash
docker-compose logs keycloak | grep "started"
# Should see: "Keycloak ... started in ...ms"
```

**Restart Keycloak:**
```bash
docker-compose restart keycloak
docker-compose logs -f keycloak
# Wait for "started" message
```

---

### CORS errors in browser console

**Verify backend CORS is enabled:**
```bash
docker-compose logs backend | grep -i cors
```

**Backend should have:**
```typescript
// main.ts
app.enableCors();
```

**Restart backend:**
```bash
docker-compose restart backend
```

---

## Manual Testing with cURL

### Test Registration Endpoint

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "curluser",
    "email": "curl@example.com",
    "password": "password123",
    "firstName": "Curl",
    "lastName": "Test"
  }'
```

**Expected response:**
```json
{
  "message": "User registered successfully"
}
```

### Test Login Endpoint

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "curluser",
    "password": "password123"
  }'
```

**Expected response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzUxMiIs...",
  "expires_in": 300,
  "token_type": "Bearer"
}
```

### Test Protected Endpoint

```bash
# First, get token from login
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"curluser","password":"password123"}' \
  | grep -o '"access_token":"[^"]*"' \
  | cut -d'"' -f4)

# Then call /me
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/me
```

---

## Verification Checklist

Run through this checklist:

- [ ] Docker Desktop is running
- [ ] `docker-compose ps` shows 5 containers running
- [ ] http://localhost:8080 loads (Keycloak)
- [ ] http://localhost:3000 returns "Hello World!" (backend health)
- [ ] http://localhost:5173 loads (frontend)
- [ ] http://localhost:5173/register shows registration form
- [ ] http://localhost:5173/login shows login form
- [ ] Direct access grants enabled in Keycloak client
- [ ] Can register new user
- [ ] Can login with registered user
- [ ] Dashboard shows user info
- [ ] "Call /me endpoint" button works

---

## Quick Reset (If Everything Breaks)

```bash
cd /Users/talhazia/WebstormProjects/nearbynurse

# Nuclear option: remove everything
docker-compose down -v

# Rebuild from scratch
docker-compose build --no-cache

# Start fresh
docker-compose up -d

# Wait 60 seconds for Keycloak
sleep 60

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

Then go back to Step 2 (Configure Keycloak).

---

## What Should Happen (Complete Flow)

```
1. Open http://localhost:5173/register
   → See registration form

2. Fill form and click Register
   → Backend calls Keycloak Admin API
   → User created in Keycloak (invisible to you)
   → Success message shown
   → Auto-redirect to /login

3. Enter username/password and click Login
   → Backend calls Keycloak token endpoint
   → Tokens returned to frontend
   → Stored in sessionStorage
   → Redirect to /dashboard

4. On Dashboard, click "Call /me endpoint"
   → Frontend sends: Authorization: Bearer {token}
   → Backend validates JWT via Keycloak JWKS
   → Returns user data
   → Displayed on screen
```

**You never see Keycloak UI at any point!** ✅

---

## Still Not Working?

**Share these logs:**

```bash
# Get all logs
docker-compose logs > /tmp/docker-logs.txt

# Check specific errors
docker-compose logs backend | grep -i error
docker-compose logs frontend | grep -i error
docker-compose logs keycloak | grep -i error
```

**Or check browser console:**
1. Open http://localhost:5173/register
2. Press F12 (Developer Tools)
3. Go to Console tab
4. Look for red errors
5. Take screenshot and share

---

**Most common issue:** Keycloak takes 60+ seconds to start. Just wait longer after `docker-compose up -d`.

