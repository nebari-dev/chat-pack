"""User-authored chat agents registered at runtime through Ravnar's dynamic-agent API.

The frontend never sends a raw pydantic-ai constructor graph. It targets exactly one
``cls_or_fn`` -- :func:`make_chat_agent` -- with a small, validated set of parameters.
Everything sensitive (the model provider API key, the model allowlist, the MCP host
allowlist) is resolved here from the process environment, so nothing needs to be
whitelisted in ``agents.dynamic.allowed_env_vars``.

Ravnar keeps dynamic agents in memory only; see the docs for the caveats.
"""

__all__ = [
    "ALLOWED_MODELS_ENV",
    "API_KEY_ENV",
    "MCP_ALLOWED_HOSTS_ENV",
    "METADATA_KEY",
    "METADATA_VERSION",
    "AgentDefinition",
    "DynamicChatAgent",
    "QuickPromptDefinition",
    "allowed_mcp_hosts",
    "allowed_models",
    "make_chat_agent",
]

import os
from datetime import UTC, datetime
from typing import Any

import ag_ui.core
import pydantic
import structlog
from _ravnar.schema import QuickPrompt
from fastapi import HTTPException, status
from ravnar.agents import PydanticAiAgentWrapper

# Comma-separated OpenRouter model ids users may pick from. Unset => authoring is not configured.
ALLOWED_MODELS_ENV = "NEBARI_CHAT_AGENT_MODELS"
# Comma-separated hostnames an MCP server URL may point at, or "*" for any. Unset => MCP disabled.
MCP_ALLOWED_HOSTS_ENV = "NEBARI_CHAT_MCP_ALLOWED_HOSTS"
# The provider key. Shared with the static agents declared in config.yml.
API_KEY_ENV = "OPENROUTER_API_KEY"

# Where the authored definition is stashed so the UI can read it back for editing.
METADATA_KEY = "nebariChat"
METADATA_VERSION = 1

_MCP_TIMEOUT_SECONDS = 10.0


class QuickPromptDefinition(pydantic.BaseModel):
    """A starter prompt card shown in an empty chat."""

    model_config = pydantic.ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str = pydantic.Field(min_length=1, max_length=120)
    description: str | None = pydantic.Field(default=None, max_length=300)
    prompt: str = pydantic.Field(min_length=1, max_length=4000)


class AgentDefinition(pydantic.BaseModel):
    """The user-authorable shape of a chat agent."""

    model_config = pydantic.ConfigDict(extra="forbid", str_strip_whitespace=True)

    name: str = pydantic.Field(min_length=1, max_length=80)
    description: str | None = pydantic.Field(default=None, max_length=500)
    instructions: str = pydantic.Field(min_length=1, max_length=20_000)
    model: str = pydantic.Field(min_length=1, max_length=200)
    quick_prompts: list[QuickPromptDefinition] = pydantic.Field(default_factory=list, max_length=12)
    mcp_url: pydantic.HttpUrl | None = None

    @pydantic.field_validator("description", mode="after")
    @classmethod
    def _empty_description_is_none(cls, value: str | None) -> str | None:
        return value or None


def _split_env_list(name: str) -> list[str]:
    raw = os.environ.get(name, "")
    return [item.strip() for item in raw.split(",") if item.strip()]


def allowed_models() -> list[str]:
    """The model ids a user may pick, from :data:`ALLOWED_MODELS_ENV`."""
    return _split_env_list(ALLOWED_MODELS_ENV)


def allowed_mcp_hosts() -> list[str] | None:
    """The MCP hostnames a user may target, or ``None`` when MCP authoring is disabled."""
    hosts = [host.lower() for host in _split_env_list(MCP_ALLOWED_HOSTS_ENV)]
    return hosts or None


def _bad_request(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=detail)


def _not_configured(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=detail)


def _validate_definition(raw: dict[str, Any]) -> AgentDefinition:
    try:
        return AgentDefinition.model_validate(raw)
    except pydantic.ValidationError as exc:
        problems = "; ".join(f"{'.'.join(str(part) for part in err['loc'])}: {err['msg']}" for err in exc.errors())
        raise _bad_request(f"Invalid agent definition: {problems}") from exc


def _validate_model(definition: AgentDefinition) -> None:
    models = allowed_models()
    if not models:
        raise _not_configured(f"Agent authoring is not configured ({ALLOWED_MODELS_ENV} is unset)")
    if definition.model not in models:
        raise _bad_request(f"Model {definition.model!r} is not allowed. Allowed models: {', '.join(models)}")


def _validate_mcp_url(definition: AgentDefinition) -> None:
    if definition.mcp_url is None:
        return

    hosts = allowed_mcp_hosts()
    if hosts is None:
        raise _bad_request(f"MCP servers are not enabled on this deployment ({MCP_ALLOWED_HOSTS_ENV} is unset)")

    host = (definition.mcp_url.host or "").lower()
    explicitly_listed = host in hosts
    if not explicitly_listed and "*" not in hosts:
        raise _bad_request(f"MCP host {host!r} is not allowed")
    # Plain http is only acceptable for hosts an operator has named explicitly (e.g. in-cluster services).
    if definition.mcp_url.scheme != "https" and not explicitly_listed:
        raise _bad_request("MCP server URL must use https unless its host is explicitly allowed")


class DynamicChatAgent(PydanticAiAgentWrapper):
    """A :class:`PydanticAiAgentWrapper` that carries its authored definition and never fails setup.

    Ravnar registers a dynamic agent *before* awaiting ``setup()``. If ``setup()`` raised, the
    half-built agent would stay registered and ``GET /api/agents`` would fail for everyone. So
    capabilities are always available from construction, and a failed tool discovery degrades
    to an empty tool list plus a ``setupError`` in the metadata.
    """

    def __init__(self, agent: Any, *, definition: AgentDefinition) -> None:
        quick_prompts = [
            QuickPrompt(title=qp.title, description=qp.description, prompt=qp.prompt) for qp in definition.quick_prompts
        ]
        super().__init__(agent, quick_prompts=quick_prompts)
        self._definition = definition
        self._created_at = datetime.now(UTC).isoformat()
        self._capabilities = self._fallback_capabilities(setup_error=None)

    @property
    def definition(self) -> AgentDefinition:
        """The authored definition this agent was built from."""
        return self._definition

    async def setup(self) -> None:  # type: ignore[override]
        setup_error: str | None = None
        try:
            capabilities = await self.extract_capabilities(self._agent)
        except Exception as exc:  # broad on purpose - see class docstring
            structlog.get_logger().warning("Dynamic agent setup failed", agent=self._definition.name, error=str(exc))
            setup_error = f"{type(exc).__name__}: {exc}"[:300]
            capabilities = self._fallback_capabilities(setup_error=setup_error)

        capabilities.identity = self._identity(setup_error)
        self._capabilities = capabilities

    def _fallback_capabilities(self, *, setup_error: str | None) -> ag_ui.core.AgentCapabilities:
        return ag_ui.core.AgentCapabilities(
            identity=self._identity(setup_error),
            transport=ag_ui.core.TransportCapabilities(streaming=True),
            tools=ag_ui.core.ToolsCapabilities(supported=True, client_provided=True, items=[]),
        )

    def _identity(self, setup_error: str | None) -> ag_ui.core.IdentityCapabilities:
        definition = self._definition
        return ag_ui.core.IdentityCapabilities(
            name=definition.name,
            description=definition.description,
            type="pydantic-ai",
            provider="nebari-chat",
            metadata={
                METADATA_KEY: {
                    "kind": "dynamic",
                    "version": METADATA_VERSION,
                    "definition": {
                        "name": definition.name,
                        "description": definition.description,
                        "instructions": definition.instructions,
                        "model": definition.model,
                        "mcpUrl": str(definition.mcp_url) if definition.mcp_url else None,
                    },
                    "setupError": setup_error,
                    "createdAt": self._created_at,
                }
            },
        )


def make_chat_agent(
    *,
    name: str,
    instructions: str,
    model: str,
    description: str | None = None,
    quick_prompts: list[dict[str, Any]] | None = None,
    mcp_url: str | None = None,
) -> DynamicChatAgent:
    """Build a user-authored chat agent.

    Registered through ``POST /api/agents`` as ``cls_or_fn: ravnar_nebari_chat.dynamic_agents.make_chat_agent``.
    Every failure raises :class:`fastapi.HTTPException` so Ravnar answers with a 4xx/5xx and a
    human-readable ``detail`` instead of a 500.
    """
    definition = _validate_definition(
        {
            "name": name,
            "description": description,
            "instructions": instructions,
            "model": model,
            "quick_prompts": quick_prompts or [],
            "mcp_url": mcp_url or None,
        }
    )
    _validate_model(definition)
    _validate_mcp_url(definition)

    api_key = os.environ.get(API_KEY_ENV)
    if not api_key:
        raise _not_configured(f"Model provider is not configured ({API_KEY_ENV} is unset)")

    # Imported lazily so that importing this module stays cheap for config validation.
    import pydantic_ai
    from pydantic_ai.models.openrouter import OpenRouterModel
    from pydantic_ai.providers.openrouter import OpenRouterProvider

    toolsets: list[Any] | None = None
    if definition.mcp_url is not None:
        from pydantic_ai.mcp import MCPServerStreamableHTTP

        toolsets = [MCPServerStreamableHTTP(str(definition.mcp_url), id="mcp", timeout=_MCP_TIMEOUT_SECONDS)]

    agent = pydantic_ai.Agent(
        OpenRouterModel(definition.model, provider=OpenRouterProvider(api_key=api_key)),
        name=definition.name,
        description=definition.description,
        instructions=definition.instructions,
        toolsets=toolsets,
    )
    return DynamicChatAgent(agent, definition=definition)
