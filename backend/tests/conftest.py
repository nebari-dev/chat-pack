from pathlib import Path

import pytest

from ravnar_nebari_chat import catalog, dynamic_agents

ALLOWED_MODELS = ["test/model-a", "test/model-b"]

CATALOG = """
tools:
  charts:
    kind: visualization
    label: Charts and maps
  permits:
    kind: sql
    label: Austin permits
    database_url: "postgresql+psycopg://reader:secret@db.example/permits"
mcp_servers:
  frames:
    label: Frames
    url: https://frames.example/mcp
    tool_prefix: frames
  secure:
    label: Secure
    url: https://secure.example/mcp
    auth: impersonate
"""


@pytest.fixture(autouse=True)
def authoring_env(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    """A deployment where agent authoring is configured, raw MCP URLs are disabled, and no catalog exists."""
    monkeypatch.setenv(dynamic_agents.ALLOWED_MODELS_ENV, ",".join(ALLOWED_MODELS))
    monkeypatch.setenv(dynamic_agents.API_KEY_ENV, "sk-test")
    monkeypatch.delenv(dynamic_agents.MCP_ALLOWED_HOSTS_ENV, raising=False)
    monkeypatch.delenv(catalog.CATALOG_ENV, raising=False)
    monkeypatch.setattr(catalog, "DEFAULT_CATALOG_PATH", str(tmp_path / "no-catalog.yaml"))


@pytest.fixture
def catalog_file(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> Path:
    """Point the backend at a catalog with a visualization tool, a SQL tool and two MCP servers."""
    file = tmp_path / "catalog.yaml"
    file.write_text(CATALOG)
    monkeypatch.setenv(catalog.CATALOG_ENV, str(file))
    return file
