FROM node:22.12.0-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Accept build args for Vite environment variables
ARG VITE_API_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Export them as environment variables for the build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

RUN npm run build

FROM node:22.12.0-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist

CMD ["serve", "-s", "dist", "-l", "5173"]
