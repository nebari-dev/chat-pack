#!/bin/sh
# Build script for nebi frontend image.
# Generates nginx.conf with API_URL substituted, copies all required files into ./nebi-bundle.

set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NEBI_BUNDLE_DIR="$SCRIPT_DIR/nebi-bundle"
API_URL="${API_URL:-http://host.docker.internal:8000}"

# Clean and create nebi-bundle directory
rm -rf "$NEBI_BUNDLE_DIR"
mkdir -p "$NEBI_BUNDLE_DIR/html"

# Copy mime.types into bundle root (nginx needs it at runtime)
cp "$SCRIPT_DIR/mime.types" "$NEBI_BUNDLE_DIR/" 2>/dev/null || true

# Copy static assets and built files into html subdirectory
cp -r "$SCRIPT_DIR/dist/." "$NEBI_BUNDLE_DIR/html/"

# Generate nginx.conf with API_URL substituted at build time
cat "$SCRIPT_DIR/nginx.conf" | sed "s|\${API_URL}|${API_URL}|g" > "$NEBI_BUNDLE_DIR/nginx.conf.rendered"

# Generate config.json from environment variables if any are set
if [ -n "${KEYCLOAK_URL:-}${KEYCLOAK_REALM:-}${KEYCLOAK_CLIENT_ID:-}${BRANDING_TITLE:-}${BRANDING_LOGO_URL:-}${BRANDING_LOGO_URL_DARK:-}${BRANDING_FAVICON_URL:-}${BRANDING_THEME_LIGHT:-}${BRANDING_THEME_DARK:-}" ]; then
  keycloak_url="${KEYCLOAK_URL:-https://keycloak.hrafnar-nebari-dev.openteams.app}"
  keycloak_realm="${KEYCLOAK_REALM:-nebari}"
  keycloak_client_id="${KEYCLOAK_CLIENT_ID:-nebari-chat-dev}"

  theme_light="${BRANDING_THEME_LIGHT:-}"
  [ -n "$theme_light" ] || theme_light="{}"
  theme_dark="${BRANDING_THEME_DARK:-}"
  [ -n "$theme_dark" ] || theme_dark="{}"

  cat > "$NEBI_BUNDLE_DIR/html/config.json" <<EOF
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

# Generate keycloak-config.json for keycloak-js
if [ -n "${KEYCLOAK_URL:-}${KEYCLOAK_REALM:-}${KEYCLOAK_CLIENT_ID:-}" ]; then
  keycloak_url="${KEYCLOAK_URL:-https://keycloak.hrafnar-nebari-dev.openteams.app}"
  keycloak_realm="${KEYCLOAK_REALM:-nebari}"
  keycloak_client_id="${KEYCLOAK_CLIENT_ID:-nebari-chat-dev}"

  cat > "$NEBI_BUNDLE_DIR/html/keycloak-config.json" <<EOF
{
  "auth-server-url": "${keycloak_url}",
  "realm": "${keycloak_realm}",
  "resource": "${keycloak_client_id}"
}
EOF
fi

echo "Build complete: $NEBI_BUNDLE_DIR"
ls -la "$NEBI_BUNDLE_DIR"
ls -la "$NEBI_BUNDLE_DIR/html"
