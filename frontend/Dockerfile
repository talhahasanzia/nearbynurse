FROM node:22.12.0-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Accept build args for Vite environment variables
ARG VITE_API_URL
ARG VITE_KEYCLOAK_URL
ARG VITE_KEYCLOAK_REALM
ARG VITE_KEYCLOAK_CLIENT_ID

# Export environment variables for the build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_KEYCLOAK_URL=${VITE_KEYCLOAK_URL}
ENV VITE_KEYCLOAK_REALM=${VITE_KEYCLOAK_REALM}
ENV VITE_KEYCLOAK_CLIENT_ID=${VITE_KEYCLOAK_CLIENT_ID}

RUN npm run build

FROM node:22.12.0-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist

CMD ["serve", "-s", "dist", "-l", "5173"]
