import warnings

from pydantic_ai import Agent
from ravnar.agents import PydanticAiAgentWrapper

from ravnar_nebari_chat._utils import format_multiline


def make_frames_agent(
    agent: Agent, *, mcp_url: str, oidc_issuer: str, client_id: str, client_secret: str
) -> PydanticAiAgentWrapper:
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
        from ravnar_nebari_mcp import ImpersonatingMCPToolset, OIDCImpersonator, bearer_token_mcp_toolset_factory

        impersonator = OIDCImpersonator(issuer=oidc_issuer, client_id=client_id, client_secret=client_secret)
        frames_server = ImpersonatingMCPToolset(
            mcp_toolset_factory=bearer_token_mcp_toolset_factory(mcp_url), impersonator=impersonator
        )

        # The Agent is constructed upstream (in config.yml) and handed to us, so
        # we attach the MCP toolset to the already-built agent. `_user_toolsets`
        # is the list `Agent.__init__` populates from its `toolsets=` argument.
        agent._user_toolsets = [*agent._user_toolsets, frames_server]  # type: ignore[list-item]
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

    return PydanticAiAgentWrapper(agent)
