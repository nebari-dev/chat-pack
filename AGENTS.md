# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

## Overview

Nebari Chat Pack is a drop-in chat application for [Nebari](https://www.nebari.dev/). It is a **monorepo with three deployable parts**:

- `frontend/` — React + Vite chat UI, authenticates via Keycloak. Image: `quay.io/nebari/nebari-chat-frontend`.
- `backend/` — A thin extension of [Ravnar](https://github.com/nebari-dev/ravnar) (an agent server that speaks the [AG-UI](https://docs.ag-ui.com/introduction) protocol plus thread-history endpoints). Image: `quay.io/nebari/nebari-chat-backend`.
- `helm/nebari-chat/` — Umbrella Helm chart that deploys the frontend and pulls in the upstream `ravnar` chart for the backend, wiring both into Nebari's Keycloak for SSO.

The frontend is just an AG-UI client; the backend is just Ravnar with a Keycloak authenticator and a set of agents declared in `config.yml`. Most "add a feature" work lands in one of those two seams.

## Frontend (`frontend/`)

React 19 + TypeScript + Vite, TanStack Router (file-based) + TanStack Query, shadcn/ui (new-york style) + Tailwind v4, Biome for lint/format.

### Commands (run from `frontend/`)

```sh
npm run dev          # Vite dev server (proxies /api → VITE_API_URL)
npm run build        # tsc -b && vite build → ./dist
npm run preview      # serve the production build
npm run check        # biome check (lint + format, no writes)
npm run check:fix    # biome check --write
npm run ci           # biome ci — what CI runs alongside the build
```

There is no test runner configured. CI (`.github/workflows/ci.yml`) runs `npm run build` then `npm run ci`.

### Layered architecture

Data flows through clearly separated layers — keep new code in the matching layer:

- `src/api/` — raw `fetch` wrappers returning typed results. Defines core types like `Thread`, `AgentConfig`. SSE streaming for chat runs is parsed by `src/lib/sse.ts` (`SSEParserStream`, a spec-compliant `TransformStream`).
- `src/queries/` — TanStack Query mutation/query factories built on top of `api/`.
- `src/context/` — React contexts (`AppConfigContext` for available agents, `ChatConfigContext` for the current thread/agent/detail) plus `permissions`. Consumed via hooks like `useAgents()`, `useChatConfig()` that throw if used outside their provider.
- `src/routes/` — TanStack Router routes. `_authenticated.tsx` is the auth-guarded layout; routes under `_authenticated/` require login.
- Feature folders: `src/chat/`, `src/home/`, `src/sidebar/`, `src/history/` hold the UI for each area.

**Generated files — never hand-edit:** `src/routeTree.gen.ts` (TanStack Router plugin) and `src/components/ui/*` (shadcn). Biome is configured to ignore all of these.

### Conventions

- Path alias `@/` → `src/`. Use `@/module/thing` only to reach **outside** the current file's directory subtree; use relative paths (`./header`, `./hooks`) for same-directory or child imports. Never use parent-relative imports (`../`, `../../`) — the repo has none.
- Single quotes, space indent (enforced by Biome). `organizeImports` is on, so Biome groups imports (external / `@/` / relative) — leave its layout alone.
- `noNonNullAssertion` is off — `!` is permitted where the invariant is local and obvious (e.g. `document.getElementById('root')!`).
- Files prefixed with the OpenTeams copyright banner (see any existing file).
- Feature-folder files use lowercase single-word names (`assistantmessage.tsx`, `pagenav.tsx`); barrels (`index.ts`) exist per layer (`api/`, `queries/`, `context/`, `auth/`), not per component. Match the local folder's pattern rather than renaming.
- **Tailwind v4** via `@tailwindcss/vite` — there is no `tailwind.config.*`; configuration lives in `src/main.css`.
- **shadcn/ui** (new-york style) components in `src/components/ui/` are vendored — add new ones with `npx shadcn add <component>` and don't hand-edit them (Biome ignores `src/components/ui/*`).
- **Zod** schemas describe payloads coming from the AG-UI/Ravnar backend; parse at the API boundary (`src/api/`) rather than re-validating downstream.
- Components do one thing and stay small. Prefer hooks/queries for server data over prop-drilling, give each component its own file, hoist event handlers and non-trivial JSX (ternaries, `.map()`s) to named `const`s in the component body, and comment the *why* behind non-obvious choices.
- Auth: `keycloak-js`, configured at **runtime** from `public/keycloak-config.json` (not build-time). Set `VITE_AUTH_ENABLED=false` in `.env` to bypass auth locally. Copy `.env.example` → `.env` and set `VITE_API_URL` to your Ravnar backend.

## Backend (`backend/`)

Python ≥3.11, managed with **uv**. The package `ravnar_nebari_chat` (under `src/`) extends Ravnar; it is not a standalone server. Ravnar provides the CLI (`ravnar serve`) and the AG-UI/thread-history endpoints.

### Commands (run from `backend/`)

```sh
uv sync                  # install deps + dev groups
uv run ravnar serve      # run the agent server (reads config.yml)
uv run ravnar health     # health check
uv run ruff check        # lint
uv run ruff format       # format
uv run mypy src          # type check
uv run pre-commit run --all-files
```

`uv-dynamic-versioning` derives the package version from git tags; `_version.py` is generated at build time.

### How agents and auth wire together

- **`config.yml`** is the heart of the backend. It declares agents under `agents.static.*`, each pointing at a `cls_or_fn` (a Ravnar/pydantic-ai constructor or a factory in this package) with nested `params`. `agents.dynamic.enabled` allows user-defined agents at runtime. Models are wired through OpenRouter using a `{{ OPENROUTER_API_KEY }}` template placeholder resolved from the environment.
- **`src/ravnar_nebari_chat/_authenticators.py`** — `keycloak_authenticator()` builds a Ravnar `BearerTokenAuthenticator` backed by an OIDC validator pointed at a Keycloak realm.
- **`src/ravnar_nebari_chat/demo_agents/`** — example agent factories (e.g. `make_austin_permits_agent`) referenced by `config.yml`. They attach a system prompt plus tools from `demo_agents/_tools/` (`add_database_tools`, `add_visualization_tools`).

To add an agent: write a factory under `demo_agents/` (or your own module), then reference it by dotted path in `config.yml` under `agents.static`. In a deployment, agents can also be mounted as plugins under `RAVNARPATH`.

### Docker

The backend image (`backend/Dockerfile`) is a multi-stage uv build running as user `nebari`, with `RAVNARPATH=/var/ravnar/plugins` and a baked-in `config-docker.yml` at `/etc/ravnar/config.yml`. Entrypoint is `ravnar serve`.

## Helm (`helm/nebari-chat/`)

Umbrella chart depending on the upstream `ravnar` chart (`Chart.yaml` → `oci://quay.io/nebari/charts`). Top-level values bridge both services: `keycloak.url`/`keycloak.realm`, `frontend.nebariapp.hostname`, `backend.nebariapp.hostname`, `frontend.enabled`, and `config.inline` (Ravnar config merged into the backend's `config.yml`). `Chart.yaml` `version`/`appVersion` are placeholders set by CI at release time. See `values.yaml` and `values.schema.json`.

## Release process

Images and chart are released by pushing git tags (handled by `.github/workflows/docker.yml` and `helm.yml`):

- `v$SEMVER` (e.g. `v1.2.3`) → builds & publishes frontend + backend images.
- `chart/v$SEMVER` (e.g. `chart/v1.2.3`) → publishes the Helm chart.

**Do not push app and chart tags at the same time** — each triggers an independent release, and if the chart tag arrives first it may reference the previous app version. `tag-cleanup.yml` prunes PR/branch image tags on merge.
