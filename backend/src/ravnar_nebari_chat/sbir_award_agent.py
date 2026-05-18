import uuid
from typing import Any

import psycopg
from ag_ui.core import ActivitySnapshotEvent
from pydantic_ai import Agent, ToolReturn
from pydantic_ai.models.openrouter import OpenRouterModel
from pydantic_ai.providers.openrouter import OpenRouterProvider

from ravnar.agents import PydanticAiAgentWrapper


def create_agent(
    name: str = "SBIR Awards Agent",
    model_name: str = "anthropic/claude-sonnet-4.6",
    api_key: str = "",
    db_host: str = "",
    db_port: str = "",
    db_name: str = "",
    db_user: str = "",
    db_password: str = "",
) -> PydanticAiAgentWrapper:
    async def db_conn() -> psycopg.AsyncConnection[Any]:
        return await psycopg.AsyncConnection.connect(
            dbname=db_name,
            user=db_user,
            password=db_password,
            host=db_host,
            port=db_port,
        )

    provider = OpenRouterProvider(api_key=api_key)
    model = OpenRouterModel(model_name=model_name, provider=provider)

    sbir_agent = Agent(
        model=model,
        name=name,
        system_prompt="""
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
        """,
    )

    @sbir_agent.tool_plain
    async def get_db_schema() -> list[tuple]:
        """Get the schema for the SBIR awards database.

        Use this tool to understand the database structure before issuing
        any queries.

        """
        query = """
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
        async with await db_conn() as conn, conn.cursor() as cur:
            await cur.execute(query)
            return list(await cur.fetchall())

    @sbir_agent.tool_plain
    async def execute_query(query: str) -> list[tuple]:
        """Execute a query against the SBIR awards database.

        The query should not attempt to modify the database in any way.

        The database is mounted as read-only, so queries that attempt to
        modify it will fail.

        This tool takes a single argument, which is the SQL to execute
        against the database. The database is Postgres, so use
        Postgres-compatible SQL syntax.

        """
        async with await db_conn() as conn, conn.cursor() as cur:
            await cur.execute(query)
            return list(await cur.fetchall())

    @sbir_agent.tool_plain
    async def create_chart(option: dict) -> ToolReturn:
        """Create a chart from the data retrieved by a query to the database.

        This tool takes a single argument, which is a Python dictionary
        that follows the format of an Apache ECharts configuration object.

        The object must be serializable to JSON, so it cannot include JS
        function callbacks. Only use features of the Apache ECharts config
        that can be serialized as plain JSON data.

        """
        return ToolReturn(
            return_value="Chart Created",
            metadata=[
                ActivitySnapshotEvent(
                    message_id=str(uuid.uuid4()), activity_type="application/json+echart", content=option
                )
            ],
        )

    @sbir_agent.tool_plain
    async def create_map(data: dict) -> ToolReturn:
        """Create a map with markers from the data retrieved by a query.

        This tool takes a single argument, which is a Python dictionary of
        the following form:
           { 'center': [number, number], 'features': GeoJSONFeatureCollection }

        Use the 'center' key to define the center of the map in
        [latitude, longitude] floating point numbers.

        Use the 'features' key to define an additional GeoJSON feature
        collection, such as markers with popup metadata, to add to the map.
        This dictionary must be a valid GeoJSON feature collection.

        To add a popup, create a 'popup' key in the properties of the
        feature. Use an HTML string to define the contents of the popup.
        Any other key in the properties of a feature besides 'popup' will
        be ignored.

        For SBIR maps, include the company name, award count, total award
        amount, city/state, and any relevant address summary in the popup.

        """
        return ToolReturn(
            return_value="Map Created",
            metadata=[
                ActivitySnapshotEvent(
                    message_id=str(uuid.uuid4()), activity_type="application/json+leaflet", content=data
                )
            ],
        )

    return PydanticAiAgentWrapper(sbir_agent)
