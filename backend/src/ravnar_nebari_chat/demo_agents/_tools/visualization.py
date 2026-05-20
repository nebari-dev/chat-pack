import uuid

import ag_ui.core
import pydantic_ai

from ravnar_nebari_chat._utils import format_multiline


def add_visualization_tools(agent: pydantic_ai.Agent, *, map_popup_prompt: str) -> None:
    @agent.tool_plain
    async def create_chart(option: dict) -> pydantic_ai.ToolReturn:
        """Create a chart from data.

        This tool takes a single argument, which is a Python dictionary
        that follows the format of an Apache ECharts configuration object.

        The object must be serializable to JSON, so it cannot include
        JS function callbacks. Only use the features of the Apache ECharts
        config that can be serialized as plain JSON data.

        """
        return pydantic_ai.ToolReturn(
            return_value="Chart Created",
            metadata=[
                ag_ui.core.ActivitySnapshotEvent(
                    message_id=str(uuid.uuid4()), activity_type="application/json+echart", content=option
                )
            ],
        )

    @agent.tool_plain(
        description=format_multiline(
            f"""
            Create a map with markers from the data.

            This tool takes a single argument, which is a Python dictionary of
            the following form:
                {{ 'center': [number, number], 'features': GeoJSONFeatureCollection }}

            Use the 'center' key to define the center of the map in
            [latitude, longitude] floating point numbers.

            Use the 'features' key to define an additional GeoJSON feature
            collection, such as markers with popup metadata, to add to the map.
            This dictionary must be a valid GeoJSON feature collection.

            To add a popup, create a 'popup' key in the properties of the feature.
            Use an HTML string to define the contents of the popup. Any other key
            in the properties of a feature besides 'popup' will be ignored.

            {map_popup_prompt}
            """
        )
    )
    async def create_map(data: dict) -> pydantic_ai.ToolReturn:
        return pydantic_ai.ToolReturn(
            return_value="Map Created",
            metadata=[
                ag_ui.core.ActivitySnapshotEvent(
                    message_id=str(uuid.uuid4()), activity_type="application/json+leaflet", content=data
                )
            ],
        )
