FROM node:22.12.0-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Accept build arg for Vite API URL
ARG VITE_API_URL

# Export API URL as environment variable for the build
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

FROM node:22.12.0-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist

CMD ["serve", "-s", "dist", "-l", "5173"]
