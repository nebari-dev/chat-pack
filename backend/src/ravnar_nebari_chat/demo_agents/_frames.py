import contextvars
import warnings
from collections.abc import AsyncIterator, Generator

import ag_ui.core
import httpx
from pydantic_ai import Agent
from pydantic_ai.mcp import MCPServerStreamableHTTP
from ravnar.agents import PydanticAiAgentWrapper
from ravnar.authenticators import User

from ravnar_nebari_chat._authenticators import ACCESS_TOKEN_DATA_KEY
from ravnar_nebari_chat._utils import format_multiline

_access_token: contextvars.ContextVar[str | None] = contextvars.ContextVar("frames_access_token", default=None)


class _ForwardUserTokenAuth(httpx.Auth):
    """Forward the calling chat user's Keycloak token to the MCP server.

    The nebari-frames MCP endpoint accepts the same Keycloak-issued user token
    that authenticated the chat request, provided the token's ``aud`` claim
    includes the frames MCP resource (an audience mapper on the chat client's
    scope adds it). The token is read per request from a context variable
    seeded by :class:`_FramesAgentWrapper` at the start of each run.
    """

    def auth_flow(self, request: httpx.Request) -> Generator[httpx.Request, httpx.Response]:
        token = _access_token.get()
        if token:
            request.headers["Authorization"] = f"Bearer {token}"
        yield request


class _FramesAgentWrapper(PydanticAiAgentWrapper):
    """Agent wrapper that exposes the user's token to the MCP transport."""

    async def run(self, input: ag_ui.core.RunAgentInput, user: User) -> AsyncIterator[ag_ui.core.Event]:
        token = user.data.get(ACCESS_TOKEN_DATA_KEY)
        if token is None:
            warnings.warn(
                "No access token on the authenticated user; nebari-frames MCP "
                "calls will be unauthenticated. Is the keycloak_authenticator "
                "configured?",
                stacklevel=2,
            )
        _access_token.set(token)
        async for event in super().run(input, user):
            yield event


def make_frames_agent(agent: Agent, *, mcp_url: str) -> PydanticAiAgentWrapper:
    """Build an agent backed by the nebari-frames MCP server.

    The nebari-frames tools are advertised to the model as an MCP toolset over
    the Streamable HTTP transport. The agent opens and closes the MCP
    connection automatically around each run, so no explicit lifecycle
    management is needed here.

    Each MCP request carries the calling user's own Keycloak access token, so
    frames applies that user's identity and permissions. This requires the
    token's audience to include the frames MCP resource identifier (Keycloak
    audience mapper on the chat client) — see ``OIDC_MCP_AUDIENCE`` in the
    nebari-frames docs.

    If ``mcp_url`` is empty the MCP toolset is not attached at all, and the
    agent loads with no frames tools. Set ``NEBARI_FRAMES_MCP_URL`` to enable
    the tools.
    """
    if agent.name is None:
        agent.name = "Nebari Frames Agent"

    if mcp_url:
        # The factory pydantic-ai builds around a caller-supplied http_client
        # drops the transport's timeout hints, so set them here: short connect,
        # long read for the SSE stream (mirrors pydantic-ai's own defaults).
        http_client = httpx.AsyncClient(
            auth=_ForwardUserTokenAuth(),
            timeout=httpx.Timeout(5, read=60 * 5),
        )
        frames_server = MCPServerStreamableHTTP(mcp_url, http_client=http_client)

        # The Agent is constructed upstream (in config.yml) and handed to us, so
        # we attach the MCP toolset to the already-built agent. `_user_toolsets`
        # is the list `Agent.__init__` populates from its `toolsets=` argument.
        agent._user_toolsets = [*agent._user_toolsets, frames_server]
    else:
        warnings.warn(
            "NEBARI_FRAMES_MCP_URL is not set; the Nebari Frames Agent will have no nebari-frames tools.",
            stacklevel=2,
        )

    @agent.system_prompt
    def system_prompt() -> str:
        return format_multiline(
            """
            You are an agent that answers the user's questions using the
            nebari-frames tools. Those tools are provided over MCP; inspect the
            tools available to you and call them to fetch data and perform
            actions rather than guessing.

            Prefer calling a tool over answering from memory whenever the answer
            depends on live data. When a tool fails or returns nothing useful,
            explain what you tried instead of inventing a result.
            """
        )

    # Capabilities are declared statically: extracting them would connect to
    # the MCP server at startup, and with per-user auth there is no token to
    # send outside a run — the frames endpoint would reject the connection and
    # fail the whole boot.
    capabilities = ag_ui.core.AgentCapabilities(
        identity=ag_ui.core.IdentityCapabilities(
            name=agent.name,
            description=agent.description,
            type="pydantic-ai",
        ),
        transport=ag_ui.core.TransportCapabilities(streaming=True),
        tools=ag_ui.core.ToolsCapabilities(supported=True, client_provided=True),
    )
    return _FramesAgentWrapper(agent, capabilities=capabilities)
