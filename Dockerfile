# ─── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first to leverage layer caching.
COPY package*.json ./
RUN npm ci

# Copy the rest of the frontend source and build.
COPY ./ ./

# Declare build-time variables so Vite can embed them into the JS bundle.
# Pass each one with: docker build --build-arg VITE_AUTH_ENABLED=true ...
ARG VITE_AUTH_ENABLED=true

RUN npm run build
# Vite outputs to /app/dist by default.

# ─── Stage 2: serve ──────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS final

# envsubst is part of gettext — needed to render ${API_URL} in the template.
RUN apk add --no-cache gettext

# Remove the default nginx welcome page.
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets.
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the nginx config as a template — ${API_URL} will be substituted at
# container startup by envsubst, so the backend address can be set via env var
# without rebuilding the image.
COPY nginx.conf /etc/nginx/nginx.conf.template

# Make directories writable for non-root.
RUN chown -R 1000:1000 /var/cache/nginx /var/log/nginx /usr/share/nginx/html && \
    chmod -R 755 /var/cache/nginx /var/log/nginx

# Set a default value for API_URL, which will be substituted into the nginx.conf at runtime.
ENV API_URL=http://host.docker.internal:8000

EXPOSE 8080

USER 1000

# 1. Substitute ${API_URL} in the template and write the final nginx.conf to /tmp
#    (writable by non-root). Only ${API_URL} is substituted — all other nginx
#    $variable references (e.g. $host, $remote_addr) are left untouched.
# 2. Start nginx in the foreground using the rendered config.
CMD ["/bin/sh", "-c", \
  "envsubst '${API_URL}' < /etc/nginx/nginx.conf.template > /tmp/nginx.conf && nginx -c /tmp/nginx.conf -g 'daemon off;'"]
