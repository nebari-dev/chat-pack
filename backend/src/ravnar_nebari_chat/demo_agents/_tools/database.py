import pydantic_ai
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


def add_database_tools(agent: pydantic_ai.Agent, *, database_url: str, schema_query: str) -> None:
    engine = create_async_engine(database_url)

    async def execute(query: str) -> list[tuple]:
        async with engine.connect() as conn:
            result = await conn.execute(text(query))
            return [tuple(row) for row in result.fetchall()]

    @agent.tool_plain
    async def get_database_schema() -> list[tuple]:
        """Get the schema for the database.

        Use this tool to understand the database structure before issuing
        any queries to the database.
        """
        return await execute(schema_query)

    @agent.tool_plain
    async def execute_query(query: str) -> list[tuple]:
        """Execute a query against the database.

        The query should not attempt to modify the db in any way.

        The database is mounted as readonly, so queries that attempt to modify it will fail.

        This tool takes a single argument, which is the SQL query to execute
        against the database.
        """
        return await execute(query)
