# ─── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first to leverage layer caching.
COPY package*.json ./
RUN npm ci

# Copy the rest of the frontend source and build.
COPY ./ ./

# Declare build-time variables so Vite can embed them into the JS bundle.
# Pass each one with: docker build --build-arg VITE_API_URL=http://backend:8000 ...
ARG VITE_API_URL
ARG VITE_AUTH_ENABLED=true
ARG VITE_KEYCLOAK_URL
ARG VITE_KEYCLOAK_REALM
ARG VITE_KEYCLOAK_CLIENT_ID

RUN npm run build
# Vite outputs to /app/dist by default.

# ─── Stage 2: serve ──────────────────────────────────────────────────────────
FROM nginx:alpine AS final

# Remove the default nginx welcome page.
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets.
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx template: envsubst replaces ${API_URL} at container start.
# The official nginx image processes /etc/nginx/templates/*.template
# automatically before nginx launches.
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]