"""The operator catalog of capabilities a user-authored agent may select from.

The UI never names Python callables or carries secrets. Instead, an operator mounts a YAML
file into the backend describing built-in tools (with their connection details) and MCP
servers (with their URLs and auth mode). :func:`make_chat_agent` resolves the keys a user
picked against this catalog server-side.

The file is operator-owned, so ``{{ VAR }}`` placeholders are rendered against the full
process environment, unlike a registration payload.
"""

__all__ = [
    "CATALOG_ENV",
    "DEFAULT_CATALOG_PATH",
    "DEFAULT_SCHEMA_QUERY",
    "Catalog",
    "CatalogError",
    "McpServerEntry",
    "SqlTool",
    "ToolEntry",
    "VisualizationTool",
    "catalog_path",
    "load_catalog",
]

import os
from pathlib import Path
from typing import Annotated, Any, Literal

import jinja2
import pydantic
import yaml
from _ravnar.utils import render_template

from ravnar_nebari_chat._utils import format_multiline

# Path of the catalog file. Unset means the default path, which may legitimately not exist.
CATALOG_ENV = "NEBARI_CHAT_CATALOG"
DEFAULT_CATALOG_PATH = "/etc/nebari-chat/catalog.yaml"

# Keys are slugs so they can double as toolset ids and URL-safe identifiers in the UI.
_KEY_PATTERN = r"^[a-z0-9][a-z0-9-]{0,62}$"

DEFAULT_SCHEMA_QUERY = format_multiline(
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
)


class CatalogError(RuntimeError):
    """The catalog file is missing, unreadable, or invalid."""


class _Entry(pydantic.BaseModel):
    model_config = pydantic.ConfigDict(extra="forbid", str_strip_whitespace=True)

    label: str = pydantic.Field(min_length=1, max_length=80)
    description: str | None = pydantic.Field(default=None, max_length=300)


class VisualizationTool(_Entry):
    """Chart and map rendering tools (``create_chart``, ``create_map``)."""

    kind: Literal["visualization"]
    map_popup_prompt: str = ""


class SqlTool(_Entry):
    """Read-only SQL tools (``get_database_schema``, ``execute_query``) over one database."""

    kind: Literal["sql"]
    database_url: str = pydantic.Field(min_length=1)
    schema_query: str = DEFAULT_SCHEMA_QUERY


ToolEntry = Annotated[VisualizationTool | SqlTool, pydantic.Field(discriminator="kind")]


class McpServerEntry(_Entry):
    """A remote streamable-HTTP MCP server users may attach to an agent."""

    url: pydantic.HttpUrl
    auth: Literal["none", "impersonate"] = "none"
    tool_prefix: str | None = pydantic.Field(default=None, pattern=r"^[a-z][a-z0-9_]*$", max_length=32)
    timeout: float = pydantic.Field(default=10.0, gt=0, le=120)


class Catalog(pydantic.BaseModel):
    """Everything a user may pick from when authoring an agent."""

    model_config = pydantic.ConfigDict(extra="forbid")

    tools: dict[str, ToolEntry] = pydantic.Field(default_factory=dict)
    mcp_servers: dict[str, McpServerEntry] = pydantic.Field(default_factory=dict)

    @pydantic.field_validator("tools", "mcp_servers", mode="after")
    @classmethod
    def _keys_are_slugs(cls, value: dict[str, Any]) -> dict[str, Any]:
        import re

        for key in value:
            if not re.fullmatch(_KEY_PATTERN, key):
                raise ValueError(f"key {key!r} must match {_KEY_PATTERN}")
        return value

    def databases(self) -> dict[str, SqlTool]:
        """The SQL tools, which double as selectable data sources."""
        return {key: tool for key, tool in self.tools.items() if isinstance(tool, SqlTool)}

    def public(self) -> dict[str, Any]:
        """The UI-facing subset: keys, labels and kinds, never URLs or connection details."""
        return {
            "tools": [
                {"id": key, "label": tool.label, "kind": tool.kind, "description": tool.description}
                for key, tool in self.tools.items()
            ],
            "mcpServers": [
                {"id": key, "label": server.label, "auth": server.auth, "description": server.description}
                for key, server in self.mcp_servers.items()
            ],
            "databases": [
                {"id": key, "label": tool.label, "description": tool.description}
                for key, tool in self.databases().items()
            ],
        }


def catalog_path() -> Path:
    """The configured catalog path."""
    return Path(os.environ.get(CATALOG_ENV) or DEFAULT_CATALOG_PATH)


def load_catalog(path: Path | str | None = None) -> Catalog:
    """Load and validate the catalog.

    A missing file at the *default* path yields an empty catalog, so deployments without one
    keep working. A missing file at an explicitly configured path is an error.
    """
    explicit = path is not None or bool(os.environ.get(CATALOG_ENV))
    file = Path(path) if path is not None else catalog_path()

    if not file.exists():
        if explicit:
            raise CatalogError(f"Catalog file {file} does not exist")
        return Catalog()

    try:
        raw = yaml.safe_load(file.read_text()) or {}
    except (OSError, yaml.YAMLError) as exc:
        raise CatalogError(f"Could not read catalog {file}: {exc}") from exc
    if not isinstance(raw, dict):
        raise CatalogError(f"Catalog {file} must be a mapping at the top level")

    try:
        rendered = render_template(raw, dict(os.environ))
    except (jinja2.exceptions.UndefinedError, jinja2.exceptions.TemplateError) as exc:
        raise CatalogError(f"Catalog {file} references an undefined or invalid placeholder: {exc}") from exc

    try:
        return Catalog.model_validate(rendered)
    except pydantic.ValidationError as exc:
        problems = "; ".join(f"{'.'.join(str(part) for part in err['loc'])}: {err['msg']}" for err in exc.errors())
        raise CatalogError(f"Catalog {file} is invalid: {problems}") from exc
