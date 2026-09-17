---
title: Helm values
description: Every value the nebari-chat chart accepts, including the ones that pass through to the ravnar subchart.
---

`nebari-chat` is an umbrella chart: it renders the frontend itself and pulls in the upstream
[`ravnar`](https://github.com/nebari-dev/ravnar) chart for the backend. Values therefore live in
three places — top-level values that bridge both halves, `frontend.*` for the UI, and `ravnar.*`
for everything the subchart owns.

```bash
helm show values oci://quay.io/nebari/charts/nebari-chat
helm show values oci://quay.io/nebari/charts/ravnar --version 0.0.11   # the subchart
```

## Required values

The chart refuses to render without these three:

| Value | Purpose |
| --- | --- |
| `keycloak.url` | Keycloak base URL. Used by the backend authenticator (issuer) and served to the browser in `/config.json`. |
| `frontend.nebariapp.hostname` | Public hostname for the chat UI. |
| `backend.nebariapp.hostname` | Public hostname for the Ravnar API. |

## Shared values

| Value | Default | Purpose |
| --- | --- | --- |
| `keycloak.url` | `""` | See above. Required. |
| `keycloak.realm` | `nebari` | Realm for both halves. |
| `keycloak.clientId` | `""` | The SPA client id the browser uses. Empty derives `<namespace>-<frontend-component-name>-spa`, which matches the client the nebari-operator provisions from `frontend.nebariapp.auth.spaClient`. |
| `config.inline` | `{}` | Backend Ravnar config, merged into the rendered `config.yml`. See [Backend config](#backend-config). |
| `nameOverride` / `fullnameOverride` | `""` | Standard Helm name overrides. |

## Backend config

`config.inline` is deep-merged with the chart's own `config.yaml` (which contributes
`security.authenticator`) and written to a ConfigMap mounted at `/var/ravnar/helm/config.yaml`.
`config.inline` wins on conflict, so you can override the authenticator too.

```yaml
config:
  inline:
    agents:
      static:
        support:
          cls_or_fn: my_agents.support.make_support_agent
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
                        api_key: '{{ "{{ OPENROUTER_API_KEY }}" }}'
    storage:
      enabled: true
```

Two things to know:

- **Declare your agents here.** No agent declarations ship in the image; with no `config.inline`
  you get Ravnar's `default` placeholder agent. See [Agents & models](/agents/).
- **Escape Ravnar's `{{ VAR }}` placeholders.** Every string in `config.inline` is passed through
  Helm's `tpl`, so write `'{{ "{{ OPENROUTER_API_KEY }}" }}'` to emit a literal
  `{{ OPENROUTER_API_KEY }}`.

## Frontend values

| Value | Default | Purpose |
| --- | --- | --- |
| `frontend.enabled` | `true` | Set `false` to deploy the backend only (no Deployment, Service, ConfigMap, or `NebariApp` for the UI). |
| `frontend.replicaCount` | `1` | Frontend replicas. |
| `frontend.image.repository` | `quay.io/nebari/nebari-chat-frontend` | UI image. |
| `frontend.image.tag` | `""` | Defaults to the chart's `appVersion`. |
| `frontend.image.pullPolicy` | `IfNotPresent` | |
| `frontend.service.type` | `ClusterIP` | |
| `frontend.service.port` | `80` | Service port; the `NebariApp` routes to it. |
| `frontend.service.targetPort` | `8080` | Container port nginx listens on. |
| `frontend.api.url` | `""` | Backend base URL nginx proxies `/api/` to. Empty derives the in-cluster Ravnar Service URL. |
| `frontend.resources` | 500m CPU / 512Mi, limits = requests | Container resources. |
| `frontend.securityContext.pod` | `runAsUser`/`runAsGroup`/`fsGroup` 1000, `runAsNonRoot: true` | |
| `frontend.securityContext.container` | `allowPrivilegeEscalation: false` | |
| `frontend.podAnnotations` / `frontend.podLabels` | `{}` | Extra pod metadata. |
| `frontend.branding.*` | empty | Title, logos, favicon, and theme tokens rendered into `/config.json`. Full reference in [Branding & configuration](/branding/). |
| `frontend.agentAuthoring.models` | `[]` | Models offered in the agent authoring form, as `[{ id, label? }]`. Each `id` must also be in `ravnar.extraEnv.NEBARI_CHAT_AGENT_MODELS`; the render fails on a mismatch when that variable is a literal `value`. Empty disables creation. See [Dynamic agents](/agents/#dynamic-agents). |
| `frontend.agentAuthoring.mcp.enabled` | `false` | Let users enter a custom MCP server URL in the authoring form. Pair with `ravnar.extraEnv.NEBARI_CHAT_MCP_ALLOWED_HOSTS`. Catalog servers are offered regardless. |

The authoring form's tool, database and MCP server pickers are derived from `backend.catalog`
(below) at render time, so there is one source of truth for them.

## Capability catalog (`backend.catalog`)

| Value | Default | Purpose |
| --- | --- | --- |
| `backend.catalog` | `{}` | The [capability catalog](/agents/#the-capability-catalog): `tools` (visualization or read-only `sql` with a `database_url`) and `mcp_servers` (URL, `auth`, `tool_prefix`) keyed by slug. Rendered verbatim into the `<release>-backend-catalog` ConfigMap and mounted at `/etc/nebari-chat/catalog.yaml` through the default `ravnar.extraVolumes` / `extraVolumeMounts`. Ravnar-style `{{ VAR }}` placeholders are left for the backend to resolve, so no Helm escaping is needed. |

If you set `ravnar.extraVolumes` or `ravnar.extraVolumeMounts` yourself, lists replace rather than
merge: copy the `nebari-chat-catalog` entries from the chart's `values.yaml` into yours.

`frontend.keycloak.*` (`authServerUrl`, `realm`, `resource`) exists in `values.yaml` but the
browser's Keycloak settings are rendered from the top-level `keycloak.*` values — set those.

## Routing and authentication (`NebariApp`)

Each half gets a `NebariApp` (`reconcilers.nebari.dev/v1`), which the nebari-operator turns into
an HTTPRoute, a certificate, Keycloak clients, and — for the frontend — a landing-page tile.

| Value | Default | Purpose |
| --- | --- | --- |
| `frontend.nebariapp.hostname` | `""` | Public hostname for the UI. Required. |
| `backend.nebariapp.hostname` | `""` | Public hostname for the API. Required. |
| `frontend.nebariapp.routing.routes` | `[{pathPrefix: /, pathType: PathPrefix}]` | Route rules. |
| `backend.nebariapp.routing.routes` | `[{pathPrefix: /, pathType: PathPrefix}]` | Route rules. |
| `frontend.nebariapp.auth.enabled` | `true` | Provision OIDC for the UI. |
| `frontend.nebariapp.auth.provider` | `keycloak` | |
| `frontend.nebariapp.auth.provisionClient` | `true` | Let the operator create the OIDC client. |
| `frontend.nebariapp.auth.enforceAtGateway` | `false` | The SPA logs in itself with `keycloak-js`; the gateway does not intercept. See [Architecture & auth](/architecture/#authentication). |
| `frontend.nebariapp.auth.spaClient.enabled` | `true` | Provision the public SPA client the browser uses. |
| `frontend.nebariapp.auth.redirectURI` | `/*` | OAuth2 callback path. |
| `frontend.nebariapp.auth.scopes` | `[openid, profile, email]` | |
| `frontend.nebariapp.landingPage.enabled` | `true` | Show a tile on the Nebari landing page. |
| `frontend.nebariapp.landingPage.displayName` | `Chat` | Tile title. |
| `frontend.nebariapp.landingPage.description` | `Chat with AI models` | Tile subtitle. |
| `frontend.nebariapp.landingPage.category` | `AI` | Tile grouping. |
| `frontend.nebariapp.landingPage.priority` | `1` | Sort order — lower is higher. |
| `frontend.nebariapp.landingPage.healthCheck.enabled` | `true` | Health-check the tile. |
| `frontend.nebariapp.landingPage.healthCheck.path` | `/health` | Path probed for the tile's status. The container's own probes use `/healthz`. |

The helper template also passes through `groups`, `issuerURL`, `clientSecretRef`,
`forwardAccessToken`, `denyRedirect`, `deviceFlowClient`, `keycloakConfig`, `tokenExchange`,
`serviceAccountName`, and `gateway` when you set them under `*.nebariapp` — consult the
nebari-operator's `NebariApp` reference for their semantics.

The chart also renders the release **Namespace** with `nebari.dev/managed=true`, which is what
makes the operator reconcile these resources at all. See
[Prepare the namespace](/getting-started/#prepare-the-namespace).

## Backend values (`ravnar.*`)

These pass straight through to the `ravnar` subchart (pinned to `0.0.11` in `Chart.yaml`). The
umbrella chart sets a few of them for you:

| Value | Set by this chart | Purpose |
| --- | --- | --- |
| `ravnar.image.repository` | `quay.io/nebari/nebari-chat-backend` | The pack's backend image, not stock Ravnar. |
| `ravnar.image.tag` | chart `appVersion` at release time | Backend image tag. |
| `ravnar.config.existingConfigMap.name` | `{{ .Release.Name }}-backend` | Points Ravnar at the ConfigMap rendered from `config.inline`. Do not repoint this. |
| `ravnar.ingress.enabled` | `false` | Routing comes from the `NebariApp`, not an Ingress. |

The ones you are most likely to set yourself:

| Value | Default | Purpose |
| --- | --- | --- |
| `ravnar.extraEnv` | `{}` | Extra environment for the backend, as `NAME: {value: ...}` or `NAME: {valueFrom: {secretKeyRef: {...}}}`. This is where model API keys belong. |
| `ravnar.replicaCount` | `1` | Backend replicas. |
| `ravnar.resources` | 500m CPU / 512Mi, limits = requests | Backend resources. |
| `ravnar.service.port` / `targetPort` | `80` / `8000` | Service and container port. |
| `ravnar.persistentFileStorage.enabled` | `true` | PVC for uploaded files, mounted at `/var/ravnar/files`. |
| `ravnar.persistentFileStorage.storage` | `8Gi` | PVC size. |
| `ravnar.postgres.enabled` | `true` | Deploy the bundled PostgreSQL StatefulSet. Set `false` to bring your own database and set the DSN yourself. |
| `ravnar.postgres.storage` | `1Gi` | Database PVC size. |
| `ravnar.postgres.password` | `{}` | Empty generates a random password and persists it. Supply `{value: ...}` or `{valueFrom: {...}}` to control it. |
| `ravnar.extraVolumes` / `ravnar.extraVolumeMounts` | `[]` | Mount extra content into the backend — e.g. agent plugin modules under `RAVNARPATH`, or a private CA bundle. |
| `ravnar.securityContext.container.readOnlyRootFilesystem` | `true` | |

Optional variables that configure [agent authoring](/agents/#dynamic-agents) belong in
`ravnar.extraEnv` too, and take effect only with `config.inline.agents.dynamic.enabled: true`:
`NEBARI_CHAT_AGENT_MODELS` (comma-separated model ids users may pick),
`NEBARI_CHAT_MCP_ALLOWED_HOSTS` (comma-separated hostnames a *custom* MCP server URL may target, or
`*`), `NEBARI_CHAT_CATALOG` (catalog path; defaults to where the chart mounts `backend.catalog`), and
the three `NEBARI_CHAT_MCP_IMPERSONATION_{ISSUER,CLIENT_ID,CLIENT_SECRET}` values required by
catalog MCP servers with `auth: impersonate`. Secrets referenced by the catalog's `{{ VAR }}`
placeholders go here as well.

Some environment variables are reserved by the subchart and will fail the render if you set them
in `extraEnv`: `RAVNAR_CONFIG`, `RAVNAR_LOCAL_STORAGE`, `RAVNAR_STORAGE__FILE_STORAGE__PATH`
(when persistent file storage is on), and the `POSTGRES_*` / `RAVNAR_STORAGE__DATABASE__DSN` set
(when the bundled PostgreSQL is on). Configure those through `config.inline` or by disabling the
feature instead.

## A complete example

```yaml
keycloak:
  url: https://keycloak.example.com
  realm: nebari

config:
  inline:
    agents:
      dynamic:
        enabled: true

frontend:
  nebariapp:
    hostname: chat.example.com
    landingPage:
      displayName: Ask ACME
      description: Chat with ACME's internal agents
  branding:
    title: ACME Chat
    logoUrl: https://cdn.acme.com/logo.svg
    theme:
      light:
        bgBrandDefault: "#0066cc"
  agentAuthoring:
    models:
      - id: anthropic/claude-sonnet-4.6
        label: Claude Sonnet 4.6

backend:
  nebariapp:
    hostname: chat-api.example.com
  catalog:
    tools:
      charts:
        kind: visualization
        label: Charts and maps
    mcp_servers:
      frames:
        label: Frames
        url: https://frames.internal/mcp
        tool_prefix: frames

ravnar:
  extraEnv:
    OPENROUTER_API_KEY:
      valueFrom:
        secretKeyRef:
          name: openrouter
          key: api-key
    NEBARI_CHAT_AGENT_MODELS:
      value: anthropic/claude-sonnet-4.6
  persistentFileStorage:
    storage: 32Gi
  resources:
    limits:
      cpu: "2"
      memory: 4Gi
    requests:
      cpu: "1"
      memory: 2Gi

config:
  inline:
    agents:
      static:
        support:
          cls_or_fn: my_agents.support.make_support_agent
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
                        api_key: '{{ "{{ OPENROUTER_API_KEY }}" }}'
            capabilities:
              identity:
                name: ACME Support
                provider: Anthropic
                description: Answers questions about ACME products.
```

Render it before you apply it:

```bash
helm template chat oci://quay.io/nebari/charts/nebari-chat -n chat -f values.yaml
```
