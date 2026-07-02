import warnings

from pydantic_ai import Agent
from pydantic_ai.mcp import MCPServerStreamableHTTP
from ravnar.agents import PydanticAiAgentWrapper

from ravnar_nebari_chat._utils import format_multiline


def make_frames_agent(
    agent: Agent,
    *,
    mcp_url: str,
    mcp_token: str | None = None,
) -> PydanticAiAgentWrapper:
    """Build an agent backed by the nebari-frames MCP server.

    The nebari-frames tools are advertised to the model as an MCP toolset over
    the Streamable HTTP transport. The agent opens and closes the MCP
    connection automatically around each run, so no explicit lifecycle
    management is needed here.

    Pass ``mcp_token`` to send an ``Authorization: Bearer <token>`` header;
    omit it (or pass an empty value) for an unauthenticated endpoint.

    If ``mcp_url`` is empty the MCP toolset is not attached at all. Ravnar
    connects to every static agent's toolsets at startup to read their
    capabilities, so attaching a server with no reachable URL would fail the
    whole boot. Set ``NEBARI_FRAMES_MCP_URL`` to enable the tools.
    """
    if agent.name is None:
        agent.name = "Nebari Frames Agent"

    if mcp_url:
        headers = {"Authorization": f"Bearer {mcp_token}"} if mcp_token else None
        frames_server = MCPServerStreamableHTTP(mcp_url, headers=headers)

        # The Agent is constructed upstream (in config.yml) and handed to us, so
        # we attach the MCP toolset to the already-built agent. `_user_toolsets`
        # is the list `Agent.__init__` populates from its `toolsets=` argument.
        agent._user_toolsets = [*agent._user_toolsets, frames_server]
    else:
        warnings.warn(
            "NEBARI_FRAMES_MCP_URL is not set; the Nebari Frames Agent will have "
            "no nebari-frames tools.",
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
