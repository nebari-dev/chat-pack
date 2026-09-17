---
title: Agents & models
description: How the backend declares agents in config.yml, what ships as demos, and how to add your own.
---

The backend is [Ravnar](https://github.com/nebari-dev/ravnar) plus a small Python package
(`ravnar_nebari_chat`). Ravnar supplies the server, the AG-UI endpoints, and thread history; the
pack supplies a Keycloak authenticator, demo agent factories, and the tools those agents call.

Which agents exist — and therefore what the UI's picker offers — is a matter of configuration:
declare them in `config.yml`, or [enable dynamic agents](#dynamic-agents) and let users author
them from the UI. No frontend change is ever needed to add one.

## The config file

Ravnar deep-merges YAML from, in increasing precedence: `/etc/ravnar/config.{yml,yaml}`,
`~/.config/ravnar/config.{yml,yaml}`, `./config.{yml,yaml}` in the working directory, and finally
the file named by `$RAVNAR_CONFIG`.

| Where you run | What is read |
| --- | --- |
| Locally (`uv run ravnar serve` in `backend/`) | A `config.yml` you write in `backend/`. It is gitignored, so a fresh clone has none — create it before starting the server. |
| In the container | `/etc/ravnar/config.yml` baked into the image, which contains only `server.hostname: 0.0.0.0`. |
| Under the Helm chart | The baked file, plus `/var/ravnar/helm/config.yaml` via `RAVNAR_CONFIG` — rendered by the chart from `config.inline` and the Keycloak authenticator. |

No agent declarations ship anywhere. The demo agents' *code* is in the image
(`ravnar_nebari_chat.demo_agents`), but every deployment supplies its own declarations — locally
through `backend/config.yml`, on a cluster through `config.inline`. See
[Helm values](/helm-values/#backend-config).

Top-level sections Ravnar understands:

| Section | Purpose |
| --- | --- |
| `server` | `hostname` (default `127.0.0.1`) and `port` (default `8000`). |
| `security` | `authenticator` (see [below](#authentication)) and `cors.allowed_origins` / `cors.allowed_headers`. |
| `storage` | `enabled`, `database.dsn`, and `files.path` — threads, runs, messages, and uploads. |
| `agents` | `static` (declared agents) and `dynamic` (user-defined agents at runtime). |
| `observability` | Logging and OpenTelemetry tracing span processors. |

## How an agent is declared

Every constructible object in `config.yml` uses the same shape: a dotted import path in
`cls_or_fn` and its keyword arguments in `params`. The shape nests, so a model is built inside a
provider is built inside an agent:

```yaml
agents:
  dynamic:
    enabled: true
  static:
    claude:                                     # the agent id used in URLs and the API
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
            description: "A general-purpose chat agent."
```

- **`cls_or_fn`** may be a class *or* a factory function — anything importable that returns a
  Ravnar `Agent`. That is the seam your own agents plug into.
- **`{{ VAR }}`** placeholders are resolved from the backend process environment, so secrets stay
  out of the config. Under Helm they must be escaped — see
  [Install](/getting-started/#install).
- **`capabilities.identity`** is what the UI shows in the agent picker and the home page. Give
  each agent a name a user would recognize.

At least one static agent must be configured, or `agents.dynamic.enabled` must be `true`;
otherwise the server refuses to start. With neither set, Ravnar falls back to a single `default`
placeholder agent that only replies with a canned message.

## The demo agent factories

Two agent factories ship in the package as worked examples of the pattern. Both take a
pydantic-ai `agent` plus a `database_url`, attach a system prompt, and register the database and
visualization tools described in [Tools](/tools/):

| Factory | What the agent does |
| --- | --- |
| `ravnar_nebari_chat.demo_agents._austin_permits.make_austin_permits_agent` | Answers questions about a Postgres database of Austin building permits: reads the schema, writes SQL, then renders the results as charts and maps. |
| `ravnar_nebari_chat.demo_agents._sbir_awards.make_sbir_awards_agent` | The same shape over a database of SBIR awards. |

```yaml
agents:
  static:
    austin-permits:
      cls_or_fn: ravnar_nebari_chat.demo_agents._austin_permits.make_austin_permits_agent
      params:
        agent:
          cls_or_fn: pydantic_ai.Agent
          params:
            name: "Austin Permits Agent"
            model:
              cls_or_fn: pydantic_ai.models.openrouter.OpenRouterModel
              params:
                model_name: anthropic/claude-sonnet-4.6
                provider:
                  cls_or_fn: pydantic_ai.providers.openrouter.OpenRouterProvider
                  params:
                    api_key: "{{ OPENROUTER_API_KEY }}"
        database_url: "postgresql+psycopg://user:pass@host:5432/austin_permits"
```

They are demonstrations, not something to deploy as-is — each needs a database you point it at,
with a role that can only read. Copy the pattern, not the agent.

## Adding your own agent

An agent factory takes whatever params you declare and returns a Ravnar `Agent`. The demo
factories follow this shape:

```python
# my_agents/support.py
from pydantic_ai import Agent
from ravnar.agents import PydanticAiAgentWrapper


def make_support_agent(agent: Agent, *, docs_url: str) -> PydanticAiAgentWrapper:
    if agent.name is None:
        agent.name = "Support Agent"

    @agent.system_prompt
    def system_prompt() -> str:
        return f"You answer support questions. Authoritative docs live at {docs_url}."

    @agent.tool_plain
    async def lookup_ticket(ticket_id: str) -> dict:
        """Look up a support ticket by id."""
        ...

    return PydanticAiAgentWrapper(agent)
```

Reference it by dotted path:

```yaml
agents:
  static:
    support:
      cls_or_fn: my_agents.support.make_support_agent
      params:
        agent:
          cls_or_fn: pydantic_ai.Agent
          params:
            name: "Support Agent"
            model:
              cls_or_fn: pydantic_ai.models.openrouter.OpenRouterModel
              params:
                model_name: anthropic/claude-sonnet-4.6
                provider:
                  cls_or_fn: pydantic_ai.providers.openrouter.OpenRouterProvider
                  params:
                    api_key: "{{ OPENROUTER_API_KEY }}"
        docs_url: https://docs.example.com
```

Restart the server and `support` appears in the picker.

### Getting your code onto the server

Two options, in increasing order of commitment:

- **Mount it as a plugin.** The backend image sets `RAVNARPATH=/var/ravnar/plugins`; every path
  in `RAVNARPATH` is prepended to `sys.path` before the config is parsed. Mount a ConfigMap or
  volume containing your module there (`ravnar.extraVolumes` / `ravnar.extraVolumeMounts`) and
  the dotted path resolves — no image build.
- **Bake it into an image.** Add your package to `backend/pyproject.toml` dependencies (or the
  source tree) and build from `backend/Dockerfile`. This is the right answer once the agent has
  real dependencies of its own.

### Using another model provider

Nothing about the pack is tied to OpenRouter — it is just what the demo config uses. Any
pydantic-ai model class works: swap `cls_or_fn` for
`pydantic_ai.models.anthropic.AnthropicModel`, `pydantic_ai.models.openai.OpenAIModel`, or a
self-hosted OpenAI-compatible endpoint, and pass that provider's key through the same `{{ VAR }}`
placeholder mechanism. To point at models served on the same cluster, give the provider the
in-cluster base URL.

## Dynamic agents

`agents.dynamic.enabled: true` lets agents be registered at runtime through `POST /api/agents`
instead of only in config. The frontend reads the flag as `dynamicAgentsEnabled` from
`GET /api/config` and, when it is set, adds an **Agents** page (also reachable from the sidebar
and a **New agent** card on the home page) where users can create, edit, and delete their own
agents.

### What users can author

The UI never sends a raw constructor graph. It registers every agent through one pack-owned
factory, `ravnar_nebari_chat.dynamic_agents.make_chat_agent`, which accepts:

| Field | Notes |
| --- | --- |
| `name`, `description` | Shown in the agent picker. |
| `instructions` | The system prompt. |
| `model` | An OpenRouter model id. Must appear in the `NEBARI_CHAT_AGENT_MODELS` allowlist. |
| `quick_prompts` | Up to 12 starter cards, each `title`, optional `description`, and `prompt`. |
| `mcp_url` | Optional. A streamable-HTTP MCP server whose tools the agent may call. Accepted only when its host is listed in `NEBARI_CHAT_MCP_ALLOWED_HOSTS` (or that variable is `*`); plain `http` is allowed only for explicitly listed hosts. |

The factory builds the pydantic-ai agent server-side, reads `OPENROUTER_API_KEY` from its own
environment (so `agents.dynamic.allowed_env_vars` can stay empty), and records the authored
definition under `capabilities.identity.metadata.nebariChat` so the UI can fill the edit form from
`GET /api/agents`. Validation failures come back as `422` with a readable `detail`; a missing
allowlist or API key is a `503`. If the MCP server cannot be reached during registration, the agent
is still created — with no tools and a `setupError` the UI shows as **Setup failed**.

### Enabling it

Three settings across the backend and the frontend:

```yaml
# Backend config — config.inline under Helm, or backend/config.yml locally
agents:
  dynamic:
    enabled: true
```

```yaml
# Backend environment — ravnar.extraEnv under Helm, or exported in your shell locally
NEBARI_CHAT_AGENT_MODELS: anthropic/claude-sonnet-4.6,openai/gpt-5.5
NEBARI_CHAT_MCP_ALLOWED_HOSTS: mcp.internal.example.com # optional; unset disables MCP URLs
```

```yaml
# Frontend runtime config — frontend.agentAuthoring under Helm, or public/config.json locally
agentAuthoring:
  models:
    - id: anthropic/claude-sonnet-4.6
      label: Claude Sonnet 4.6
    - id: openai/gpt-5.5
      label: GPT-5.5
  mcp:
    enabled: false
```

The frontend list only populates the picker; the backend variable is the authority and rejects
anything else. The Helm chart fails the render when the two disagree, as long as the variable is
given as a literal `value` rather than a secret reference. See
[Helm values](/helm-values/#frontend-values).

Ravnar renders every string in a registration payload as a Jinja template against the (empty by
default) `allowed_env_vars` context. The UI wraps user text in `{% raw %}…{% endraw %}` so braces
in instructions survive; do the same if you call `POST /api/agents` yourself.

### Caveats

Read these before enabling dynamic agents on a shared deployment.

- **In memory only.** Ravnar keeps dynamic agents in the server process. They vanish on every
  restart or rollout, and threads bound to a vanished agent fail on their next run. Run a single
  backend replica (`ravnar.replicaCount: 1`); with more, each replica keeps its own list.
- **Shared with everyone.** Every user sees, uses, and can edit or delete every custom agent,
  including reading its full instructions. There is no ownership.
- **Editing is not atomic.** Ravnar has no update endpoint, so the UI deletes and re-registers
  under the same id (keeping threads bound), and restores the previous definition if the new one
  is rejected.
- **`agents:write` is powerful.** The pack's authenticator grants it to every realm user, and
  Ravnar's own endpoint accepts *any* importable `cls_or_fn`, not just the pack's factory.
  Enabling dynamic agents therefore lets any authenticated user run arbitrary Python callables in
  the backend. Restrict `agents:write` and `agents:delete` with your own
  [authenticator](#authentication) before enabling this where you do not trust every user.
- **MCP URLs are reached from the backend.** The host allowlist and the https requirement are the
  only guards; there is no DNS-rebinding protection, and no user identity is forwarded to the MCP
  server.

## Authentication

`security.authenticator` is what turns a Keycloak token into a Ravnar user. The pack ships one:

```yaml
security:
  authenticator:
    cls_or_fn: ravnar_nebari_chat.keycloak_authenticator
    params:
      keycloak_url: https://keycloak.example.com
      realm: nebari
```

It builds a `BearerTokenAuthenticator` over an OIDC validator for
`{keycloak_url}/realms/{realm}`, and grants every validated caller the full permission set. The
Helm chart renders exactly this block from `keycloak.url` and `keycloak.realm`, so you normally
never write it by hand. To run a narrower permission model, supply your own authenticator
callable the same way. See [Architecture & auth](/architecture/#authentication).
