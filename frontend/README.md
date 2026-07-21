# Nebari Chat
Nebari Chat is a frontend for a [Ravnar Server](https://github.com/nebari-dev/ravnar) or any
other agentic server that implments the Ravnar API, which is essentially just the
[AG-UI](https://docs.ag-ui.com/introduction) protocol with some additional endpoints for
managing thread history.

# Instructions

Before you can run Nebari Chat you need a [Ravnar](https://github.com/nebari-dev/ravnar)
compatible server running somewhere. Follow the Ravnar instructions for creating your
agents and deploying the server.

To get started with a local version of Nebari Chat, first checkout the repo:

```
git clone https://github.com/nebari-dev/nebari-chat-pack.git
```

Then navigate to the repo and install the dependencies:

```
cd nebari-chat-pack
npm install
```

Then copy the example `env` file and set `VITE_API_URL` to match your Ravnar deployment.

```
cp .env.example .env
```

Nebari Chat reads its runtime configuration — Keycloak connection settings and branding — from a
single `/config.json` fetched at startup, before React mounts. For local development this is served
from `public/config.json`. Edit it to match your deployment:

```json
{
  "keycloak": {
    "url": "https://keycloak.example.com",
    "realm": "myrealm",
    "clientId": "nebari-chat"
  },
  "branding": {
    "title": "",
    "logoUrl": "",
    "logoUrlDark": "",
    "faviconUrl": "",
    "theme": { "light": {}, "dark": {} }
  }
}
```

[Keycloak](https://www.keycloak.org/) provides authentication; the `keycloak` block is passed
straight to `keycloak-js`. To bypass authentication for local development, set
`VITE_AUTH_ENABLED=false` in your `.env`.

## Branding

Every `branding` field is optional and empty by default, so the app looks identical to the built-in
Nebari defaults when nothing is set. Supported fields:

| Field | Description |
| --- | --- |
| `title` | Browser tab title. Empty keeps the default (`Nebari Chat`). |
| `logoUrl` | Sidebar header logo. Empty uses the built-in Nebari logo. |
| `logoUrlDark` | Dark-mode logo. Empty falls back to `logoUrl`, then the built-in dark logo. |
| `faviconUrl` | Favicon. Empty uses the built-in Nebari favicon. |
| `theme.light` / `theme.dark` | CSS variable overrides per color scheme (see below). |

Theme tokens are camelCase brand variables (see `src/main.css`), converted to `--kebab-case` CSS
custom properties at runtime. Useful tokens include `bgBrandDefault`, `bgBrandSecondary`,
`bdBrandDefault`, `textBrandOnBrand`, `textNeutralDefault`, `textNeutralSecondary`, and `radius`.
Values are validated at runtime — anything containing `;`, `{`, `}`, quotes, `url(`, `expression(`,
or `javascript:` is rejected — and logo/favicon URLs must be root-relative paths or `http(s)` URLs.

```json
{
  "branding": {
    "title": "ACME Chat",
    "logoUrl": "https://cdn.acme.com/logo.svg",
    "theme": {
      "light": { "bgBrandDefault": "#0066cc", "bdBrandDefault": "#004a99" },
      "dark":  { "bgBrandDefault": "#4da6ff" }
    }
  }
}
```

### Configuration precedence

`/config.json` is resolved at runtime in this order (highest wins):

1. **Chart-rendered ConfigMap** (Kubernetes) — the Helm chart renders `frontend.branding` and
   `keycloak.*` into a ConfigMap mounted read-only over `/config.json`.
2. **Local config file** — a file mounted read-only over `/config.json`
   (e.g. `docker run -v ./config.json:/usr/share/nginx/html/config.json:ro ...`).
3. **Environment variables** — when the file is writable (the image-baked placeholder), the
   container entrypoint generates `/config.json` from env vars (see below).
4. **Built-in defaults** — the baked `public/config.json` placeholder; empty branding fields fall
   back to the app's built-in title, favicon, logo, and `main.css` theme tokens.

Supported environment variables (non-k8s): `KEYCLOAK_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID`,
`BRANDING_TITLE`, `BRANDING_LOGO_URL`, `BRANDING_LOGO_URL_DARK`, `BRANDING_FAVICON_URL`, and
`BRANDING_THEME_LIGHT` / `BRANDING_THEME_DARK` (raw JSON objects). Env vars are only applied when no
config file has been mounted; for full theme control, mount a `config.json` instead.


# Run the Development Server

Once your `env` file is configured and your Ravnar server is running, start the Nebari Chat
development server with the following command and point your browser at the URL displayed in 
the terminal.

```
npm run dev
```

# Testing

The frontend uses [Playwright](https://playwright.dev/) for end-to-end tests (the primary
strategy) and [Vitest](https://vitest.dev/) for minimal unit coverage of pure
functions/utilities. Playwright also runs automated accessibility checks with
[`@axe-core/playwright`](https://github.com/dequelabs/axe-core-npm), asserting that key pages have
no critical or serious WCAG violations.

## First-time setup

Playwright needs its browser binaries installed once (Chromium, Firefox, and WebKit):

```
npx playwright install
```

In CI (and on a fresh Linux machine) also install the OS-level dependencies:

```
npx playwright install --with-deps
```

## Running the tests

```
npm run test        # Vitest unit tests
npm run test:e2e    # Playwright e2e across Chromium, Firefox & WebKit (includes a11y)
npm run test:a11y   # Only the accessibility assertions
```

The e2e suite boots the app itself with a Vite dev server (auth disabled) and intercepts every
`/api/*` request with route mocks, so **no backend or Keycloak is required**. After a run, an HTML
report is written to `playwright-report/`; open it with:

```
npx playwright show-report
```

# Running with Docker

Build the image:

```
docker build -t nebari-chat .
```

Then run the container, passing environment values as needed:

```
docker run -p 8080:8080 \
  -e API_URL=http://host.docker.internal:8000 \
  -e KEYCLOAK_URL=https://keycloak.example.com \
  -e KEYCLOAK_REALM=nebari \
  -e KEYCLOAK_CLIENT_ID=nebari-chat \
  -e BRANDING_TITLE="ACME Chat" \
  nebari-chat
```

> **Note:** `/config.json` is generated from environment variables at container startup (see the
> precedence list above). To supply a full config — including theme tokens — mount a file instead:
> `docker run -v ./config.json:/usr/share/nginx/html/config.json:ro ... nebari-chat`. In a Kubernetes
> deployment the Helm chart renders `keycloak.*` and `frontend.branding` into a ConfigMap mounted over
> `/config.json`, so values can be changed without rebuilding the image.

Open your browser at `http://localhost:8080`.

# Publishing to Quay (Manual)

There is no CI/CD pipeline for this project. The Docker image and Helm chart must be built and
pushed manually.

## Docker Image

Build and push the image for `linux/amd64`:

```
docker buildx build --platform linux/amd64 \
  -t quay.io/openteams/chat-plus-plus:<version> \
  -t quay.io/openteams/chat-plus-plus:latest \
  --push .
```

## Helm Chart

Package and push the chart:

```
helm package helm/chat-plus-plus-chart
helm push chat-plus-plus-chart-<version>.tgz oci://quay.io/openteams
```

This publishes to `quay.io/openteams/chat-plus-plus-chart:<version>`. Push to `oci://quay.io/openteams`
(the org level) so the chart name from `Chart.yaml` becomes the repo name.


# Run a Production Build

To build a production bundle for deployment, first make sure your `env` file is configured properly
as these variables will be built into the bundle, then execute the following command:

```
npm run build
```

If the build succeeds, the results will be in the `./dist` directory ready to be hosted by a 
server of your choice.

You can preview the build locally by running the following command and pointing your browser to 
the URL shown in the terminal. This will be a different port than `npm run dev`.

Note that if you change `env` variables, you will need to rebuild the project before the preview
command will pick up the changes.

```
npm run preview
```
