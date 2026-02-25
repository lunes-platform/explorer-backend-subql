# Base
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# Deps
FROM base AS deps
RUN npm ci

# Development
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5175
CMD ["npm", "run", "dev", "--", "--host", "--port", "5175"]

# Builder — VITE_* vars are baked into the JS bundle at build time
FROM base AS builder
ARG VITE_API_URL=http://localhost:4000
ARG VITE_GRAPHQL_URL=http://localhost:3000
ARG VITE_WS_ENDPOINTS=wss://ws-archive.lunes.io,wss://ws-lunes-main-02.lunes.io,wss://ws-lunes-main-01.lunes.io
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GRAPHQL_URL=$VITE_GRAPHQL_URL
ENV VITE_WS_ENDPOINTS=$VITE_WS_ENDPOINTS
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production — Nginx serves the static build
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
