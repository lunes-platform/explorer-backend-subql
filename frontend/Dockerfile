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
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# Builder
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
# Default nginx config is usually sufficient for SPA, but if routing issues occur, 
# a custom nginx.conf might be needed.
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
