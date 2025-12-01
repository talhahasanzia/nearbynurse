# 🏥 NearbyNurse - Engineering Onboarding Presentation

Welcome to the NearbyNurse project! This document will guide you through the architecture, tech stack, and key implementation concepts.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Overview](#architecture-overview)
4. [Key Concepts & Definitions](#key-concepts--definitions)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [Authentication Flow](#authentication-flow)
8. [Docker & Containerization](#docker--containerization)
9. [Local Development Setup](#local-development-setup)
10. [API Endpoints](#api-endpoints)
11. [Next Steps](#next-steps)

---

## 🎯 Project Overview

**NearbyNurse** is a full-stack healthcare application that connects users with nearby nursing services. The application features:

- ✅ User authentication and authorization with Keycloak
- ✅ Role-based access control (RBAC)
- ✅ RESTful API backend
- ✅ Modern React SPA frontend
- ✅ Fully containerized with Docker
- ✅ Nginx reverse proxy for unified access
- ✅ PostgreSQL database for data persistence

---

## 🛠️ Technology Stack

### **Frontend**
- **React 19.2** - Component-based UI library for building interactive interfaces
- **TypeScript** - Typed superset of JavaScript for better code quality and IDE support
- **Vite** - Fast build tool and development server with Hot Module Replacement (HMR)
- **React Router** - Client-side routing for single-page application navigation
- **Keycloak-js** - Official Keycloak JavaScript adapter for authentication

### **Backend**
- **NestJS 11** - Progressive Node.js framework for building scalable server-side applications
- **TypeScript** - Ensures type safety across the backend codebase
- **Passport.js** - Authentication middleware for Node.js with strategy-based approach
- **JWT (JSON Web Tokens)** - Stateless authentication tokens for API security
- **Axios** - Promise-based HTTP client for making API requests

### **Authentication & Authorization**
- **Keycloak 24** - Open-source Identity and Access Management (IAM) solution
- **OpenID Connect (OIDC)** - Authentication protocol built on OAuth 2.0
- **OAuth 2.0** - Industry-standard authorization framework

### **Database**
- **PostgreSQL 16** - Robust open-source relational database management system
- **PostgreSQL 15** - Separate instance for Keycloak's internal data

### **Infrastructure**
- **Docker** - Platform for containerizing applications in isolated environments
- **Docker Compose** - Tool for defining and running multi-container Docker applications
- **Nginx** - High-performance reverse proxy and web server

### **Development Tools**
- **ESLint** - Linting tool for identifying and fixing code quality issues
- **TypeScript Compiler** - Transpiles TypeScript to JavaScript

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser (localhost:80)                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Nginx Reverse Proxy (Port 80)                 │
│                                                                   │
│  Routes:                                                          │
│    /            → Frontend (React SPA)                           │
│    /api/*       → Backend API (NestJS)                           │
│    /auth/*      → Keycloak IAM                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────┬──────────────┬──────────────┬────────────────────┐
│  Frontend    │   Backend    │  Keycloak    │   PostgreSQL       │
│  Container   │   Container  │  Container   │   Containers       │
│              │              │              │                    │
│  React+Vite  │  NestJS      │  IAM Server  │   - App DB         │
│  Port 5173   │  Port 3000   │  Port 8080   │   - Keycloak DB    │
│  (Internal)  │  (Internal)  │  (Internal)  │   (Internal)       │
└──────────────┴──────────────┴──────────────┴────────────────────┘
```

**Key Architecture Principle:** All services run internally in Docker network. Only Nginx (port 80) is exposed publicly, eliminating CORS issues and providing a single entry point.

---

## 📚 Key Concepts & Definitions

### **Core Concepts**

- **SPA (Single Page Application)** - Web app that loads a single HTML page and dynamically updates content without full page reloads
- **REST API** - Architectural style for web services using HTTP methods (GET, POST, PUT, DELETE)
- **JWT (JSON Web Token)** - Compact, URL-safe token format for securely transmitting claims between parties
- **CORS (Cross-Origin Resource Sharing)** - Security mechanism that allows or restricts resources from different origins
- **Reverse Proxy** - Server that sits in front of web servers and forwards client requests to appropriate backend services
- **Container** - Lightweight, standalone package containing application code and all dependencies
- **Docker Image** - Template/blueprint for creating Docker containers
- **OAuth 2.0** - Authorization framework enabling applications to obtain limited access to user accounts
- **OpenID Connect (OIDC)** - Identity layer on top of OAuth 2.0 for authentication
- **RBAC (Role-Based Access Control)** - Authorization method assigning permissions to users based on their roles

### **NestJS Concepts**

- **Module** - Class decorated with `@Module()` that organizes application structure and dependencies
- **Controller** - Class decorated with `@Controller()` that handles incoming HTTP requests and returns responses
- **Service** - Class decorated with `@Injectable()` containing business logic, can be injected into other classes
- **Provider** - General term for any class that can be injected as a dependency (services, repositories, factories, etc.)
- **Dependency Injection (DI)** - Design pattern where dependencies are provided to a class rather than created internally
- **Guard** - Class implementing `CanActivate` interface to determine if a request should be handled by route handler
- **Decorator** - TypeScript feature that adds metadata to classes, methods, or properties (e.g., `@Get()`, `@Post()`)
- **Middleware** - Function that has access to request/response objects and can modify them or end the request-response cycle
- **Strategy** - Passport.js authentication mechanism defining how to validate credentials/tokens

### **React Concepts**

- **Component** - Reusable, self-contained piece of UI (function or class returning JSX)
- **Hook** - Special function (starting with `use`) that lets you use React features in functional components
- **Context** - React feature for passing data through component tree without prop drilling
- **JSX (JavaScript XML)** - Syntax extension allowing HTML-like code in JavaScript
- **Props** - Short for properties; read-only data passed from parent to child components
- **State** - Mutable data managed within a component that triggers re-renders when changed
- **Protected Route** - Route component that checks authentication/authorization before rendering children

### **Security Concepts**

- **Authentication (AuthN)** - Process of verifying who a user is (identity verification)
- **Authorization (AuthZ)** - Process of verifying what a user can access (permission verification)
- **Bearer Token** - Access token sent in HTTP Authorization header: `Authorization: Bearer <token>`
- **JWKS (JSON Web Key Set)** - Set of public keys used to verify JWT signatures
- **Resource Owner Password Credentials (ROPC)** - OAuth grant type where client collects credentials directly
- **Access Token** - Short-lived token granting access to protected resources
- **Refresh Token** - Long-lived token used to obtain new access tokens without re-authentication
- **Token Expiration** - Time after which a token becomes invalid and cannot be used

---

## 🔧 Backend Implementation

### **Project Structure**

```
backend/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts               # Root module
│   ├── app.controller.ts           # Root controller
│   ├── app.service.ts              # Root service
│   ├── demo.controller.ts          # Demo protected endpoints
│   └── auth/
│       ├── auth.module.ts          # Authentication module
│       ├── auth.controller.ts      # Auth endpoints (login, register, refresh)
│       ├── auth.service.ts         # Auth business logic (Keycloak integration)
│       ├── keycloak.strategy.ts    # Passport JWT validation strategy
│       ├── keycloak-auth.guard.ts  # Guard for protected routes
│       ├── roles.guard.ts          # Guard for role-based access
│       └── roles.decorator.ts      # Custom @Roles() decorator
├── Dockerfile                      # Container configuration
└── package.json                    # Dependencies and scripts
```

### **Core Backend Files Explained**

#### **1. main.ts - Application Bootstrap**
```typescript
// Initializes NestJS application, enables CORS, starts server on port 3000
```

#### **2. app.module.ts - Root Module**
```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),  // Environment variables
    AuthModule,                                 // Authentication module
  ],
  controllers: [AppController, DemoController],
  providers: [AppService],
})
```
- **Purpose:** Organizes application into cohesive modules
- **ConfigModule:** Makes environment variables accessible throughout the app
- **AuthModule:** Encapsulates all authentication-related functionality

#### **3. auth.service.ts - Authentication Logic**

**Key Methods:**

- **`login(username, password)`** - Authenticates user via Keycloak using Resource Owner Password Credentials grant
- **`register(userData)`** - Creates new user in Keycloak via Admin API
- **`refreshToken(refresh_token)`** - Obtains new access token using refresh token
- **`getAdminToken()`** - Gets admin access token for Keycloak Admin API operations

**How it works:**
```typescript
// 1. Sends credentials to Keycloak token endpoint
// 2. Keycloak validates credentials
// 3. Returns access_token, refresh_token, expires_in
// 4. Frontend stores tokens and uses access_token for authenticated requests
```

#### **4. keycloak.strategy.ts - JWT Validation Strategy**

```typescript
@Injectable()
export class KeycloakJwtStrategy extends PassportStrategy(Strategy, 'keycloak') {
  // Configures JWT validation:
  // - Extracts token from Authorization header
  // - Fetches public keys from Keycloak JWKS endpoint
  // - Validates token signature and issuer
  // - Caches keys for performance
}
```

**Purpose:** Validates JWT tokens on every protected endpoint request without calling Keycloak server (stateless validation).

#### **5. Guards - Protecting Routes**

**KeycloakAuthGuard:**
```typescript
@Controller('demo')
@UseGuards(KeycloakAuthGuard)  // Requires valid JWT token
export class DemoController {
  @Get('protected')
  getProtected() {
    return { ok: true };
  }
}
```

**RolesGuard with @Roles Decorator:**
```typescript
@UseGuards(KeycloakAuthGuard, RolesGuard)
export class DemoController {
  @Roles('admin')  // Only users with 'admin' role can access
  @Get('admin-only')
  getAdmin() {
    return { secret: 'admin data' };
  }
}
```

### **Dependency Injection Example**

```typescript
// auth.controller.ts
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService  // NestJS automatically injects AuthService
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);  // Uses injected service
  }
}
```

**Benefits of DI:**
- Loose coupling between components
- Easy testing (can inject mock services)
- Single Responsibility Principle
- Automatic lifecycle management

---

## 🎨 Frontend Implementation

### **Project Structure**

```
frontend/
├── src/
│   ├── main.tsx                    # Application entry point
│   ├── App.tsx                     # Root component with routing
│   ├── contexts/
│   │   ├── AuthContext.tsx         # Auth context definition
│   │   └── KeycloakAuthProvider.tsx # Auth state management & logic
│   ├── hooks/
│   │   └── useAuth.ts              # Custom hook for accessing auth context
│   ├── components/
│   │   └── ProtectedRoute.tsx      # Route protection component
│   ├── pages/
│   │   ├── LoginPage.tsx           # Login form
│   │   └── RegisterPage.tsx        # Registration form
│   ├── lib/
│   │   ├── api.ts                  # API client with token injection
│   │   └── keycloak.ts             # Keycloak configuration
│   └── assets/                     # Static assets
├── Dockerfile                       # Multi-stage container build
└── package.json                     # Dependencies and scripts
```

### **Core Frontend Files Explained**

#### **1. main.tsx - Application Entry**
```typescript
// Renders React app into DOM
// Wraps app in BrowserRouter for routing
// Wraps app in AuthProvider for authentication state
```

#### **2. KeycloakAuthProvider.tsx - Authentication Context**

**Purpose:** Centralized authentication state management accessible throughout the app.

**Key Features:**
- Stores authentication state (isAuthenticated, user, token)
- Decodes JWT to extract user info and roles
- Provides login/logout/register functions
- Handles token refresh
- Persists tokens in sessionStorage

**State Structure:**
```typescript
{
  isAuthenticated: boolean,
  isLoading: boolean,
  user: {
    username: string,
    email: string,
    firstName: string,
    lastName: string,
    roles: string[]
  },
  token: string,
  login: () => void,
  logout: () => void,
  register: () => void,
  hasRole: (role: string) => boolean,
  hasAnyRole: (roles: string[]) => boolean
}
```

#### **3. useAuth Hook - Consuming Auth Context**

```typescript
// Custom hook for easy access to auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Usage in components:
const { isAuthenticated, user, login, logout } = useAuth();
```

#### **4. ProtectedRoute Component - Route Protection**

```typescript
<ProtectedRoute roles={['admin']}>
  <AdminDashboard />
</ProtectedRoute>

// - Shows loading spinner while checking auth
// - Redirects to login if not authenticated
// - Checks role requirements if specified
// - Renders children if all checks pass
```

#### **5. api.ts - API Client**

```typescript
// Centralized API client that:
// - Automatically adds Authorization header with JWT token
// - Handles token expiration
// - Triggers token refresh when needed
// - Provides consistent error handling
```

#### **6. React Component Example**

```typescript
function Dashboard() {
  const { user, logout, hasRole } = useAuth();  // Use auth hook
  const [data, setData] = useState(null);        // Local state

  const fetchData = async () => {
    const result = await api.get('/me');          // API call with auto auth
    setData(result);
  };

  return (
    <div>
      <h1>Welcome {user?.username}</h1>
      {hasRole('admin') && <AdminPanel />}         {/* Conditional rendering */}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

## 🔐 Authentication Flow

### **Registration Flow**

```
┌─────────┐         ┌──────────┐         ┌──────────┐
│ Browser │         │  NestJS  │         │ Keycloak │
└────┬────┘         └────┬─────┘         └────┬─────┘
     │                   │                     │
     │ POST /api/auth/   │                     │
     │    register       │                     │
     ├──────────────────>│                     │
     │                   │                     │
     │                   │ Get admin token     │
     │                   ├────────────────────>│
     │                   │<────────────────────┤
     │                   │  Admin access token │
     │                   │                     │
     │                   │ Create user via     │
     │                   │   Admin API         │
     │                   ├────────────────────>│
     │                   │<────────────────────┤
     │                   │   User created      │
     │                   │                     │
     │                   │ Set user password   │
     │                   ├────────────────────>│
     │                   │<────────────────────┤
     │                   │   Password set      │
     │                   │                     │
     │ Success message   │                     │
     │<──────────────────┤                     │
     │                   │                     │
```

### **Login Flow**

```
┌─────────┐         ┌──────────┐         ┌──────────┐
│ Browser │         │  NestJS  │         │ Keycloak │
└────┬────┘         └────┬─────┘         └────┬─────┘
     │                   │                     │
     │ POST /api/auth/   │                     │
     │    login          │                     │
     │ {username, pwd}   │                     │
     ├──────────────────>│                     │
     │                   │                     │
     │                   │ POST /token         │
     │                   │ (ROPC grant)        │
     │                   ├────────────────────>│
     │                   │                     │
     │                   │  Validate creds     │
     │                   │                     │
     │                   │<────────────────────┤
     │                   │ access_token        │
     │                   │ refresh_token       │
     │                   │                     │
     │ Tokens returned   │                     │
     │<──────────────────┤                     │
     │                   │                     │
     │ Store tokens in   │                     │
     │  sessionStorage   │                     │
     │                   │                     │
```

### **Authenticated API Request Flow**

```
┌─────────┐         ┌──────────┐         ┌──────────┐
│ Browser │         │  NestJS  │         │ Keycloak │
└────┬────┘         └────┬─────┘         └────┬─────┘
     │                   │                     │
     │ GET /api/me       │                     │
     │ Authorization:    │                     │
     │  Bearer <token>   │                     │
     ├──────────────────>│                     │
     │                   │                     │
     │                   │ Validate JWT        │
     │                   │ (offline using      │
     │                   │  cached public key) │
     │                   │                     │
     │                   │ Check signature     │
     │                   │ Check expiration    │
     │                   │ Extract user info   │
     │                   │                     │
     │                   │ Execute route       │
     │                   │   handler           │
     │                   │                     │
     │ Protected data    │                     │
     │<──────────────────┤                     │
     │                   │                     │
```

**Key Points:**
- JWT validation happens offline (no Keycloak call on every request)
- Public keys are cached for performance
- Token expiration is checked automatically
- Invalid/expired tokens are rejected with 401 Unauthorized

### **Token Refresh Flow**

```
┌─────────┐         ┌──────────┐         ┌──────────┐
│ Browser │         │  NestJS  │         │ Keycloak │
└────┬────┘         └────┬─────┘         └────┬─────┘
     │                   │                     │
     │ POST /api/auth/   │                     │
     │    refresh        │                     │
     │ {refresh_token}   │                     │
     ├──────────────────>│                     │
     │                   │                     │
     │                   │ POST /token         │
     │                   │ grant=refresh_token │
     │                   ├────────────────────>│
     │                   │                     │
     │                   │<────────────────────┤
     │                   │ New access_token    │
     │                   │ New refresh_token   │
     │                   │                     │
     │ New tokens        │                     │
     │<──────────────────┤                     │
     │                   │                     │
```

---

## 🐳 Docker & Containerization

### **Why Docker?**

- **Consistency:** Same environment in development, staging, and production
- **Isolation:** Each service runs in its own container with its own dependencies
- **Portability:** Run anywhere Docker is installed
- **Scalability:** Easy to scale services independently
- **Simplified Setup:** No need to install Node.js, PostgreSQL, etc. locally

### **Docker Compose Services**

#### **1. Nginx (Reverse Proxy)**
```yaml
nginx:
  image: nginx:alpine              # Lightweight Nginx image
  ports:
    - "80:80"                       # Only public port exposed
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro  # Read-only config
  depends_on:
    - backend
    - frontend
    - keycloak
```

**Purpose:** Single entry point for all services, eliminates CORS issues.

#### **2. Backend (NestJS)**
```yaml
backend:
  build: ./backend                  # Build from Dockerfile
  env_file:
    - ./backend/.env                # Load environment variables
  expose:
    - "3000"                        # Internal only, not published to host
  depends_on:
    - db
    - keycloak
  healthcheck:                      # Verify service is healthy
    test: ["CMD-SHELL", "node -e \"require('http').get(...)\""]
```

**Dockerfile (Multi-stage build):**
```dockerfile
FROM node:20-alpine               # Base image
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build                 # Compile TypeScript
CMD ["node", "dist/main.js"]      # Run compiled JavaScript
```

#### **3. Frontend (React)**
```yaml
frontend:
  build:
    context: ./frontend
    args:
      - VITE_API_URL=/api           # Build-time environment variable
  expose:
    - "5173"                        # Internal only
```

**Dockerfile (Multi-stage build):**
```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci                         # Clean install for production
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build                  # Build production bundle

# Stage 2: Serve
FROM node:22-alpine
WORKDIR /app
RUN npm install -g serve           # Static file server
COPY --from=builder /app/dist ./dist
CMD ["serve", "-s", "dist", "-l", "5173"]
```

**Benefits of multi-stage builds:**
- Smaller final image (no build tools in production image)
- Faster builds with layer caching
- More secure (fewer dependencies in runtime)

#### **4. Keycloak (IAM)**
```yaml
keycloak:
  image: quay.io/keycloak/keycloak:24.0
  command: start-dev                # Dev mode (not for production)
  environment:
    KC_DB: postgres
    KC_DB_URL: jdbc:postgresql://keycloak-db:5432/keycloak
    KEYCLOAK_ADMIN: admin
    KEYCLOAK_ADMIN_PASSWORD: admin
  depends_on:
    keycloak-db:
      condition: service_healthy    # Wait for DB to be ready
  healthcheck:
    test: ["CMD-SHELL", "exec 3<>/dev/tcp/localhost/8080 ..."]
```

#### **5. PostgreSQL Databases**
```yaml
db:                                 # Application database
  image: postgres:16
  environment:
    POSTGRES_PASSWORD: password
    POSTGRES_DB: mydb
  volumes:
    - pgdata:/var/lib/postgresql/data  # Named volume for persistence

keycloak-db:                        # Keycloak database
  image: postgres:15
  environment:
    POSTGRES_DB: keycloak
    POSTGRES_USER: keycloak
    POSTGRES_PASSWORD: keycloak
  volumes:
    - kcdata:/var/lib/postgresql/data
```

### **Docker Networking**

All services are in the same Docker network and can communicate using service names:

- `http://backend:3000` - Backend from Nginx or Frontend
- `http://frontend:5173` - Frontend from Nginx
- `http://keycloak:8080` - Keycloak from Backend
- `http://db:5432` - Database from Backend

### **Health Checks**

Health checks ensure services are ready before accepting traffic:

```yaml
healthcheck:
  test: ["CMD-SHELL", "..."]        # Command to test health
  interval: 15s                     # How often to check
  timeout: 5s                       # Max time for check
  retries: 10                       # Attempts before unhealthy
  start_period: 30s                 # Grace period on startup
```

### **Data Persistence**

Named volumes ensure data survives container restarts:

```yaml
volumes:
  pgdata:      # Application database data
  kcdata:      # Keycloak database data
```

---

## 🔄 Reverse Proxy Explained

### **What is a Reverse Proxy?**

A reverse proxy sits between clients and backend servers, forwarding client requests to appropriate backend services and returning responses back to clients.

### **nginx.conf Configuration**

```nginx
# Worker processes for handling concurrent connections
events {
    worker_connections 1024;
}

http {
    # Define upstream servers
    upstream backend {
        server backend:3000;     # Docker service name:port
    }

    upstream frontend {
        server frontend:5173;
    }

    server {
        listen 80;
        server_name localhost nearbynurse.local;

        # Route: / → Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Route: /api/* → Backend (strips /api prefix)
        location /api/ {
            proxy_pass http://backend/;  # Trailing slash important!
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Route: /auth/* → Keycloak (strips /auth prefix)
        location /auth/ {
            proxy_pass http://keycloak:8080/;
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}
```

### **Request Flow Example**

**Client requests:** `http://localhost/api/auth/login`

1. Nginx receives request on port 80
2. Matches `/api/` location block
3. Strips `/api` prefix
4. Forwards to `http://backend:3000/auth/login`
5. Backend processes request
6. Nginx returns response to client

### **Benefits of Reverse Proxy**

✅ **Single Origin:** All requests from `localhost:80` - no CORS issues  
✅ **Load Balancing:** Can distribute requests across multiple backend instances  
✅ **SSL Termination:** Handle HTTPS at proxy level, internal traffic can be HTTP  
✅ **Caching:** Can cache static assets and API responses  
✅ **Security:** Hide internal service topology, add rate limiting  
✅ **URL Rewriting:** Clean public URLs while maintaining internal structure  

---

## 💻 Local Development Setup

### **Prerequisites**

- Docker Desktop installed and running
- Git (for cloning repository)
- Code editor (VS Code recommended)

### **Quick Start**

```bash
# 1. Clone repository
git clone <repository-url>
cd nearbynurse

# 2. Create root .env file
echo "VITE_API_URL=/api" > .env

# 3. Create backend .env file
cat > backend/.env << EOF
DATABASE_URL=postgresql://postgres:password@db:5432/mydb
PORT=3000
NODE_ENV=development
KEYCLOAK_ISSUER=http://localhost:8080/realms/master
KEYCLOAK_URL=http://keycloak:8080
KEYCLOAK_CLIENT_ID=nearbynurse-frontend
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=admin
EOF

# 4. Start all services
docker-compose up --build

# 5. Wait for health checks (1-2 minutes)
docker-compose ps

# 6. Access services
# Frontend: http://localhost
# Backend API: http://localhost/api
# Keycloak Admin: http://localhost/auth/admin
```

### **Initial Keycloak Configuration**

After services start, configure Keycloak client:

1. Navigate to http://localhost/auth/admin
2. Login with `admin` / `admin`
3. Go to **Clients** → Click **Create client**
4. **Client ID:** `nearbynurse-frontend`
5. Enable **Direct access grants** (for password grant)
6. Set **Valid redirect URIs:** `http://localhost/*`
7. Set **Web origins:** `http://localhost`
8. Click **Save**

### **Useful Commands**

```bash
# View logs
docker-compose logs -f                    # All services
docker-compose logs -f backend            # Specific service

# Restart services
docker-compose restart backend            # Single service
docker-compose restart                    # All services

# Rebuild after code changes
docker-compose up --build backend         # Single service
docker-compose up --build                 # All services

# Stop services
docker-compose stop                       # Stop (keep containers)
docker-compose down                       # Stop and remove containers
docker-compose down -v                    # Also remove volumes (clean slate)

# Execute commands in running containers
docker-compose exec backend sh            # Shell in backend container
docker-compose exec db psql -U postgres   # PostgreSQL CLI

# Check service health
docker-compose ps                         # Show service status
```

### **Development Without Docker (Optional)**

If you prefer local development:

```bash
# Install PostgreSQL and Keycloak locally
# Then in separate terminals:

# Terminal 1: Backend
cd backend
npm install
npm run start:dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

**Note:** Using Docker is recommended for consistency and easier setup.

---

## 🌐 API Endpoints

### **Public Endpoints (No Authentication)**

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| GET    | `/`                   | Health check - returns "Hello World!" |
| POST   | `/auth/register`      | Register new user              |
| POST   | `/auth/login`         | Login with username/password   |
| POST   | `/auth/refresh`       | Refresh access token           |

### **Protected Endpoints (Requires Authentication)**

| Method | Endpoint              | Required Role | Description            |
|--------|-----------------------|---------------|------------------------|
| GET    | `/demo/protected`     | Any           | Test protected route   |
| GET    | `/demo/admin-only`    | admin         | Admin-only test route  |

### **Request/Response Examples**

#### **Register**

```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}

Response: 201 Created
{
  "message": "User registered successfully"
}
```

#### **Login**

```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePass123!"
}

Response: 200 OK
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 300,
  "token_type": "Bearer"
}
```

#### **Protected Request**

```bash
GET /api/demo/protected
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...

Response: 200 OK
{
  "ok": true
}
```

#### **Token Refresh**

```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response: 200 OK
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 300,
  "token_type": "Bearer"
}
```

---

## 🎓 Next Steps for Engineers

### **1. Explore the Codebase**

- [ ] Clone repository and run locally
- [ ] Review backend module structure
- [ ] Understand authentication flow
- [ ] Examine frontend component hierarchy
- [ ] Test API endpoints with Postman/curl

### **2. Understand Key Files**

**Backend:**
- [ ] `backend/src/app.module.ts` - Module organization
- [ ] `backend/src/auth/auth.service.ts` - Keycloak integration
- [ ] `backend/src/auth/keycloak.strategy.ts` - JWT validation
- [ ] `backend/src/demo.controller.ts` - Protected endpoints example

**Frontend:**
- [ ] `frontend/src/main.tsx` - App initialization
- [ ] `frontend/src/contexts/KeycloakAuthProvider.tsx` - Auth state
- [ ] `frontend/src/components/ProtectedRoute.tsx` - Route protection
- [ ] `frontend/src/lib/api.ts` - API client

**Infrastructure:**
- [ ] `docker-compose.yml` - Service orchestration
- [ ] `nginx/nginx.conf` - Reverse proxy configuration

### **3. Try Making Changes**

**Easy:**
- [ ] Add a new public endpoint in backend
- [ ] Create a new React component in frontend
- [ ] Modify Nginx to add a new route

**Intermediate:**
- [ ] Add a new protected endpoint with role check
- [ ] Create a new page with protected route
- [ ] Add a new field to user registration

**Advanced:**
- [ ] Integrate a new Keycloak realm
- [ ] Add refresh token automatic renewal
- [ ] Implement social login (Google, GitHub)
- [ ] Add database models and TypeORM

### **4. Testing**

```bash
# Backend tests
cd backend
npm run test
npm run test:e2e

# Frontend tests (if configured)
cd frontend
npm run test
```

### **5. Read Documentation**

**Official Docs:**
- [NestJS Documentation](https://docs.nestjs.com)
- [React Documentation](https://react.dev)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Docker Documentation](https://docs.docker.com)
- [Nginx Documentation](https://nginx.org/en/docs/)

**Project Docs:**
- `README.md` - Overview and quick start
- `KEYCLOAK-SETUP.md` - Detailed Keycloak configuration
- `NGINX-SETUP.md` - Reverse proxy setup
- `QUICK-START.md` - Fast setup guide
- `DEPLOYMENT.md` - Production deployment guide

### **6. Team Practices**

- Follow existing code style (ESLint enforced)
- Write meaningful commit messages
- Test changes locally before pushing
- Update documentation when adding features
- Ask questions in team channels

---

## 🎯 Summary

You now understand:

✅ **Architecture:** Microservices with Nginx reverse proxy  
✅ **Backend:** NestJS with JWT authentication, dependency injection, guards  
✅ **Frontend:** React SPA with Context API, protected routes, hooks  
✅ **Authentication:** Keycloak IAM with OAuth 2.0 and OIDC  
✅ **Infrastructure:** Docker Compose orchestration, multi-container setup  
✅ **Security:** JWT validation, role-based access control  
✅ **Development:** Local Docker setup, health checks, logging  

**Key Takeaways:**

1. **Single Entry Point:** Nginx on port 80 routes to all services
2. **Stateless Auth:** JWT tokens validated offline without Keycloak calls
3. **Containerized:** Everything runs in Docker for consistency
4. **Role-Based:** Fine-grained access control with Keycloak roles
5. **Type-Safe:** TypeScript throughout frontend and backend
6. **Scalable:** Each service can scale independently

---

## 📞 Questions?

If you have questions about:

- **Backend/NestJS** - Check `backend/src/` code and NestJS docs
- **Frontend/React** - Review `frontend/src/` components and React docs
- **Authentication** - Read `KEYCLOAK-SETUP.md` and Keycloak docs
- **Docker** - See `docker-compose.yml` and Dockerfiles
- **Architecture** - Review this document and ask your team lead

**Happy coding! 🚀**

