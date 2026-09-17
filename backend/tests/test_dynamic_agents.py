from typing import Any

import httpx
import pytest
from fastapi import HTTPException

from ravnar_nebari_chat import dynamic_agents
from ravnar_nebari_chat.dynamic_agents import METADATA_KEY, DynamicChatAgent, make_chat_agent

FACTORY = "ravnar_nebari_chat.dynamic_agents.make_chat_agent"


def valid_params(**overrides: Any) -> dict[str, Any]:
    params: dict[str, Any] = {
        "name": "Support Bot",
        "description": "Answers support questions",
        "instructions": "You are a helpful support agent.",
        "model": "test/model-a",
        "quick_prompts": [{"title": "Hi", "description": "Say hello", "prompt": "Hello!"}],
    }
    params.update(overrides)
    return params


def metadata(agent: DynamicChatAgent) -> dict[str, Any]:
    identity = agent.get_capabilities().identity
    assert identity is not None and identity.metadata is not None
    return identity.metadata[METADATA_KEY]


def raises_http(status_code: int, **overrides: Any) -> HTTPException:
    with pytest.raises(HTTPException) as info:
        make_chat_agent(**valid_params(**overrides))
    assert info.value.status_code == status_code
    return info.value


class TestValidation:
    def test_rejects_model_outside_allowlist(self) -> None:
        exc = raises_http(422, model="test/not-allowed")
        assert "test/model-a" in str(exc.detail)

    def test_missing_models_env_is_503(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv(dynamic_agents.ALLOWED_MODELS_ENV)
        raises_http(503)

    def test_missing_api_key_is_503(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv(dynamic_agents.API_KEY_ENV)
        raises_http(503)

    @pytest.mark.parametrize(
        "overrides",
        [
            {"name": ""},
            {"instructions": "x" * 20_001},
            {"quick_prompts": [{"title": "t", "prompt": "p"}] * 13},
            {"quick_prompts": [{"title": "t"}]},
            {"mcp_url": "not a url"},
        ],
        ids=["empty-name", "instructions-too-long", "too-many-quick-prompts", "quick-prompt-missing-prompt", "bad-url"],
    )
    def test_invalid_definition_is_422(self, overrides: dict[str, Any]) -> None:
        exc = raises_http(422, **overrides)
        assert str(exc.detail).startswith("Invalid agent definition")

    def test_mcp_disabled_without_allowlist_is_422(self) -> None:
        exc = raises_http(422, mcp_url="https://mcp.example.com/mcp")
        assert "not enabled" in str(exc.detail)

    def test_mcp_host_not_allowed_is_422(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv(dynamic_agents.MCP_ALLOWED_HOSTS_ENV, "mcp.example.com")
        exc = raises_http(422, mcp_url="https://evil.example.org/mcp")
        assert "not allowed" in str(exc.detail)

    def test_mcp_http_rejected_unless_host_listed(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv(dynamic_agents.MCP_ALLOWED_HOSTS_ENV, "*")
        exc = raises_http(422, mcp_url="http://mcp.example.com/mcp")
        assert "https" in str(exc.detail)

    def test_mcp_http_allowed_for_explicit_host(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv(dynamic_agents.MCP_ALLOWED_HOSTS_ENV, "mcp.internal")
        agent = make_chat_agent(**valid_params(mcp_url="http://mcp.internal:8080/mcp"))
        assert metadata(agent)["definition"]["mcpServers"] == [{"url": "http://mcp.internal:8080/mcp"}]

    def test_mcp_servers_raw_url_matches_legacy_mcp_url(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv(dynamic_agents.MCP_ALLOWED_HOSTS_ENV, "*")
        agent = make_chat_agent(**valid_params(mcp_servers=[{"url": "https://mcp.example.com/mcp"}]))
        assert metadata(agent)["definition"]["mcpServers"] == [{"url": "https://mcp.example.com/mcp"}]

    def test_duplicate_mcp_url_is_422(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv(dynamic_agents.MCP_ALLOWED_HOSTS_ENV, "*")
        url = "https://mcp.example.com/mcp"
        raises_http(422, mcp_servers=[{"url": url}, {"url": url}])

    @pytest.mark.parametrize(
        "ref",
        [{}, {"server": "frames", "url": "https://x.example/mcp"}, {"bogus": 1}],
        ids=["empty", "both", "unknown-field"],
    )
    def test_malformed_mcp_ref_is_422(self, ref: dict[str, Any]) -> None:
        raises_http(422, mcp_servers=[ref])


class TestAgent:
    def test_capabilities_available_before_setup(self) -> None:
        agent = make_chat_agent(**valid_params())
        capabilities = agent.get_capabilities()
        assert capabilities.identity is not None
        assert capabilities.identity.name == "Support Bot"
        assert capabilities.tools is not None and capabilities.tools.items == []

    async def test_capabilities_and_metadata_after_setup(self) -> None:
        agent = make_chat_agent(**valid_params())
        await agent.setup()

        capabilities = agent.get_capabilities()
        assert capabilities.identity is not None
        assert capabilities.identity.name == "Support Bot"
        assert capabilities.identity.description == "Answers support questions"
        assert capabilities.identity.provider == "nebari-chat"
        assert capabilities.tools is not None and capabilities.tools.items == []

        meta = metadata(agent)
        assert meta["kind"] == "dynamic"
        assert meta["version"] == dynamic_agents.METADATA_VERSION
        assert meta["setupError"] is None
        assert meta["definition"] == {
            "name": "Support Bot",
            "description": "Answers support questions",
            "instructions": "You are a helpful support agent.",
            "model": "test/model-a",
            "tools": [],
            "mcpServers": [],
            "dataSources": [],
        }

        prompts = agent.get_quick_prompts()
        assert [(p.title, p.description, p.prompt) for p in prompts] == [("Hi", "Say hello", "Hello!")]

    def test_blank_description_becomes_none(self) -> None:
        agent = make_chat_agent(**valid_params(description="   "))
        assert metadata(agent)["definition"]["description"] is None

    async def test_setup_swallows_mcp_failure(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv(dynamic_agents.MCP_ALLOWED_HOSTS_ENV, "127.0.0.1")
        monkeypatch.setattr(dynamic_agents, "_RAW_MCP_TIMEOUT_SECONDS", 0.5)
        # Port 9 (discard) is not listening; the connection is refused immediately.
        agent = make_chat_agent(**valid_params(mcp_url="http://127.0.0.1:9/mcp"))

        await agent.setup()

        meta = metadata(agent)
        assert meta["setupError"] is not None
        capabilities = agent.get_capabilities()
        assert capabilities.identity is not None and capabilities.identity.name == "Support Bot"
        assert capabilities.tools is not None and capabilities.tools.items == []


def tool_names(agent: DynamicChatAgent) -> list[str]:
    tools = agent.get_capabilities().tools
    assert tools is not None and tools.items is not None
    return sorted(tool.name for tool in tools.items)


class TestCatalogCapabilities:
    def test_unknown_tool_without_catalog_is_422(self) -> None:
        exc = raises_http(422, tools=["charts"])
        assert "Available tools: none" in str(exc.detail)

    @pytest.mark.usefixtures("catalog_file")
    def test_unknown_tool_lists_available(self) -> None:
        exc = raises_http(422, tools=["nope"])
        assert "charts" in str(exc.detail) and "permits" in str(exc.detail)

    @pytest.mark.usefixtures("catalog_file")
    def test_duplicate_tool_is_422(self) -> None:
        raises_http(422, tools=["charts", "charts"])

    @pytest.mark.usefixtures("catalog_file")
    async def test_visualization_tool_attaches_chart_tools(self) -> None:
        agent = make_chat_agent(**valid_params(tools=["charts"]))
        await agent.setup()
        assert tool_names(agent) == ["create_chart", "create_map"]
        assert metadata(agent)["definition"]["tools"] == ["charts"]
        assert metadata(agent)["setupError"] is None

    @pytest.mark.usefixtures("catalog_file")
    async def test_sql_tool_attaches_database_tools(self) -> None:
        agent = make_chat_agent(**valid_params(tools=["permits"]))
        await agent.setup()
        assert tool_names(agent) == ["execute_query", "get_database_schema"]

    @pytest.mark.usefixtures("catalog_file")
    async def test_database_data_source_is_sugar_for_sql_tool(self) -> None:
        agent = make_chat_agent(**valid_params(data_sources=[{"database": "permits"}]))
        await agent.setup()
        assert tool_names(agent) == ["execute_query", "get_database_schema"]
        assert metadata(agent)["definition"]["dataSources"] == [{"database": "permits"}]

    @pytest.mark.usefixtures("catalog_file")
    async def test_tool_and_data_source_for_same_database_attach_once(self) -> None:
        agent = make_chat_agent(**valid_params(tools=["permits", "charts"], data_sources=[{"database": "permits"}]))
        await agent.setup()
        assert tool_names(agent) == ["create_chart", "create_map", "execute_query", "get_database_schema"]

    @pytest.mark.usefixtures("catalog_file")
    def test_database_must_be_sql_kind(self) -> None:
        exc = raises_http(422, data_sources=[{"database": "charts"}])
        assert "Available databases: permits" in str(exc.detail)

    @pytest.mark.usefixtures("catalog_file")
    def test_file_data_source_not_supported_yet(self) -> None:
        exc = raises_http(422, data_sources=[{"file": "abc"}])
        assert "not supported yet" in str(exc.detail)

    @pytest.mark.usefixtures("catalog_file")
    def test_unknown_mcp_server_is_422(self) -> None:
        exc = raises_http(422, mcp_servers=[{"server": "nope"}])
        assert "frames" in str(exc.detail)

    @pytest.mark.usefixtures("catalog_file")
    def test_impersonating_server_is_503_when_unconfigured(self, monkeypatch: pytest.MonkeyPatch) -> None:
        for name in (
            dynamic_agents.IMPERSONATION_ISSUER_ENV,
            dynamic_agents.IMPERSONATION_CLIENT_ID_ENV,
            dynamic_agents.IMPERSONATION_CLIENT_SECRET_ENV,
        ):
            monkeypatch.delenv(name, raising=False)
        exc = raises_http(503, mcp_servers=[{"server": "secure"}])
        assert "impersonation" in str(exc.detail)
        assert dynamic_agents.IMPERSONATION_ISSUER_ENV in str(exc.detail)

    @pytest.mark.usefixtures("catalog_file")
    def test_catalog_server_bypasses_raw_host_allowlist(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv(dynamic_agents.MCP_ALLOWED_HOSTS_ENV, raising=False)
        agent = make_chat_agent(**valid_params(mcp_servers=[{"server": "frames"}]))
        assert metadata(agent)["definition"]["mcpServers"] == [{"server": "frames"}]
        toolsets = agent._agent.toolsets
        mcp = [t for t in toolsets if type(t).__name__ == "MCPServerStreamableHTTP"]
        assert len(mcp) == 1
        assert mcp[0].tool_prefix == "frames"
        assert mcp[0].id == "frames"

    @pytest.mark.usefixtures("catalog_file")
    def test_duplicate_catalog_server_is_422(self) -> None:
        raises_http(422, mcp_servers=[{"server": "frames"}, {"server": "frames"}])

    def test_invalid_catalog_is_503(self, monkeypatch: pytest.MonkeyPatch, tmp_path: Any) -> None:
        bad = tmp_path / "bad.yaml"
        bad.write_text("tools:\n  x:\n    kind: magic\n    label: X\n")
        monkeypatch.setenv("NEBARI_CHAT_CATALOG", str(bad))
        exc = raises_http(503)
        assert "catalog" in str(exc.detail).lower()

    @pytest.mark.usefixtures("catalog_file")
    def test_bad_catalog_dsn_is_503(self, monkeypatch: pytest.MonkeyPatch, tmp_path: Any) -> None:
        bad = tmp_path / "catalog.yaml"
        bad.write_text("tools:\n  db:\n    kind: sql\n    label: DB\n    database_url: nonsense://nowhere\n")
        exc = raises_http(503, tools=["db"])
        assert "could not be initialized" in str(exc.detail)


class TestRavnarIntegration:
    """Drive the factory through Ravnar's real ``POST /api/agents`` endpoint."""

    @pytest.fixture
    async def client(self):  # type: ignore[no-untyped-def]
        from _ravnar.config import BaseConfig
        from _ravnar.core import Ravnar

        config = BaseConfig.model_validate(
            {
                "agents": {"static": {}, "dynamic": {"enabled": True}},
                "storage": {"enabled": False},
            }
        )
        app = Ravnar(config).app
        async with (
            app.router.lifespan_context(app),
            httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client,
        ):
            yield client

    @staticmethod
    def body(agent_id: str, **overrides: Any) -> dict[str, Any]:
        return {"id": agent_id, "agent": {"cls_or_fn": FACTORY, "params": valid_params(**overrides)}}

    async def test_register_list_delete(self, client: httpx.AsyncClient) -> None:
        resp = await client.post("/api/agents", json=self.body("support-bot"))
        assert resp.status_code == 200, resp.text
        info = resp.json()
        assert info["id"] == "support-bot"
        assert info["capabilities"]["identity"]["metadata"][METADATA_KEY]["kind"] == "dynamic"
        assert info["quickPrompts"] == [{"title": "Hi", "description": "Say hello", "prompt": "Hello!"}]

        resp = await client.get("/api/agents")
        assert resp.status_code == 200
        assert [a["id"] for a in resp.json()] == ["support-bot"]

        resp = await client.delete("/api/agents/support-bot")
        assert resp.status_code == 200, resp.text

        resp = await client.get("/api/agents")
        assert resp.json() == []

    @pytest.mark.usefixtures("catalog_file")
    async def test_register_with_catalog_tools(self, client: httpx.AsyncClient) -> None:
        resp = await client.post("/api/agents", json=self.body("charted", tools=["charts"]))
        assert resp.status_code == 200, resp.text
        info = resp.json()
        assert info["capabilities"]["identity"]["metadata"][METADATA_KEY]["version"] == 2
        assert info["capabilities"]["identity"]["metadata"][METADATA_KEY]["definition"]["tools"] == ["charts"]
        assert sorted(t["name"] for t in info["capabilities"]["tools"]["items"]) == ["create_chart", "create_map"]

    async def test_bad_model_is_422_not_500(self, client: httpx.AsyncClient) -> None:
        resp = await client.post("/api/agents", json=self.body("bad", model="test/nope"))
        assert resp.status_code == 422, resp.text
        assert "not allowed" in resp.json()["detail"]

    async def test_unescaped_template_is_400(self, client: httpx.AsyncClient) -> None:
        # Ravnar renders every param string as a Jinja template against the (empty) env allowlist.
        resp = await client.post("/api/agents", json=self.body("tmpl", instructions="Use {{ TONE }}"))
        assert resp.status_code == 400, resp.text

    async def test_raw_block_preserves_braces(self, client: httpx.AsyncClient) -> None:
        resp = await client.post(
            "/api/agents", json=self.body("raw", instructions="{% raw %}Use {{ TONE }}{% endraw %}")
        )
        assert resp.status_code == 200, resp.text
        definition = resp.json()["capabilities"]["identity"]["metadata"][METADATA_KEY]["definition"]
        assert definition["instructions"] == "Use {{ TONE }}"
