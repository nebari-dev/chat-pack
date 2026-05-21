from pydantic_ai import Agent
from ravnar.agents import PydanticAiAgentWrapper

from ravnar_nebari_chat._utils import format_multiline

from ._tools import add_database_tools, add_visualization_tools


def make_sbir_awards_agent(
    agent: Agent,
    *,
    database_url: str,
) -> PydanticAiAgentWrapper:
    if agent.name is None:
        agent.name = "SBIR Awards Agent"

    @agent.system_prompt
    def system_prompt() -> str:
        return format_multiline(
            """
            You are an agent with the sole task of answering the user's
            questions about SBIR award data. The database is read-only and
            contains an ingest table sbir_awards_raw and a company
            location table sbir_company_locations.

            Favor concise, aggregation-first SQL. Prefer grouped summaries,
            trend lines, top-N queries, and filtered slices over row dumps.
            Always use LIMIT for detailed result sets. Before querying, inspect
            the schema if needed so your SQL matches the actual table layout.

            The most useful questions in this domain are about award totals by
            year, agency, branch, phase, and company; top recipients by count
            or dollars; and geographic distributions of companies.

            When producing maps, query the company rollup view and return a
            GeoJSON feature collection with company points and HTML popups.
            Put the company name, award count, total award amount, agency,
            and a short address summary in the popup when available.

            Do not generate any SQL that modifies the database.
            """
        )

    add_database_tools(
        agent,
        database_url=database_url,
        schema_query=format_multiline(
            """
            SELECT
                table_name,
                table_type,
                column_name,
                data_type,
                is_nullable,
                ordinal_position
            FROM (
                SELECT
                    t.table_name,
                    'BASE TABLE' AS table_type,
                    c.column_name,
                    c.data_type,
                    c.is_nullable,
                    c.ordinal_position
                FROM information_schema.tables t
                JOIN information_schema.columns c
                  ON t.table_name = c.table_name
                 AND t.table_schema = c.table_schema
                WHERE t.table_schema = 'public'
                  AND t.table_type = 'BASE TABLE'

                UNION ALL

                SELECT
                    v.table_name,
                    'VIEW' AS table_type,
                    c.column_name,
                    c.data_type,
                    c.is_nullable,
                    c.ordinal_position
                FROM information_schema.views v
                JOIN information_schema.columns c
                  ON v.table_name = c.table_name
                 AND v.table_schema = c.table_schema
                WHERE v.table_schema = 'public'
            ) schema_rows
            ORDER BY table_name, ordinal_position;
            """
        ),
    )

    add_visualization_tools(
        agent,
        map_popup_prompt=(
            "Include the company name, award count, total award amount, city/state, "
            "and any relevant address summary in the popup."
        ),
    )

    return PydanticAiAgentWrapper(agent)
