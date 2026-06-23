# Nebari Chat Pack

A drop-in chat application for [Nebari](https://www.nebari.dev/), with a React frontend and a [Ravnar](https://github.com/nebari-dev/ravnar)-based backend that speaks the [AG-UI](https://docs.ag-ui.com/introduction) protocol.

The pack ships as a Helm chart that deploys both services and wires them into Nebari's Keycloak for SSO.

## Architecture

| Component | Description | Image |
| --- | --- | --- |
| `frontend/` | React + Vite chat UI, authenticates via Keycloak. | `quay.io/nebari/nebari-chat-frontend` |
| `backend/`  | Ravnar agent server with a Keycloak bearer-token authenticator. | `quay.io/nebari/nebari-chat-backend` |
| `helm/nebari-chat/` | Umbrella chart that deploys the frontend and pulls in the [`ravnar`](https://github.com/nebari-dev/ravnar) chart for the backend. | `oci://quay.io/nebari/charts/nebari-chat` |

The backend is a thin extension of Ravnar — bring your own agents by adding them to the image or mounting them as plugins under `RAVNARPATH`. See [`backend/README.md`](backend/README.md) for the Python package and [`frontend/README.md`](frontend/README.md) for the UI.

## Tools

The app ships with a small set of **example tools** that demonstrate the two ways an
agent can call out to do work. They are deliberately minimal starting points — replace
or extend them with the tools your own agents need.

A tool is either **server-side** (defined in Python on the backend, runs on the Ravnar
server when the agent calls it) or **client-side** (defined in TypeScript on the
frontend, runs in the user's browser). Server tools are always advertised by the agent;
client tools are advertised per-browser and can be toggled on or off from the **tools
panel** in the UI.

### Backend (server-side) tools

These are registered on the demo agents with pydantic-ai's `@agent.tool_plain` decorator.
The Austin Permits and SBIR Awards demo agents both use all four. Defined under
[`backend/src/ravnar_nebari_chat/demo_agents/_tools/`](backend/src/ravnar_nebari_chat/demo_agents/_tools/).

| Tool | Parameters | Description |
| --- | --- | --- |
| `get_database_schema` | _none_ | Returns the database schema so the agent can understand the structure before querying. (`_tools/database.py`) |
| `execute_query` | `query` (SQL string) | Runs a read-only SQL query and returns the rows. The database is mounted read-only, so attempts to modify it fail. (`_tools/database.py`) |
| `create_chart` | `config` (Apache ECharts config) | Renders a chart in the UI from a plain-JSON ECharts configuration (no JS callbacks). Surfaced via an ag-ui `ActivitySnapshotEvent` of type `application/json+echart`. (`_tools/visualization.py`) |
| `create_map` | `data` (center `[lat, lon]` + GeoJSON features) | Renders a Leaflet map with markers and popups. Surfaced via an `ActivitySnapshotEvent` of type `application/json+leaflet`. (`_tools/visualization.py`) |

To add a backend tool, decorate a function on your agent — see the database and
visualization factories for the pattern.

### Frontend (client-side) tools

These run in the browser and are listed in the registry at
[`frontend/src/chat/tools/registry.ts`](frontend/src/chat/tools/registry.ts). Each tool
has an ag-ui `definition` (name + JSON-schema parameters) advertised to the agent and an
async `handler` that executes locally. The run loop detects client tool calls, runs the
handler, returns the result to the agent, and resubmits (up to 5 rounds).

| Tool | Parameters | Default | Description |
| --- | --- | --- | --- |
| `get_current_location` | _none_ | enabled | Reads the user's geographic location via the browser Geolocation API. The browser prompts for permission; a denial or unavailable API returns a structured `{ error }` rather than failing the run. Demonstrates a tool that returns data only the client has. (`tools/getcurrentlocation.ts`) |
| `request_user_approval` | `action` (required), `details` (optional) | disabled | A **human-in-the-loop** gate. The agent calls it before taking a consequential action; the run pauses and an approval card appears in the UI. The handler's promise resolves only once the user approves or rejects, returning `{ decision: 'approved' \| 'rejected' }`. Requests are scoped to the thread that triggered them. (`tools/requestapproval.ts`) |

To add a frontend tool, implement a `FrontendTool` and append it to `FRONTEND_TOOLS` in
the registry. Set `defaultEnabled: false` to ship it opt-in.

## Quick start (Helm)

Requires a Kubernetes cluster with [Nebari](https://www.nebari.dev/) (or a compatible Keycloak + ingress setup).

```sh
helm install chat oci://quay.io/nebari/charts/nebari-chat \
  --set keycloak.url=https://keycloak.example.com \
  --set frontend.nebariapp.hostname=chat.example.com \
  --set backend.nebariapp.hostname=chat-api.example.com
```

See [`helm/nebari-chat/values.yaml`](helm/nebari-chat/values.yaml) for the full set of values.

## Configuration

The chart's top-level values:

| Key | Purpose |
| --- | --- |
| `keycloak.url` / `keycloak.realm` | Keycloak server and realm used by both frontend and backend. |
| `frontend.nebariapp.hostname` | Public hostname for the chat UI. |
| `backend.nebariapp.hostname` | Public hostname for the Ravnar API. |
| `frontend.enabled` | Set `false` to deploy only the backend. |
| `config.inline` | Inline Ravnar config merged into the backend's `config.yml`. |
| `ravnar.image.tag` / `frontend.image.tag` | Override image tags (default: chart `appVersion`). |

## Local development

For running the services outside Kubernetes, see:

- [`frontend/README.md`](frontend/README.md) — `npm run dev`, env vars, Keycloak config.
- [`backend/README.md`](backend/README.md) — the `ravnar-nebari-chat` Python package.

## Release process

Docker images for the frontend and backend are published by pushing a `v$SEMVER` tag (e.g. `v1.2.3`). The Helm chart is published by pushing a `chart/v$SEMVER` tag (e.g. `chart/v1.2.3`).

> [!IMPORTANT]
> Do not push the app and chart tags at the same time. Each tag triggers the release workflow independently, and if the chart tag arrives first, the chart may reference the previous app version instead of the newly tagged one.

## License

Apache 2.0 — see [LICENSE](LICENSE).
