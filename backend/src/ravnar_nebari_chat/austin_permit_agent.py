import uuid
from typing import Any

import psycopg
from ag_ui.core import ActivitySnapshotEvent
from pydantic_ai import Agent, ToolReturn

from ravnar.agents import PydanticAiAgentWrapper


class PostgresDatabase:
    def __init__(
        self,
        *,
        host: str,
        port: int = 5432,
        name: str,
        user: str,
        password: str,
    ) -> None:
        self._host = host
        self._port = port
        self._name = name
        self._user = user
        self._password = password

    async def _connect(self) -> psycopg.AsyncConnection[Any]:
        return await psycopg.AsyncConnection.connect(
            dbname=self._name,
            user=self._user,
            password=self._password,
            host=self._host,
            port=self._port,
        )

    async def execute(self, query: str) -> list[tuple]:
        async with await self._connect() as conn, conn.cursor() as cur:
            await cur.execute(query)
            return list(await cur.fetchall())


def create_agent(
    agent: Agent,
    database: PostgresDatabase,
) -> PydanticAiAgentWrapper:
    @agent.system_prompt
    def _system_prompt() -> str:
        return """
            You are an agent with the sole task of answering the user's
            questions related to the Austin Permits Database. You have a suite
            of tools available to fetch the db schema, make queries, and create
            visualizations from the data. The database is mounted as readonly,
            so don't generate any SQL that would modify the database. Your
            query will fail if it attempts to modify the db. Plan your actions
            accordingly by ensuring that you understand the db schema before
            generating SQL queries.
        """

    @agent.tool_plain
    async def get_db_schema() -> list[tuple]:
        """Get the schema for the Austin Permits database.

        Use this tool to understand the db structure before issuing
        any queries to the db.

        """
        query = """
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
        return await database.execute(query)

    @agent.tool_plain
    async def execute_query(query: str) -> list[tuple]:
        """Execute a query against the Austin Permits database.

        The query should not attempt to modify the db in any way.

        The db is mounted as readonly, so queries that attempt to modify it will fail.

        This tool takes a single argument, which is the SQL to execute
        against the db. The db is Postgres, so use Postgres-compatible
        SQL syntax.

        """
        return await database.execute(query)

    @agent.tool_plain
    async def create_chart(option: dict) -> ToolReturn:
        """Create a chart from the data retrieved by a query to the db.

        This tool takes a single argument, which is a Python dictionary
        that follows the format of an Apache ECharts configuration object.

        The object must be serializable to JSON, so it cannot include
        JS function callbacks. Only use the features of the Apache ECharts
        config that can be serialized as plain JSON data.

        """
        return ToolReturn(
            return_value="Chart Created",
            metadata=[
                ActivitySnapshotEvent(
                    message_id=str(uuid.uuid4()), activity_type="application/json+echart", content=option
                )
            ],
        )

    @agent.tool_plain
    async def create_map(data: dict) -> ToolReturn:
        """Create a map with markers from the data retrieved by a query to the db.

        This tool takes a single argument, which is a Python dictionary of
        the following form:
           { 'center': [number, number], 'features': GeoJSONFeatureCollection }

        Use the 'center' key to define the center of the map in
        [latitude, longitude] floating point numbers.

        Use the 'features' key to define an additional GeoJSON feature
        collection, such as markers with popup metadata, to add to the map.
        This dictionary must be a valid GeoJSON feature collection.

        To add a popup, create a 'popup' key in the properties of the feature.
        Use an HTML string to define the contents of the popup. Any other key
        in the properties of a feature besides 'popup' will be ignored.

        If a link to the permit is available, include it in any popup.

        """
        return ToolReturn(
            return_value="Map Created",
            metadata=[
                ActivitySnapshotEvent(
                    message_id=str(uuid.uuid4()), activity_type="application/json+leaflet", content=data
                )
            ],
        )

    return PydanticAiAgentWrapper(agent)