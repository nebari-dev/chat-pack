# Agent authoring in the UI

## Context

Today the set of agents in nebari-chat is fixed at deploy time: each agent is a `cls_or_fn` + `params` entry under `agents.static` in the backend `config.yml`, and the docs promise that "no frontend change is ever needed to add one". Users cannot create their own agents.

Ravnar (the backend framework, pinned at 0.0.16) already ships a dynamic-agent API that is switched on in the local `backend/config.yml` (`agents.dynamic.enabled: true`) but is unused by the UI:

- `POST /api/agents` (permission `agents:write`) accepts `{id, agent: {cls_or_fn, params}}` and registers an agent in-process (`_ravnar/api/agents.py:58-69`).
- `DELETE /api/agents/{id}` (permission `agents:delete`). There is no PUT.
- `GET /api/config` returns `dynamicAgentsEnabled`, which the frontend parses (`frontend/src/api/app.ts:73-87`) but never reads.

Goal: let a user create, edit and delete agents from the chat UI with name, description, instructions, model (from an allowlist), quick prompts, and an optional MCP server URL.

### Decisions made with the user

- **v1 is in-memory.** Use Ravnar's existing POST/DELETE. Persistence, PUT, and per-user ownership are upstream follow-ups in `openteams-ai/ravnar` (see Risks).
- **A pack-side factory** is the only `cls_or_fn` the UI ever sends. It builds the pydantic-ai agent server-side, reads the API key from the environment, validates the model against an allowlist, and stashes the authored definition in the agent's capabilities so the UI can read it back for editing.
- **Fields:** name, description, instructions, model, quick prompts, optional MCP server URL.
- **Placement:** new authenticated `/agents` route (list + dialog form), "Agents" link in the sidebar launcher, "New agent" card on the home page. Static agents are read-only; dynamic agents get Edit/Delete.

### Verified constraints that shape the design

- `add_agent` inserts into `_dynamic_agents` **before** awaiting `setup()` (`_ravnar/core.py:186-190`). If `setup()` raises, a half-built agent stays registered and `infos()` then crashes `GET /api/agents` for everyone. The factory's wrapper must make `setup()` infallible and have capabilities available from construction.
- Every string leaf in `params` is Jinja-rendered with `StrictUndefined` against the `allowed_env_vars` context (`_ravnar/utils.py:120-128, 196-222`). User text containing `{{ … }}` / `{% … %}` would 400 or 500. The frontend must wrap free text in `{% raw %}…{% endraw %}` and reject text containing `{% endraw %}`.
- Anything the factory raises other than `fastapi.HTTPException` becomes a 500 (`register_agent` calls `data.agent()` inline).
- `PydanticAiAgentWrapper.setup()` skips tool extraction when `capabilities` is passed to the constructor (`_ravnar/agents.py:150-158`), so identity must be overlaid **after** `extract_capabilities`.
- Ravnar `Config` is a `BaseSettings` with extras forbidden, so pack-specific settings cannot live in `config.inline`; they go in env vars via `ravnar.extraEnv`.
- `FetchError` drops the backend `detail` (`frontend/src/auth/index.ts:22-42`), so factory 4xx messages would toast as "unexpected error" unless plumbed through.
- The pack authenticator grants `ALL_PERMISSIONS` to every realm user (`backend/src/ravnar_nebari_chat/_authenticators.py:6-12`).
- `ravnar_nebari_mcp.ImpersonatingMCPToolset` references `pydantic_ai.mcp.MCPToolset`, which does not exist in pydantic-ai 1.91.0. v1 uses plain `pydantic_ai.mcp.MCPServerStreamableHTTP` (`pydantic_ai/mcp.py:1291`).

## Delivery: stacked branches, no PRs

The user will review the finished stack before any PR is opened. **Do not create pull requests.** Each stage is its own branch, stacked on the previous one, with a commit per stage:

| Branch | Stacked on | Contents |
| --- | --- | --- |
| `feat/agent-authoring-plan` | `main` | `plans/agent-authoring.md` (this plan) |
| `feat/agent-authoring-backend` | plan branch | Section 1 |
| `feat/agent-authoring-frontend-plumbing` | backend branch | Section 2 |
| `feat/agent-authoring-frontend-ui` | plumbing branch | Section 3 |
| `feat/agent-authoring-helm-docs` | UI branch | Section 4 |

First action after approval:

```sh
git checkout -b feat/agent-authoring-plan
mkdir -p plans && cp ~/.claude/plans/atomic-tickling-giraffe.md plans/agent-authoring.md
git add plans/agent-authoring.md && git commit -m "Add agent authoring plan"
```

Each subsequent stage: `git checkout -b <next> <previous>`, implement, run that stage's verification, commit. Stop after the last branch and report the stack for review.

## 1. Backend (branch `feat/agent-authoring-backend`)

### New `backend/src/ravnar_nebari_chat/dynamic_agents.py`

Env vars (all read at call time, never accepted from params):

| Env | Purpose |
| --- | --- |
| `NEBARI_CHAT_AGENT_MODELS` | comma-separated OpenRouter model ids users may pick; unset → 503 "authoring not configured" |
| `NEBARI_CHAT_MCP_ALLOWED_HOSTS` | comma-separated hostnames or `*`; unset → MCP URL rejected with 422 |
| `OPENROUTER_API_KEY` | already used by static agents; missing → 503 |

```python
class QuickPromptDefinition(BaseModel): title (1..120), description: str|None (..300), prompt (1..4000)
class AgentDefinition(BaseModel, extra="forbid", str_strip_whitespace=True):
    name (1..80), description: str|None (..500), instructions (1..20_000), model (1..200),
    quick_prompts: list[QuickPromptDefinition] (max 12), mcp_url: HttpUrl|None

def make_chat_agent(*, name, instructions, model, description=None, quick_prompts=None, mcp_url=None) -> DynamicChatAgent
```

`make_chat_agent`, in order, raising `fastapi.HTTPException` on every failure:
1. `AgentDefinition.model_validate(...)`; `ValidationError` → 422 with joined `loc: msg` detail.
2. Model not in `NEBARI_CHAT_AGENT_MODELS` → 422 listing allowed models.
3. If `mcp_url`: allowlist unset → 422; host not allowed → 422; require `https` unless the host is explicitly listed.
4. Build `OpenRouterModel(model, provider=OpenRouterProvider(api_key=...))`, optional `toolsets=[MCPServerStreamableHTTP(url, id="mcp", timeout=10)]`, then `pydantic_ai.Agent(model, name=, description=, instructions=, toolsets=)`.
5. Return `DynamicChatAgent(agent, definition=definition)`.

`DynamicChatAgent(PydanticAiAgentWrapper)`:
- `__init__` passes `quick_prompts` (as `_ravnar.schema.QuickPrompt`) to super and sets `self._capabilities` to an identity-only fallback immediately, so `infos()` never fails between insert and setup.
- `setup()` never raises: try `extract_capabilities(self._agent)` (connects to the MCP server for tool discovery); on exception log a warning, keep the fallback, and record `setupError`. Then overlay identity.
- Identity: `name`, `description`, `type="pydantic-ai"`, `provider="nebari-chat"`, and `metadata.nebariChat`:

```json
{ "kind": "dynamic", "version": 1,
  "definition": { "name", "description|null", "instructions", "model", "mcpUrl|null" },
  "setupError": "string|null", "createdAt": "ISO-8601" }
```

Quick prompts are read back from `AgentInfo.quickPrompts`, not duplicated. Static agents have no `nebariChat` key.

Export from `backend/src/ravnar_nebari_chat/__init__.py` alongside `demo_agents`. Pattern reference: `demo_agents/_austin_permits.py`, `_utils.format_multiline`.

**ID rule (frontend-generated):** `slug(name)[:40] + '-' + 6 random base36`, matching `^[a-z0-9][a-z0-9-]{2,62}$`. Edit reuses the id so threads stay bound. Ravnar's 409 on duplicates is surfaced as-is.

### Tests and CI

- `backend/pyproject.toml`: `test = ["pytest>=8.3,<9", "pytest-asyncio>=0.25,<1", "httpx>=0.28.1"]`, `[tool.pytest.ini_options] asyncio_mode="auto"`, `testpaths=["tests"]`.
- `backend/tests/conftest.py`: autouse env fixture (`NEBARI_CHAT_AGENT_MODELS="test/model-a,test/model-b"`, `OPENROUTER_API_KEY="sk-test"`, MCP hosts unset).
- `backend/tests/test_dynamic_agents.py`: model outside allowlist → 422; missing models env / API key → 503; invalid definition → 422; MCP disabled / host not allowed / http rejected → 422; capabilities + metadata after `setup()` and `get_capabilities()` works **before** `setup()`; `setup()` swallows an unreachable MCP server and sets `setupError`; integration test through `Ravnar(Config...)` + `httpx.ASGITransport` inside `app.router.lifespan_context`: bad model → 422, valid → 200 with `nebariChat.kind == "dynamic"`, DELETE → 200, unescaped `{{ NOPE }}` → 400.
- `.github/workflows/ci.yml`: new `backend` job (checkout, `astral-sh/setup-uv` pinned as in `docs.yml`, `uv sync --group test --group lint`, `ruff check`, `ruff format --check`, `mypy src`, `pytest`). There is currently no Python job at all.

## 2. Frontend plumbing (branch `feat/agent-authoring-frontend-plumbing`)

Changes to existing files:
- `src/auth/index.ts`: `FetchError` gains `detail?: string`, read from the JSON body (`detail` as string or `[{msg}]`).
- `src/lib/errors.ts`: new `Validation` category for 400/409/422 that surfaces `detail`; dedupe id includes the detail.
- `src/context/app.ts`: context value becomes `{ agents, config }`; `useAgents()` unchanged; add `useAppConfig()`.
- `src/routes/_authenticated.tsx`: return `appConfig` from the loader and provide it.
- `src/config/index.ts`: parse `agentAuthoring: { models: [{id, label?}], mcp: { enabled } }` from runtime `config.json`, sanitized; export `getAgentAuthoringConfig()`. Add a case to `config/index.test.ts`. Add the placeholder to `public/config.json`.
- Re-export new modules from `src/api/index.ts`, `src/queries/index.ts`, `src/context/index.ts`.

New files:
- `src/api/agents.ts`: `FACTORY` constant, `AGENT_ID_PATTERN`, `AgentDefinitionSchema` (form model, with a refinement rejecting `{% endraw %}`), `DynamicAgentMetadataSchema`, `getDynamicAgent(agent): DynamicAgent | null`, `escapeTemplate()`, `buildRegisterAgentBody(id, def)` (snake_case params, `{% raw %}` on free text, `null` for blanks), `createAgent()`, `deleteAgent()`. Unit tests in `agents.test.ts` (node env).
- `src/agents/slug.ts` + test: `makeAgentId(name)`.
- `src/queries/agents.ts`: `createAgentMutation`, `deleteAgentMutation`, `replaceAgentMutation` (DELETE then POST under the same id; on POST failure best-effort re-create the previous definition, then rethrow). All invalidate `['/api/agents']`.
- `src/context/agents.ts`: `AgentsConfigContext` / `useAgentsConfig()` exposing `models`, `mcpEnabled`, `canWrite`, `canDelete`, and the three handlers (same throw-if-missing pattern as `context/history.ts`).

## 3. Frontend UI (branch `feat/agent-authoring-frontend-ui`)

- `npx shadcn add textarea alert-dialog` (vendored, never hand-edited).
- `src/routes/_authenticated/agents.tsx`: `validateSearch` `{ new?: boolean, edit?: string }`; `beforeLoad` redirects to `/` when `dynamicAgentsEnabled` is false; component wires the three mutations, calls `router.invalidate()` after each (pattern: `routes/_authenticated/history.tsx:57-67`), and provides `AgentsConfigContext`. Dialog state is the URL.
- `src/agents/`:
  - `index.tsx` page: header, "New agent" button (hidden without `canWrite`; disabled with hint when `models` is empty), table, dialogs.
  - `table.tsx`: TanStack table over `useAgents()`; columns Name (link to chat), Id, Kind badge, Model, Tools count, Status (warning badge with `setupError` tooltip), Actions (Edit/Delete only for dynamic + permission).
  - `kindbadge.tsx`: "Custom" vs "Static", reused on home cards.
  - `form.tsx`: controlled state, `AgentDefinitionSchema.safeParse` on submit, inline errors (no form library, per AGENTS.md). Fields: Name, Description, Model select (stale stored model shown as disabled option), Instructions textarea, MCP URL (only when `mcpEnabled`), quick prompt rows.
  - `quickprompts.tsx`: add/remove rows, max 12.
  - `dialog.tsx`: create → `createAgent` with `makeAgentId(name)` then navigate to `/chat?agentId=`; edit → prefill from `getDynamicAgent`, `replaceAgent`, note that saving re-creates the agent.
  - `deletedialog.tsx`: `AlertDialog` warning that bound chats stop working and agents cannot be restored.
- `src/sidebar/launcher.tsx`: "Agents" link when `dynamicAgentsEnabled`.
- `src/home/agents.tsx`: kind badge on dynamic cards; "New agent" card when flag + `agents:write`.
- Picker/home refresh needs no changes: `router.invalidate()` reloads the `_authenticated` loader, which feeds `AppConfigContext`.

### e2e (`frontend/e2e/`)
- `mocks.ts`: `mockApi(page, options)` with `dynamicAgentsEnabled`, `agents`, `permissions`, `authoringModels`, `mcpEnabled` (defaults preserve today's behaviour); mock `/config.json`; `MOCK_DYNAMIC_AGENT` and `MOCK_BROKEN_AGENT`; POST/DELETE handlers that record requests.
- `agents.spec.ts`: flag off redirects and hides entry points; list shows Static vs Custom rows; create validates then POSTs exactly once with `cls_or_fn === FACTORY`, raw-wrapped instructions, slug id, then lands on `/chat?agentId=`; edit issues DELETE then POST with the same id; edit rollback on 422 re-POSTs the previous definition and toasts the detail; delete confirms and removes the row; permission variants hide New/Edit/Delete; `setupError` badge; empty models disables New; home card; MCP field visibility; axe on list and open dialog.

## 4. Helm and docs (branch `feat/agent-authoring-helm-docs`)

- `helm/nebari-chat/values.yaml`: `frontend.agentAuthoring: { models: [], mcp: { enabled: false } }` with comments pointing at `config.inline.agents.dynamic.enabled` and `ravnar.extraEnv.NEBARI_CHAT_AGENT_MODELS`. Mirror in `values.schema.json`.
- `templates/frontend-configmap.yaml`: render `agentAuthoring` into `config.json`; `fail` at render time when a frontend model id is missing from `ravnar.extraEnv.NEBARI_CHAT_AGENT_MODELS.value` (catches allowlist drift).
- `.github/helm/values.yaml`: exercise the new path in CI.
- Docs (`docs/src/content/docs/`): rewrite `agents.md` "Dynamic agents" (lines 192-198) and soften lines 10-11; `index.md:57-63`; `api-reference.md` rows for POST/DELETE `/api/agents` and the `nebariChat` metadata; `helm-values.md` new rows and example; `local-development.md` env setup. Repo `AGENTS.md`: fix stale "no test runner" line, add pytest, mention `dynamic_agents.py`.

## Verification

1. Backend: `cd backend && uv sync --group test --group lint && uv run pytest && uv run ruff check && uv run mypy src`. Manual: `NEBARI_CHAT_AGENT_MODELS=anthropic/claude-sonnet-4.6 uv run ravnar serve`, then `curl -X POST localhost:8000/api/agents` with the factory body → 200 with metadata; bad model → 422; unescaped `{{ X }}` → 400; `GET /api/agents` lists it; `DELETE` → 200.
2. Frontend: `cd frontend && npm run ci && npm run test && npm run build`; `npm run test:e2e` (3 browsers) incl. the new spec; manual run with `VITE_API_URL` against the backend branch: create an agent, chat with it, edit it, delete it, confirm picker and home update.
3. Helm: `helm dependency build ./helm/nebari-chat && helm lint --values .github/helm/values.yaml ./helm/nebari-chat && helm template ...`; inspect rendered `config.json`; confirm the drift `fail` triggers on a mismatched model.
4. Docs: `cd docs && npm run build && npm test && npm run typecheck && BASE=/chat-pack/ bash ../scripts/check-links.sh`.

## Risks and caveats (state in docs and UI copy)

- **In-memory:** agents vanish on restart or redeploy; threads bound to them remain and 404 on the next run. Requires `ravnar.replicaCount: 1`.
- **Global visibility:** every agent, including full instructions in metadata, is visible and usable by every user. No ownership in Ravnar 0.0.16.
- **Every realm user has `agents:write`/`agents:delete`**, and Ravnar's endpoint accepts **any** importable `cls_or_fn`, not just our factory. Enabling dynamic agents grants arbitrary callable invocation to all authenticated users. Docs must say to restrict `agents:write` via a custom authenticator before enabling in shared deployments. Upstream asks: `cls_or_fn` allowlist, persistence, PUT, ownership.
- **Edit is non-atomic** (DELETE + POST) with best-effort rollback; a concurrent creator can take the id.
- **MCP URL is an SSRF surface**; mitigated by the host allowlist and https requirement, not by DNS-rebinding protection. MCP calls carry no user identity in v1.
- **Two model allowlists** (frontend config vs backend env) can drift; Helm guard and 422 detail mitigate.
- **Registration latency:** MCP tool discovery runs inside the POST (10s timeout) and degrades to `setupError`.
