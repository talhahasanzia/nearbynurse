Below is a **complete, end-to-end action plan** that takes you from **zero → production-ready** using:

✔ React (Vite)
✔ NestJS
✔ PostgreSQL
✔ Docker (local dev)
✔ Render.com (prod hosting)
✔ GitHub Actions (CI/CD)
✔ Single Monorepo

This is a **battle-tested, minimal-effort, modern, secure** setup.

---

# 🚀 **PART 1 — Create the Monorepo Structure**

```
your-project/
│
├── frontend/            → React + Vite
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
│
├── backend/             → NestJS
│   ├── src/
│   ├── test/
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── Dockerfile
│
├── docker-compose.yml   → Local dev environment
│
├── .github/
│   └── workflows/
│       ├── frontend.yml
│       └── backend.yml
│
└── README.md
```

---

# 🚀 **PART 2 — Initialize Projects**

## **Frontend (React + Vite)**

```bash
cd frontend
npm create vite@latest
# choose React + TypeScript
npm install
```

Add environment variable support:

**frontend/.env**

```
VITE_API_URL=http://localhost:3000
```

---

## **Backend (NestJS)**

```bash
cd backend
npm i -g @nestjs/cli
nest new backend
```

Add `.env`:

```
DATABASE_URL=postgresql://postgres:password@db:5432/mydb
PORT=3000
```

---

# 🚀 **PART 3 — Authentication**

The project no longer uses Supabase for authentication. Instead, the frontend uses a mock authentication system for UI development. The backend exposes a mock `/me` endpoint for testing.

---

# 🚀 **PART 4 — Docker Setup (LOCAL)**

## **Root `docker-compose.yml`**

```yaml
version: "3.9"

services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mydb
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    env_file:
      - ./backend/.env
    ports:
      - "3000:3000"
    depends_on:
      - db

  frontend:
    build: ./frontend
    env_file:
      - ./frontend/.env
    ports:
      - "5173:5173"
    depends_on:
      - backend

volumes:
  pgdata:
```

---

## **Frontend Dockerfile**

**frontend/Dockerfile:**

```Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist

CMD ["serve", "-s", "dist", "-l", "5173"]
```

---

## **Backend Dockerfile**

**backend/Dockerfile**

```Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

RUN npm run build

CMD ["node", "dist/main.js"]
```

---

# 🚀 **PART 5 — Running Local Dev**

```bash
docker-compose up --build
```

Access:

* Frontend → [http://localhost:5173](http://localhost:5173)
* Backend → [http://localhost:3000](http://localhost:3000)
* PostgreSQL → localhost:5432

---

# 🚀 **PART 6 — Setup Render.com (Production)**

## **1) Create Render Static Site (Frontend)**

* Connect repo
* Root Directory → `frontend`
* Build Command →

  ```
  npm install && npm run build
  ```
* Publish Directory →

  ```
  dist
  ```

Set environment variables:

```
VITE_API_URL=https://your-backend.onrender.com
```

---

## **2) Create Render Web Service (Backend)**

* Select “Web Service”
* Root Directory → `backend`
* Use Dockerfile
* Add environment variables:

```
DATABASE_URL=postgres://...
PORT=3000
NODE_ENV=production
```

---

## **3) Create Render PostgreSQL Instance**

* Name: mydb
* Use connection string in backend `.env` (on Render dashboard)

---

# 🚀 **PART 7 — GitHub Actions CI/CD**

## Frontend Workflow

**.github/workflows/frontend.yml**

```yaml
name: Frontend CI

on:
  push:
    branches: ["main"]

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run build
```

---

## Backend Workflow

**.github/workflows/backend.yml**

```yaml
name: Backend CI

on:
  push:
    branches: ["main"]

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run build
      - run: npm run test
```

(Render auto-deploys when GitHub updates — Actions ensures code builds cleanly before that.)

---

# 🚀 **PART 8 — Deployment Flow (Final)**

1. `git push origin main`
2. GitHub Actions verifies FE & BE compile.
3. Render automatically:

    * Builds frontend (Vite → dist → CDN)
    * Builds backend using Dockerfile
    * Runs migrations / connects to Postgres
4. Your site goes live.

---

# 🟢 **You Now Have:**

✔ Secure-by-design architecture
✔ No vendor lock-in
✔ Monorepo structure
✔ Local docker-compose
✔ Production Docker back-end
✔ Render hosting pipeline
✔ Full CI/CD

---

# If you want next:

I can generate:

🔥 **Production-ready Supabase login + NestJS JWT guard example**
🔥 **React AuthContext + ProtectedRoutes template**
🔥 **Terraform or infra-as-code for Render & DB**
🔥 **Nx / Turborepo to optimize monorepo**

Just tell me what you want next.

Keycloak on backend:





# 1️⃣ Install dependencies

```bash
npm install @nestjs/passport passport passport-jwt jwks-rsa
```

---

# 2️⃣ Create `keycloak.strategy.ts`

```ts
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import * as jwksRsa from "jwks-rsa";

@Injectable()
export class KeycloakJwtStrategy extends PassportStrategy(Strategy, "keycloak") {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ["RS256"],
      issuer: process.env.KEYCLOAK_ISSUER,    // e.g., "https://auth.myapp.com/realms/myrealm"
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        jwksUri: `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/certs`,
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 3,
      }),
    });
  }

  async validate(payload: any) {
    // payload.realm_access.roles contains roles
    return payload;
  }
}
```

---

# 3️⃣ Create Auth Guard `keycloak-auth.guard.ts`

```ts
import { AuthGuard } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";

@Injectable()
export class KeycloakAuthGuard extends AuthGuard("keycloak") {}
```

---

# 4️⃣ Optional Role Decorator `roles.decorator.ts`

```ts
import { SetMetadata } from "@nestjs/common";

export const Roles = (...roles: string[]) => SetMetadata("roles", roles);
```

---

# 5️⃣ Optional Role Guard `roles.guard.ts`

```ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Reflector,
} from "@nestjs/common";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>("roles", ctx.getHandler());
    if (!requiredRoles) return true;

    const { user } = ctx.switchToHttp().getRequest();

    const roles = user?.realm_access?.roles || [];

    const hasRole = requiredRoles.every((r) => roles.includes(r));
    if (!hasRole) throw new ForbiddenException("Missing required roles");

    return true;
  }
}
```

---

# 6️⃣ Use in any controller

```ts
import { Controller, Get, UseGuards } from "@nestjs/common";
import { KeycloakAuthGuard } from "./auth/keycloak-auth.guard";
import { Roles } from "./auth/roles.decorator";
import { RolesGuard } from "./auth/roles.guard";

@Controller("demo")
@UseGuards(KeycloakAuthGuard, RolesGuard)
export class DemoController {
  @Get("protected")
  getProtected() {
    return { ok: true };
  }

  @Roles("admin")
  @Get("admin-only")
  getAdmin() {
    return { secret: "admin data" };
  }
}
```

---

# 7️⃣ Add to module `auth.module.ts`

```ts
import { Module } from "@nestjs/common";
import { KeycloakJwtStrategy } from "./keycloak.strategy";
import { RolesGuard } from "./roles.guard";

@Module({
  providers: [KeycloakJwtStrategy, RolesGuard],
  exports: [RolesGuard],
})
export class AuthModule {}
```

---

# 8️⃣ Required ENV variables

```
KEYCLOAK_ISSUER=https://your-keycloak-domain/realms/yourrealm
```

Examples:

```
https://auth.myapp.com/realms/app
http://localhost:8080/realms/app
```

---

# 9️⃣ Example Docker Compose (Keycloak + Postgres)

```yaml
version: "3.9"

services:
  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    command: start
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://keycloak-db:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: keycloak
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
    ports:
      - "8080:8080"
    depends_on:
      - keycloak-db

  keycloak-db:
    image: postgres:15
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: keycloak
    volumes:
      - kcdata:/var/lib/postgresql/data

volumes:
  kcdata:
```

---

frontend keycloak :
You are an expert full-stack dev. Produce a complete, step-by-step frontend integration for Keycloak using React + Vite. Output code only where asked, and keep prose minimal and concrete. The output must be copy/paste runnable (no missing imports), use modern React (hooks, context), and be suitable for <1000 users.

Requirements & constraints:
- Use keycloak-js library and Authorization Code Flow with PKCE for SPA security.
- Do NOT store refresh tokens in localStorage. Prefer in-memory or sessionStorage and explain tradeoffs. Mention best practice of using backend to exchange code for HttpOnly cookies as an option.
- Provide a single-file `keycloak.ts` initializer, a `AuthProvider.tsx` (React Context), a `useAuth()` hook, and a `ProtectedRoute.tsx` for React Router v6.
- Provide example usage in `main.tsx` and a small `App.tsx` with public route, login button, protected route showing `tokenParsed` and roles.
- Include token refresh strategy that uses `keycloak.updateToken(minValiditySeconds)` on an interval and handles failures by redirecting to login.
- Show how to read roles from `keycloak.tokenParsed.realm_access.roles` and expose `hasRole(role)` helper in `useAuth`.
- Include env variables placeholders for `VITE_KEYCLOAK_URL`, `VITE_KEYCLOAK_REALM`, `VITE_KEYCLOAK_CLIENT_ID`, and `VITE_APP_BASE_URL`.
- Provide CORS & redirectUri guidance: list what to set in Keycloak admin console (Valid Redirect URIs: `http://localhost:5173/*`, Web Origins).
- Provide step-by-step testing checklist: start Keycloak dev (docker compose), create realm/client settings, create test user, run Vite, test login, test protected route, test logout, test role enforcement.
- Keep code TypeScript, minimal dependencies (react, react-router-dom, keycloak-js). Use `sessionStorage` by default but explain "in-memory only" approach and tradeoffs.
- Finally, produce a short troubleshooting section with 6 common problems and one-line fixes.

Deliverables (structure):
1) Short 2-line summary of what you will produce.
2) `keycloak.ts` (TS file).
3) `AuthProvider.tsx` (TSX file).
4) `useAuth.ts` (TS file).
5) `ProtectedRoute.tsx` (TSX file).
6) `main.tsx` example wiring.
7) `App.tsx` example showing routes and usage.
8) Env file snippet.
9) Keycloak admin console checklist (3–5 bullet points).
10) Testing checklist (ordered steps).
11) Troubleshooting (6 items).
    Use code fences with file names (e.g. ```ts keycloak.ts```). Do not include any extra files.

Now produce the requested deliverables.
