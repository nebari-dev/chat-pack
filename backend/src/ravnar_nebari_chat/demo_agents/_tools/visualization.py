import uuid
from typing import Any

import ag_ui.core
import pydantic_ai
from pydantic import BaseModel, Field

from ravnar_nebari_chat._utils import format_multiline


class ChartConfig(BaseModel):
    """Apache ECharts configuration object.

    Only use features that can be serialized as plain JSON data.
    JS function callbacks are not supported.
    """

    model_config = {"extra": "allow"}


class GeoJSONFeature(BaseModel):
    """A single GeoJSON feature with optional popup properties."""

    type: str = Field(default="Feature", description="Must be 'Feature'.")
    geometry: dict[str, Any] = Field(description="GeoJSON geometry object (Point, LineString, Polygon, etc.).")
    properties: dict[str, Any] = Field(
        default_factory=dict,
        description="Feature properties. Use a 'popup' key with an HTML string to add a popup.",
    )


class GeoJSONFeatureCollection(BaseModel):
    """A GeoJSON FeatureCollection."""

    type: str = Field(default="FeatureCollection", description="Must be 'FeatureCollection'.")
    features: list[GeoJSONFeature] = Field(description="List of GeoJSON features.")


class MapData(BaseModel):
    """Map visualization data with center coordinates and optional GeoJSON features."""

    center: list[float] = Field(
        min_length=2,
        max_length=2,
        description="Map center as [latitude, longitude] in floating point numbers.",
    )
    features: GeoJSONFeatureCollection = Field(
        default_factory=lambda: GeoJSONFeatureCollection(features=[]),
        description="GeoJSON feature collection with markers and popup metadata.",
    )
    model_config = {"extra": "allow"}


def add_visualization_tools(agent: pydantic_ai.Agent, *, map_popup_prompt: str) -> None:
    @agent.tool_plain
    async def create_chart(config: ChartConfig) -> pydantic_ai.ToolReturn:
        """Create a chart from data using Apache ECharts."""
        return pydantic_ai.ToolReturn(
            return_value="Chart Created",
            metadata=[
                ag_ui.core.ActivitySnapshotEvent(
                    message_id=str(uuid.uuid4()), activity_type="application/json+echart", content=config.model_dump()
                )
            ],
        )

    @agent.tool_plain(
        description=format_multiline(
            f"""
            Create a map with markers from the data.

            {map_popup_prompt}
            """
        )
    )
    async def create_map(data: MapData) -> pydantic_ai.ToolReturn:
        return pydantic_ai.ToolReturn(
            return_value="Map Created",
            metadata=[
                ag_ui.core.ActivitySnapshotEvent(
                    message_id=str(uuid.uuid4()), activity_type="application/json+leaflet", content=data.model_dump()
                )
            ],
        )
