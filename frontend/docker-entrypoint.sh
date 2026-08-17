#!/bin/sh
# Container entrypoint for the Nebari Chat frontend.
#
# Renders the nginx config and, outside Kubernetes, generates /config.json from
# environment variables so the app can be re-branded and pointed at a Keycloak
# without rebuilding the image.
set -eu

CONFIG=/usr/share/nginx/html/config.json

# 1. Render nginx.conf — substitute only ${API_URL}, leaving other nginx
#    variables (e.g. $host, $remote_addr) untouched.
envsubst '${API_URL}' < /tmp/nginx/nginx.conf.template > /tmp/nginx/nginx.conf

# 2. Generate /config.json from environment variables when the file is writable
#    — i.e. the placeholder baked into the image, not a read-only mount from a
#    Helm ConfigMap (Kubernetes) or a `docker -v ...:ro` local file, both of
#    which take precedence and are left untouched. Only regenerate when at
#    least one config variable is set, so a bare `docker run` keeps the baked
#    placeholder (and thus the built-in defaults).
if [ -w "$CONFIG" ] && [ -n "${KEYCLOAK_URL:-}${KEYCLOAK_REALM:-}${KEYCLOAK_CLIENT_ID:-}${BRANDING_TITLE:-}${BRANDING_LOGO_URL:-}${BRANDING_LOGO_URL_DARK:-}${BRANDING_FAVICON_URL:-}${BRANDING_THEME_LIGHT:-}${BRANDING_THEME_DARK:-}" ]; then
  keycloak_url="${KEYCLOAK_URL:-https://keycloak.hrafnar-nebari-dev.openteams.app}"
  keycloak_realm="${KEYCLOAK_REALM:-nebari}"
  keycloak_client_id="${KEYCLOAK_CLIENT_ID:-nebari-chat-dev}"

  # Theme overrides are raw JSON objects; default to an empty object.
  theme_light="${BRANDING_THEME_LIGHT:-}"
  [ -n "$theme_light" ] || theme_light="{}"
  theme_dark="${BRANDING_THEME_DARK:-}"
  [ -n "$theme_dark" ] || theme_dark="{}"

  cat > "$CONFIG" <<EOF
{
  "keycloak": {
    "url": "${keycloak_url}",
    "realm": "${keycloak_realm}",
    "clientId": "${keycloak_client_id}"
  },
  "branding": {
    "title": "${BRANDING_TITLE:-}",
    "logoUrl": "${BRANDING_LOGO_URL:-}",
    "logoUrlDark": "${BRANDING_LOGO_URL_DARK:-}",
    "faviconUrl": "${BRANDING_FAVICON_URL:-}",
    "theme": {
      "light": ${theme_light},
      "dark": ${theme_dark}
    }
  }
}
EOF
fi

# 3. Start nginx in the foreground.
exec nginx -c /tmp/nginx/nginx.conf -g 'daemon off;'
