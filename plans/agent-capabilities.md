# Agent capabilities: tools, MCP servers and data in the authoring UI

## Context

The agent authoring stack (see `plans/agent-authoring.md`) lets a user create an agent from a
name, instructions, a model, quick prompts and at most one MCP server URL. Everything else an
agent can do today is wired by hand in Python: the demo agents attach SQL tools bound to a
database URL and chart/map tools inside a factory that an operator references from `config.yml`.

This plan extends authoring so a user can give an agent **capabilities** from the UI: built-in
tools, one or more MCP servers, and data sources (databases now, uploaded files later). It keeps
the property the current design depends on: the browser only ever *selects* from things an
operator has approved, and the pack factory resolves each selection server-side. The browser
never names a Python callable and never carries a secret.

### Constraints verified in the code

- **The pack cannot add API routes.** Ravnar's `_make_app` is closed and the pack is a plugin, so
  there is no `GET /api/catalog`. Anything the UI needs to list must travel through the frontend's
  runtime `config.json`, the same way `agentAuthoring.models` does today.
- **Ravnar's `Config` forbids unknown keys**, so an operator catalog cannot live in `config.inline`.
  It has to be a pack-owned file mounted into the backend and named by an env var, like the model
  allowlist is today.
- **Pack code sees only `User(id, data, permissions)`** (`_ravnar/security.py:137`). The user's
  bearer token is not retained and the factory has no handle on Ravnar's file storage or database.
  Per-user access to an MCP server therefore needs OIDC token exchange performed by a service
  client (the `ravnar_nebari_mcp.OIDCImpersonator` prototype), not token forwarding.
- **`ravnar_nebari_mcp` is stale.** It references `pydantic_ai.mcp.MCPToolset`, which does not
  exist in pydantic-ai 1.91.0, and fails mypy today. pydantic-ai's HTTP MCP client takes static
  `headers` or a custom `http_client`, plus a `process_tool_call` hook with the run context
  (`pydantic_ai/mcp.py:1045-1104`, `:614`). Per-user auth means a per-run `http_client` or an
  `httpx.Auth` that fetches the exchanged token.
- **Tool discovery runs inside `POST /api/agents`.** Each MCP server adds a connection at
  registration time; failures already degrade to `setupError` rather than blocking.
- **Dynamic agents are in memory.** Attached data (file ids) outlives the agent that references it.

## Design

### Operator catalog (backend)

A YAML file the operator mounts via `ravnar.extraVolumes`, named by `NEBARI_CHAT_CATALOG`
(default `/etc/nebari-chat/catalog.yaml`). Parsed once at import into pydantic models in a new
`backend/src/ravnar_nebari_chat/catalog.py`:

```yaml
tools:
  charts:
    kind: visualization            # add_visualization_tools()
    label: Charts and maps
  austin-permits-db:
    kind: sql                      # add_database_tools(), read-only
    label: Austin permits database
    database_url: "{{ AUSTIN_DB_URL }}"   # rendered from the backend env, never sent to the UI
mcp_servers:
  frames:
    label: Frames
    url: https://frames.internal/mcp
    auth: impersonate              # none | impersonate (OIDC token exchange as the user)
    tool_prefix: frames
allow_raw_mcp_urls: false          # when true, NEBARI_CHAT_MCP_ALLOWED_HOSTS still applies
```

`{{ VAR }}` placeholders are rendered with the same sandboxed Jinja Ravnar uses, against the
full process environment (this file is operator-owned, unlike a registration payload). The
catalog is the single source of truth; Helm renders the UI-facing subset (keys, labels, kinds)
from the same value.

### Factory params (backend)

`make_chat_agent` gains three optional, catalog-validated params. Unknown keys are 422 with a
readable detail, like models are today.

| Param | Shape | Resolution |
| --- | --- | --- |
| `tools` | `["charts", "austin-permits-db"]` | Each key maps to a catalog tool; `visualization` → `add_visualization_tools`, `sql` → `add_database_tools` with the catalog DSN. |
| `mcp_servers` | `[{"server": "frames"}, {"url": "https://…"}]` | `server` picks a registry entry (URL, auth, prefix from the catalog). `url` is accepted only when `allow_raw_mcp_urls` is true and the host passes `NEBARI_CHAT_MCP_ALLOWED_HOSTS`. Replaces the single `mcp_url`, which stays accepted as `[{"url": …}]` for compatibility. |
| `data_sources` | `[{"database": "austin-permits-db"}, {"file": "<fileId>"}]` | `database` is sugar for the SQL tool of that catalog entry. `file` is deferred (see Files). |

Each MCP entry becomes one `MCPServerStreamableHTTP` toolset with the registry's `tool_prefix` so
two servers cannot collide on tool names. `auth: impersonate` wraps it with a ported
`ImpersonatingMCPToolset` that performs token exchange for `user.id` and supplies the token
through a per-run `http_client`.

Metadata read-back bumps `nebariChat.version` to 2 and records `tools`, `mcpServers` and
`dataSources` under `definition`. The frontend parser already rejects unknown versions, so v1
readers of a v2 agent fall back to "not editable" until the UI branch below lands.

### Frontend

Runtime `config.json` gains the UI-facing catalog:

```json
"agentAuthoring": {
  "models": [...],
  "tools": [{ "id": "charts", "label": "Charts and maps", "kind": "visualization" }],
  "mcpServers": [{ "id": "frames", "label": "Frames", "auth": "impersonate" }],
  "databases": [{ "id": "austin-permits-db", "label": "Austin permits database" }],
  "mcp": { "enabled": true, "allowRawUrls": false }
}
```

Form changes (all in `frontend/src/agents/`, following the quick-prompt row pattern):

- **Tools**: a checkbox group over `tools`; each shows its label and kind.
- **MCP servers**: repeatable rows. Each row is a select over the registry plus, when
  `allowRawUrls`, an "Other URL" option that reveals a URL input. Rows show the auth mode so users
  understand a server will act as them.
- **Data**: a checkbox group over `databases`. The file dropzone waits for the Files phase.
- The table gains a **Capabilities** column summarizing counts, and the Status tooltip lists
  per-server setup errors when the backend records more than one.

`api/agents.ts` extends `AgentDefinitionSchema` and the wire builder; `DynamicAgentMetadataSchema`
accepts version 2 with the new definition fields. Client-side tools need nothing: they remain
per-browser toggles that any agent receives at run time.

### Helm and docs

- `frontend.agentAuthoring.{tools,mcpServers,databases}` and `agentAuthoring.mcp.allowRawUrls`
  rendered into `config.json`.
- A new `backend.catalog` value rendered into a ConfigMap and mounted at
  `/etc/nebari-chat/catalog.yaml` via `ravnar.extraVolumes`/`extraVolumeMounts`, with
  `NEBARI_CHAT_CATALOG` set in `ravnar.extraEnv`. The frontend lists are derived from
  `backend.catalog` at render time, so there is one source of truth and no drift guard needed.
- `docs/src/content/docs/agents.md` "Dynamic agents" gains a Capabilities subsection and a
  catalog reference; `helm-values.md` documents `backend.catalog`.

### Files (deferred)

Uploads already work end to end (`/api/files`, Postgres metadata, PVC or object storage). What is
missing is a way for a tool to *read* them: pack code has neither the storage handle nor the
user's token. Two honest options, neither ready today:

1. **Upstream hook**: Ravnar passes its `Database`/file storage into agent deps alongside `User`,
   so a `read_document` tool can fetch by id with the user's permissions. Preferred.
2. **Inline at authoring time**: the UI reads small files and stores their text in the
   instructions. Works now, but caps size and duplicates content into every agent.

Vector search is a separate decision (embedding provider, index storage) and is out of scope.

## Delivery

Stacked branches on top of `feat/agent-authoring-helm-docs`, no PRs until reviewed:

| Branch | Contents |
| --- | --- |
| `feat/agent-capabilities-plan` | this document |
| `feat/agent-capabilities-catalog` | `catalog.py`, catalog loading, `tools` param with `visualization` and `sql` kinds, `mcp_servers` with registry entries and prefixes, metadata v2, tests |
| `feat/agent-capabilities-mcp-auth` | port `ravnar_nebari_mcp` to pydantic-ai 1.91, `auth: impersonate`, tests with a fake token endpoint |
| `feat/agent-capabilities-ui` | runtime config parsing, form sections, table column, e2e |
| `feat/agent-capabilities-helm-docs` | `backend.catalog`, ConfigMap and mounts, derived frontend lists, docs |

## Verification

1. Backend: pytest covers catalog parsing (placeholders, unknown kinds, bad DSN), each param's
   422 paths, prefixing of two MCP servers, and an integration test registering an agent with a
   catalog tool through Ravnar's real endpoint. `ruff`, `mypy src/ravnar_nebari_chat`.
2. Frontend: unit tests for the v2 metadata parser and wire builder; e2e for each form section
   against the stateful mock, including a registry MCP row and a raw URL row when allowed.
3. Helm: `helm template` shows the catalog ConfigMap, mounts and env, and a `config.json` whose
   lists match the catalog; `helm lint` with the CI values.
4. Manual: local backend with a catalog naming the Austin permits database; author an agent with
   the SQL tool and charts, run a query, see a chart render; add the Frames MCP server and confirm
   its tools appear with the prefix.

## Risks and caveats

- **Registration latency and partial failure** grow with each MCP server. Record a per-server
  `setupError` list rather than one string.
- **Impersonation needs a confidential Keycloak client with token exchange enabled** for each
  target. That is deployment work outside this repo; document it and fail the catalog load with a
  clear message when the client secret env is missing.
- **Every realm user still has `agents:write`**, so every catalog tool and MCP server is available
  to every user. Catalog entries are the operator's trust boundary; document that and consider a
  `groups` allowlist per entry once Ravnar exposes group claims in `User.data`.
- **Raw MCP URLs remain an egress surface**; default `allow_raw_mcp_urls` to false and keep the
  host allowlist.
- **In-memory agents plus persistent files** will leave orphaned uploads. Acceptable until
  persistence lands upstream; the Files phase should reuse Ravnar's existing delete endpoint.
