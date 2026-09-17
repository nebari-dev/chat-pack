"""User-authored chat agents registered at runtime through Ravnar's dynamic-agent API.

The frontend never sends a raw pydantic-ai constructor graph. It targets exactly one
``cls_or_fn`` -- :func:`make_chat_agent` -- with a small, validated set of parameters.
Everything sensitive (the model provider API key, the model allowlist, the MCP host
allowlist, and every connection detail in the operator :mod:`catalog`) is resolved here
from the process environment, so nothing needs to be whitelisted in
``agents.dynamic.allowed_env_vars``.

Ravnar keeps dynamic agents in memory only; see the docs for the caveats.
"""

__all__ = [
    "ALLOWED_MODELS_ENV",
    "API_KEY_ENV",
    "IMPERSONATION_CLIENT_ID_ENV",
    "IMPERSONATION_CLIENT_SECRET_ENV",
    "IMPERSONATION_ISSUER_ENV",
    "MCP_ALLOWED_HOSTS_ENV",
    "METADATA_KEY",
    "METADATA_VERSION",
    "AgentDefinition",
    "DataSourceRef",
    "DynamicChatAgent",
    "McpServerRef",
    "QuickPromptDefinition",
    "allowed_mcp_hosts",
    "allowed_models",
    "make_chat_agent",
]

import functools
import os
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any, Self

import ag_ui.core
import pydantic
import structlog
from _ravnar.schema import QuickPrompt
from fastapi import HTTPException, status
from ravnar.agents import PydanticAiAgentWrapper

from ravnar_nebari_chat import catalog as catalog_module
from ravnar_nebari_chat.catalog import Catalog, CatalogError, SqlTool, VisualizationTool

# Comma-separated OpenRouter model ids users may pick from. Unset => authoring is not configured.
ALLOWED_MODELS_ENV = "NEBARI_CHAT_AGENT_MODELS"
# Comma-separated hostnames a raw MCP server URL may point at, or "*" for any. Unset => raw URLs disabled.
# Catalog MCP servers are operator-approved and bypass this list.
MCP_ALLOWED_HOSTS_ENV = "NEBARI_CHAT_MCP_ALLOWED_HOSTS"
# The provider key. Shared with the static agents declared in config.yml.
API_KEY_ENV = "OPENROUTER_API_KEY"
# A confidential OIDC client allowed to perform token exchange, used for catalog MCP servers with
# `auth: impersonate`. All three must be set for such servers to be selectable.
IMPERSONATION_ISSUER_ENV = "NEBARI_CHAT_MCP_IMPERSONATION_ISSUER"
IMPERSONATION_CLIENT_ID_ENV = "NEBARI_CHAT_MCP_IMPERSONATION_CLIENT_ID"
IMPERSONATION_CLIENT_SECRET_ENV = "NEBARI_CHAT_MCP_IMPERSONATION_CLIENT_SECRET"

# Where the authored definition is stashed so the UI can read it back for editing.
METADATA_KEY = "nebariChat"
# Version 2 added `tools`, `mcpServers` and `dataSources` and dropped `mcpUrl`.
METADATA_VERSION = 2

_RAW_MCP_TIMEOUT_SECONDS = 10.0
_MAX_TOOLS = 20
_MAX_MCP_SERVERS = 8
_MAX_DATA_SOURCES = 20


class QuickPromptDefinition(pydantic.BaseModel):
    """A starter prompt card shown in an empty chat."""

    model_config = pydantic.ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str = pydantic.Field(min_length=1, max_length=120)
    description: str | None = pydantic.Field(default=None, max_length=300)
    prompt: str = pydantic.Field(min_length=1, max_length=4000)


class McpServerRef(pydantic.BaseModel):
    """A reference to an MCP server: a catalog key, or a raw URL where the deployment allows it."""

    model_config = pydantic.ConfigDict(extra="forbid", str_strip_whitespace=True)

    server: str | None = pydantic.Field(default=None, min_length=1, max_length=63)
    url: pydantic.HttpUrl | None = None

    @pydantic.model_validator(mode="after")
    def _exactly_one(self) -> Self:
        if (self.server is None) == (self.url is None):
            raise ValueError("specify exactly one of 'server' or 'url'")
        return self


class DataSourceRef(pydantic.BaseModel):
    """A reference to a data source: a catalog database key, or (not yet supported) a file id."""

    model_config = pydantic.ConfigDict(extra="forbid", str_strip_whitespace=True)

    database: str | None = pydantic.Field(default=None, min_length=1, max_length=63)
    file: str | None = pydantic.Field(default=None, min_length=1, max_length=128)

    @pydantic.model_validator(mode="after")
    def _exactly_one(self) -> Self:
        if (self.database is None) == (self.file is None):
            raise ValueError("specify exactly one of 'database' or 'file'")
        return self


class AgentDefinition(pydantic.BaseModel):
    """The user-authorable shape of a chat agent."""

    model_config = pydantic.ConfigDict(extra="forbid", str_strip_whitespace=True)

    name: str = pydantic.Field(min_length=1, max_length=80)
    description: str | None = pydantic.Field(default=None, max_length=500)
    instructions: str = pydantic.Field(min_length=1, max_length=20_000)
    model: str = pydantic.Field(min_length=1, max_length=200)
    quick_prompts: list[QuickPromptDefinition] = pydantic.Field(default_factory=list, max_length=12)
    tools: list[str] = pydantic.Field(default_factory=list, max_length=_MAX_TOOLS)
    mcp_servers: list[McpServerRef] = pydantic.Field(default_factory=list, max_length=_MAX_MCP_SERVERS)
    data_sources: list[DataSourceRef] = pydantic.Field(default_factory=list, max_length=_MAX_DATA_SOURCES)

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
    """The hostnames a raw MCP URL may target, or ``None`` when raw URLs are disabled."""
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


def _validate_raw_mcp_url(url: pydantic.HttpUrl) -> None:
    hosts = allowed_mcp_hosts()
    if hosts is None:
        raise _bad_request(
            f"Custom MCP server URLs are not enabled on this deployment ({MCP_ALLOWED_HOSTS_ENV} is unset)"
        )

    host = (url.host or "").lower()
    explicitly_listed = host in hosts
    if not explicitly_listed and "*" not in hosts:
        raise _bad_request(f"MCP host {host!r} is not allowed")
    # Plain http is only acceptable for hosts an operator has named explicitly (e.g. in-cluster services).
    if url.scheme != "https" and not explicitly_listed:
        raise _bad_request("MCP server URL must use https unless its host is explicitly allowed")


@dataclass(frozen=True)
class _ResolvedMcpServer:
    id: str
    url: str
    tool_prefix: str | None
    timeout: float
    auth: str


@dataclass
class _ResolvedCapabilities:
    """What a definition's selections resolve to, after checking them against the catalog."""

    tools: dict[str, VisualizationTool | SqlTool] = field(default_factory=dict)
    mcp_servers: list[_ResolvedMcpServer] = field(default_factory=list)


def _load_catalog() -> Catalog:
    try:
        return catalog_module.load_catalog()
    except CatalogError as exc:
        structlog.get_logger().error("Invalid capability catalog", error=str(exc))
        raise _not_configured("The capability catalog on this deployment is invalid") from exc


def _resolve_capabilities(definition: AgentDefinition, catalog: Catalog) -> _ResolvedCapabilities:
    resolved = _ResolvedCapabilities()

    def available(keys: dict[str, Any]) -> str:
        return ", ".join(sorted(keys)) if keys else "none"

    # Built-in tools by catalog key.
    for key in definition.tools:
        if key in resolved.tools:
            raise _bad_request(f"Tool {key!r} is listed more than once")
        entry = catalog.tools.get(key)
        if entry is None:
            raise _bad_request(f"Tool {key!r} is not in the catalog. Available tools: {available(catalog.tools)}")
        resolved.tools[key] = entry

    # Data sources: a database is sugar for its SQL tool; files are not supported yet.
    databases = catalog.databases()
    for source in definition.data_sources:
        if source.file is not None:
            raise _bad_request("File data sources are not supported yet")
        assert source.database is not None
        entry = databases.get(source.database)
        if entry is None:
            raise _bad_request(
                f"Database {source.database!r} is not in the catalog. Available databases: {available(databases)}"
            )
        resolved.tools.setdefault(source.database, entry)

    # MCP servers: registry entries are operator-approved; raw URLs go through the host allowlist.
    seen: set[str] = set()
    for index, ref in enumerate(definition.mcp_servers):
        if ref.server is not None:
            server = catalog.mcp_servers.get(ref.server)
            if server is None:
                raise _bad_request(
                    f"MCP server {ref.server!r} is not in the catalog. Available servers: {available(catalog.mcp_servers)}"
                )
            key = f"server:{ref.server}"
            resolved_server = _ResolvedMcpServer(
                id=ref.server,
                url=str(server.url),
                tool_prefix=server.tool_prefix,
                timeout=server.timeout,
                auth=server.auth,
            )
        else:
            assert ref.url is not None
            _validate_raw_mcp_url(ref.url)
            key = f"url:{ref.url}"
            resolved_server = _ResolvedMcpServer(
                id=f"mcp{index}", url=str(ref.url), tool_prefix=None, timeout=_RAW_MCP_TIMEOUT_SECONDS, auth="none"
            )
        if key in seen:
            raise _bad_request("The same MCP server is listed more than once")
        seen.add(key)
        resolved.mcp_servers.append(resolved_server)

    return resolved


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
                        "tools": list(definition.tools),
                        "mcpServers": [
                            {"server": ref.server} if ref.server is not None else {"url": str(ref.url)}
                            for ref in definition.mcp_servers
                        ],
                        "dataSources": [{"database": ref.database} for ref in definition.data_sources],
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
    tools: list[str] | None = None,
    mcp_servers: list[dict[str, Any]] | None = None,
    data_sources: list[dict[str, Any]] | None = None,
    mcp_url: str | None = None,
) -> DynamicChatAgent:
    """Build a user-authored chat agent.

    Registered through ``POST /api/agents`` as ``cls_or_fn: ravnar_nebari_chat.dynamic_agents.make_chat_agent``.
    Every failure raises :class:`fastapi.HTTPException` so Ravnar answers with a 4xx/5xx and a
    human-readable ``detail`` instead of a 500.

    ``mcp_url`` is the pre-catalog spelling of a single raw MCP server and is folded into
    ``mcp_servers``.
    """
    servers = list(mcp_servers or [])
    if mcp_url:
        servers.append({"url": mcp_url})

    definition = _validate_definition(
        {
            "name": name,
            "description": description,
            "instructions": instructions,
            "model": model,
            "quick_prompts": quick_prompts or [],
            "tools": tools or [],
            "mcp_servers": servers,
            "data_sources": data_sources or [],
        }
    )
    _validate_model(definition)
    resolved = _resolve_capabilities(definition, _load_catalog())

    api_key = os.environ.get(API_KEY_ENV)
    if not api_key:
        raise _not_configured(f"Model provider is not configured ({API_KEY_ENV} is unset)")

    # Imported lazily so that importing this module stays cheap for config validation.
    import pydantic_ai
    from pydantic_ai.models.openrouter import OpenRouterModel
    from pydantic_ai.providers.openrouter import OpenRouterProvider

    toolsets = [_build_mcp_toolset(server) for server in resolved.mcp_servers]

    agent = pydantic_ai.Agent(
        OpenRouterModel(definition.model, provider=OpenRouterProvider(api_key=api_key)),
        name=definition.name,
        description=definition.description,
        instructions=definition.instructions,
        toolsets=toolsets or None,
    )
    _attach_catalog_tools(agent, resolved.tools)
    return DynamicChatAgent(agent, definition=definition)


@functools.lru_cache(maxsize=4)
def _impersonator(issuer: str, client_id: str, client_secret: str) -> Any:
    """One impersonator per client configuration; it caches tokens and performs OIDC discovery once."""
    from ravnar_nebari_mcp import OIDCImpersonator

    return OIDCImpersonator(issuer=issuer, client_id=client_id, client_secret=client_secret)


def _build_mcp_toolset(server: _ResolvedMcpServer) -> Any:
    from pydantic_ai.mcp import MCPServerStreamableHTTP

    if server.auth != "impersonate":
        return MCPServerStreamableHTTP(server.url, id=server.id, tool_prefix=server.tool_prefix, timeout=server.timeout)

    issuer = os.environ.get(IMPERSONATION_ISSUER_ENV)
    client_id = os.environ.get(IMPERSONATION_CLIENT_ID_ENV)
    client_secret = os.environ.get(IMPERSONATION_CLIENT_SECRET_ENV)
    if not (issuer and client_id and client_secret):
        raise _not_configured(
            f"MCP server {server.id!r} requires per-user impersonation, which is not configured "
            f"({IMPERSONATION_ISSUER_ENV}, {IMPERSONATION_CLIENT_ID_ENV} and {IMPERSONATION_CLIENT_SECRET_ENV})"
        )

    from ravnar_nebari_mcp import ImpersonatingMCPToolset, bearer_token_mcp_toolset_factory

    try:
        impersonator = _impersonator(issuer, client_id, client_secret)
        return ImpersonatingMCPToolset(
            mcp_toolset_factory=bearer_token_mcp_toolset_factory(
                server.url, id=server.id, tool_prefix=server.tool_prefix, timeout=server.timeout
            ),
            impersonator=impersonator,
        )
    except Exception as exc:  # discovery or client-credentials failure is an operator problem, not a 500
        structlog.get_logger().error("MCP impersonation setup failed", server=server.id, error=str(exc))
        raise _not_configured(f"MCP impersonation for server {server.id!r} is misconfigured") from exc


def _attach_catalog_tools(agent: Any, tools: dict[str, VisualizationTool | SqlTool]) -> None:
    from ravnar_nebari_chat.demo_agents._tools import add_database_tools, add_visualization_tools

    for key, entry in tools.items():
        try:
            match entry:
                case VisualizationTool():
                    add_visualization_tools(agent, map_popup_prompt=entry.map_popup_prompt)
                case SqlTool():
                    add_database_tools(agent, database_url=entry.database_url, schema_query=entry.schema_query)
        except Exception as exc:  # operator misconfiguration (e.g. a bad DSN) must not become a 500
            structlog.get_logger().error("Catalog tool failed to initialize", tool=key, error=str(exc))
            raise _not_configured(f"Catalog tool {key!r} could not be initialized") from exc
