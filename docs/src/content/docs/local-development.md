---
title: Local development
description: Run the Ravnar backend and the React frontend on your laptop, with or without Keycloak.
---

Both halves run outside Kubernetes. The usual loop is: start the backend on port 8000, point the
frontend's dev server at it, and disable auth so you do not need a Keycloak.

## Prerequisites

- Python ≥ 3.11 and [uv](https://docs.astral.sh/uv/) for the backend.
- Node.js (the frontend builds on Node 22+; CI uses 24) and npm.
- An API key for whichever model provider your agents use — `OPENROUTER_API_KEY` for the demo
  agents in `backend/config.yml`.

## Backend

`ravnar serve` reads `config.yml` from the working directory. That file is gitignored — a fresh
clone has none, and without one Ravnar boots with only its `default` placeholder agent. So write
one first:

```yaml
# backend/config.yml
agents:
  static:
    claude:
      cls_or_fn: ravnar.agents.PydanticAiAgentWrapper
      params:
        agent:
          cls_or_fn: pydantic_ai.Agent
          params:
            model:
              cls_or_fn: pydantic_ai.models.openrouter.OpenRouterModel
              params:
                model_name: anthropic/claude-sonnet-4.6
                provider:
                  cls_or_fn: pydantic_ai.providers.openrouter.OpenRouterProvider
                  params:
                    api_key: "{{ OPENROUTER_API_KEY }}"
        capabilities:
          identity:
            name: "Chat Agent (Claude Sonnet 4.6)"
            provider: "Anthropic"
            description: "General-purpose chat agent."
```

Because it is gitignored, secrets you inline there never reach the repository — but prefer the
`{{ VAR }}` placeholders anyway, so the same file works in front of any environment. See
[Agents & models](/agents/) for the full shape.

```bash
cd backend
uv sync                                  # install deps + dev groups
export OPENROUTER_API_KEY=sk-or-...      # resolves the {{ OPENROUTER_API_KEY }} placeholder
uv run ravnar serve                      # reads ./config.yml, serves on 127.0.0.1:8000
```

Check it is alive:

```bash
uv run ravnar health
curl http://localhost:8000/health
curl http://localhost:8000/api/agents
```

Local state — the SQLite database and uploaded files — lands in `backend/.ravnar_local/`
(override with `RAVNAR_LOCAL_STORAGE`). Delete that directory to start from a clean history.

Any config field can also be set from the environment with the `RAVNAR_` prefix and `__` for
nesting, which is handy for one-off overrides:

```bash
RAVNAR_SERVER__PORT=9000 uv run ravnar serve
```

### Quality gate

```bash
uv run ruff check          # lint
uv run ruff format         # format
uv run mypy src            # type check
uv run pre-commit run --all-files
```

## Frontend

```bash
cd frontend
npm install
cp .env.example .env       # VITE_API_URL=http://localhost:8000, VITE_AUTH_ENABLED=false
npm run dev
```

Vite proxies `/api` to `VITE_API_URL`, so the browser talks to your local Ravnar without CORS.
Open the URL Vite prints.

Two knobs, and they live in different places on purpose:

| Setting | Where | Why |
| --- | --- | --- |
| `VITE_API_URL`, `VITE_AUTH_ENABLED` | `frontend/.env` | Build-time. `VITE_AUTH_ENABLED=false` skips `keycloak-js` entirely — no login, no token on requests. |
| Keycloak connection + branding | `frontend/public/config.json` | Runtime. Fetched before React mounts, so it can be replaced in a deployed image. See [Branding & configuration](/branding/). |

To develop against a real Keycloak, set `VITE_AUTH_ENABLED=true` and fill in
`public/config.json` with the realm's `url`, `realm`, and the SPA `clientId` — and make sure that
client permits your dev origin as a valid redirect URI.

### Quality gate

```bash
npm run build       # tsc -b && vite build
npm run ci          # biome ci — lint + format, what CI runs
npm run check:fix   # biome check --write
npm run test        # Vitest unit tests
```

### End-to-end and accessibility tests

Playwright is the primary test strategy; Vitest covers pure functions. The e2e suite boots its
own Vite dev server with auth disabled and mocks every `/api/*` request, so **no backend or
Keycloak is required**.

```bash
npx playwright install       # once — browser binaries
npm run test:e2e             # Chromium, Firefox & WebKit, including a11y assertions
npm run test:a11y            # only the accessibility specs
npx playwright show-report   # open the HTML report from the last run
```

Accessibility assertions run inline with [`@axe-core/playwright`](https://github.com/dequelabs/axe-core-npm)
and fail on critical or serious WCAG violations.

## Running the containers

Same images as production, no cluster:

```bash
# Backend
docker build -t nebari-chat-backend backend/
docker run -p 8000:8000 \
  -e OPENROUTER_API_KEY=sk-or-... \
  nebari-chat-backend

# Frontend
docker build -t nebari-chat-frontend frontend/
docker run -p 8080:8080 \
  -e API_URL=http://host.docker.internal:8000 \
  -e KEYCLOAK_URL=https://keycloak.example.com \
  -e KEYCLOAK_REALM=nebari \
  -e KEYCLOAK_CLIENT_ID=nebari-chat \
  nebari-chat-frontend
```

The frontend container renders `nginx.conf` from `API_URL` at startup and generates
`/config.json` from the `KEYCLOAK_*` and `BRANDING_*` environment variables, then serves the SPA
on port 8080 as a non-root user. Mount a complete `config.json` instead when you need full theme
control — see [Branding & configuration](/branding/#standalone-non-kubernetes).

The backend image bakes `/etc/ravnar/config.yml` with only `server.hostname: 0.0.0.0` and no
agents, so a bare `docker run` gives you Ravnar's `default` placeholder agent. Mount your own
config to get real ones:

```bash
docker run -p 8000:8000 \
  -e OPENROUTER_API_KEY=sk-or-... \
  -e RAVNAR_CONFIG=/etc/ravnar/my-config.yml \
  -v "$PWD/backend/config.yml:/etc/ravnar/my-config.yml:ro" \
  nebari-chat-backend
```

## Working on the docs site

The documentation you are reading is an [Astro](https://astro.build) +
[Starlight](https://starlight.astro.build) site under `docs/`:

```bash
cd docs
npm install
npm run dev          # hot-reloading dev server on http://localhost:4321/
npm run build        # static output in docs/dist/
npm test             # Vitest unit tests for the base-link plugin
npm run typecheck    # astro check
bash ../scripts/check-links.sh   # build + verify every internal link resolves
```

Pages are `.md`/`.mdx` files in `docs/src/content/docs/`; the sidebar is configured in
`docs/astro.config.mjs`. Diagrams are Mermaid code fences, rendered to inline SVG at build time
(which needs Playwright's Chromium: `npx playwright install chromium`).

Production builds run with `BASE=/chat-pack/`, so check links the same way before pushing:
`BASE=/chat-pack/ bash ../scripts/check-links.sh`.

## Troubleshooting

- **Frontend loads but `/api/*` 404s or hangs** — `VITE_API_URL` does not point at a running
  Ravnar. Confirm with `curl $VITE_API_URL/health`.
- **"Storage Not Enabled" screen** — the backend booted with `storage.enabled: false`; the UI
  requires thread storage.
- **"Insufficient Permissions" screen** — the authenticated user lacks `threads:read`,
  `threads:write`, `threads:delete`, or `agents:read`. With auth disabled locally Ravnar grants
  the full set, so this points at a custom authenticator.
- **Only a `default` agent in the picker** — no `config.yml` was found. Create
  `backend/config.yml`, run `ravnar serve` from that directory, or point `RAVNAR_CONFIG` at your
  file.
- **Login redirect loops with auth enabled** — the SPA client in `public/config.json` does not
  allow your dev origin as a redirect URI.
