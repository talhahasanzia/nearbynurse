Below is a **complete, end-to-end action plan** that takes you from **zero → production-ready** using:

✔ React (Vite)
✔ NestJS
✔ PostgreSQL
✔ Supabase Auth
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
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

---

## **Backend (NestJS)**

```bash
cd backend
npm i -g @nestjs/cli
nest new backend
```

Install JWT tools for Supabase:

```bash
npm i jsonwebtoken jwk-to-pem axios
```

Add `.env`:

```
DATABASE_URL=postgresql://postgres:password@db:5432/mydb
SUPABASE_JWKS_URL=https://your-project-id.supabase.co/auth/v1/keys
PORT=3000
```

---

# 🚀 **PART 3 — Add Supabase Auth to NestJS**

Inside NestJS, create:

### **backend/src/auth/supabase-auth.guard.ts**

```ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private jwks: any = null;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('Missing token');

    if (!this.jwks) {
      const res = await axios.get(process.env.SUPABASE_JWKS_URL);
      this.jwks = res.data.keys;
    }

    const decoded = jwt.decode(token, { complete: true });
    const jwk = this.jwks.find((key) => key.kid === decoded.header.kid);
    const pem = jwkToPem(jwk);

    try {
      jwt.verify(token, pem, { algorithms: ['RS256'] });
      return true;
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
```

Use it in any controller:

```ts
@UseGuards(SupabaseAuthGuard)
@Get("me")
getProfile() {
  return { msg: "Authenticated!" };
}
```

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
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

---

## **2) Create Render Web Service (Backend)**

* Select “Web Service”
* Root Directory → `backend`
* Use Dockerfile
* Add environment variables:

```
DATABASE_URL=postgres://...
SUPABASE_JWKS_URL=...
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
✔ Supabase Auth integrated
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
