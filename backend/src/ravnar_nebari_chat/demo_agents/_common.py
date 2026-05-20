import uuid

from ag_ui.core import ActivitySnapshotEvent
from pydantic_ai import ToolReturn


async def create_chart(option: dict) -> ToolReturn:
    """Create a chart from data.

    This tool takes a single argument, which is a Python dictionary
    that follows the format of an Apache ECharts configuration object.

    The object must be serializable to JSON, so it cannot include JS
    function callbacks. Only use features of the Apache ECharts config
    that can be serialized as plain JSON data.

    """
    return ToolReturn(
        return_value="Chart Created",
        metadata=[
            ActivitySnapshotEvent(message_id=str(uuid.uuid4()), activity_type="application/json+echart", content=option)
        ],
    )


def create_map_factory():
    pass
