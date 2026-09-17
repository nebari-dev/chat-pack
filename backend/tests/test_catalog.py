from pathlib import Path

import pytest

from ravnar_nebari_chat import catalog
from ravnar_nebari_chat.catalog import Catalog, CatalogError, SqlTool, VisualizationTool, load_catalog

VALID = """
tools:
  charts:
    kind: visualization
    label: Charts and maps
  permits:
    kind: sql
    label: Austin permits
    description: Building permits, read-only
    database_url: "postgresql+psycopg://{{ PERMITS_DB_USER }}:secret@db.example/permits"
mcp_servers:
  frames:
    label: Frames
    url: https://frames.example/mcp
    tool_prefix: frames
  secure:
    label: Secure
    url: https://secure.example/mcp
    auth: impersonate
    timeout: 30
"""


def write(tmp_path: Path, text: str) -> Path:
    file = tmp_path / "catalog.yaml"
    file.write_text(text)
    return file


def test_missing_default_path_is_empty(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.delenv(catalog.CATALOG_ENV, raising=False)
    monkeypatch.setattr(catalog, "DEFAULT_CATALOG_PATH", str(tmp_path / "nope.yaml"))
    loaded = load_catalog()
    assert loaded == Catalog()
    assert loaded.public() == {"tools": [], "mcpServers": [], "databases": []}


def test_missing_explicit_path_is_an_error(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.setenv(catalog.CATALOG_ENV, str(tmp_path / "nope.yaml"))
    with pytest.raises(CatalogError, match="does not exist"):
        load_catalog()


def test_parses_and_renders_placeholders(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.setenv("PERMITS_DB_USER", "reader")
    monkeypatch.setenv(catalog.CATALOG_ENV, str(write(tmp_path, VALID)))

    loaded = load_catalog()

    assert isinstance(loaded.tools["charts"], VisualizationTool)
    permits = loaded.tools["permits"]
    assert isinstance(permits, SqlTool)
    assert permits.database_url == "postgresql+psycopg://reader:secret@db.example/permits"
    assert permits.schema_query == catalog.DEFAULT_SCHEMA_QUERY
    assert loaded.mcp_servers["frames"].tool_prefix == "frames"
    assert loaded.mcp_servers["secure"].auth == "impersonate"
    assert loaded.mcp_servers["secure"].timeout == 30
    assert loaded.databases() == {"permits": permits}


def test_public_view_hides_connection_details(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.setenv("PERMITS_DB_USER", "reader")
    loaded = load_catalog(write(tmp_path, VALID))

    public = loaded.public()
    assert public["tools"] == [
        {"id": "charts", "label": "Charts and maps", "kind": "visualization", "description": None},
        {"id": "permits", "label": "Austin permits", "kind": "sql", "description": "Building permits, read-only"},
    ]
    assert [s["id"] for s in public["mcpServers"]] == ["frames", "secure"]
    assert public["mcpServers"][1]["auth"] == "impersonate"
    assert public["databases"] == [
        {"id": "permits", "label": "Austin permits", "description": "Building permits, read-only"}
    ]
    assert "secret" not in str(public)
    assert "frames.example" not in str(public)


def test_undefined_placeholder_is_an_error(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.delenv("PERMITS_DB_USER", raising=False)
    with pytest.raises(CatalogError, match="placeholder"):
        load_catalog(write(tmp_path, VALID))


@pytest.mark.parametrize(
    ("text", "match"),
    [
        ("tools:\n  x:\n    kind: magic\n    label: X\n", "kind"),
        ("tools:\n  Bad Key:\n    kind: visualization\n    label: X\n", "must match"),
        ("tools:\n  x:\n    kind: sql\n    label: X\n", "database_url"),
        ("mcp_servers:\n  x:\n    label: X\n    url: not-a-url\n", "url"),
        ("mcp_servers:\n  x:\n    label: X\n    url: https://a.example\n    tool_prefix: Bad-Prefix\n", "tool_prefix"),
        ("unknown: true\n", "unknown"),
        ("- just\n- a list\n", "mapping"),
    ],
    ids=["unknown-kind", "bad-key", "sql-missing-url", "bad-url", "bad-prefix", "unknown-section", "not-a-mapping"],
)
def test_invalid_catalogs(tmp_path: Path, text: str, match: str) -> None:
    with pytest.raises(CatalogError, match=match):
        load_catalog(write(tmp_path, text))
