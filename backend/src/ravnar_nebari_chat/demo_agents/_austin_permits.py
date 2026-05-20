from pydantic_ai import Agent
from ravnar.agents import PydanticAiAgentWrapper

from ravnar_nebari_chat._utils import format_multiline

from ._tools import add_database_tools, add_visualization_tools


def make_austin_permits_agent(
    agent: Agent,
    *,
    database_url: str,
) -> PydanticAiAgentWrapper:
    agent.name = "Austin Permits Agent"

    @agent.system_prompt
    def system_prompt() -> str:
        return format_multiline(
            """
                You are an agent with the sole task of answering the user's
                questions related to the Austin Permits database. You have a suite
                of tools available to fetch the db schema, make queries, and create
                visualizations from the data. The database is mounted as readonly,
                so don't generate any SQL that would modify the database. Your
                query will fail if it attempts to modify the db. Plan your actions
                accordingly by ensuring that you understand the db schema before
                generating SQL queries.
            """
        )

    add_database_tools(
        agent,
        database_url=database_url,
        schema_query=format_multiline(
            """
            SELECT
                t.table_name,
                c.column_name,
                c.data_type,
                c.is_nullable,
                c.ordinal_position
            FROM information_schema.tables t
            JOIN information_schema.columns c ON t.table_name = c.table_name
            WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
            ORDER BY t.table_name, c.ordinal_position;
            """
        ),
    )
    add_visualization_tools(agent, map_popup_prompt="If a link to the permit is available, include it in any popup.")

    return PydanticAiAgentWrapper(agent)
