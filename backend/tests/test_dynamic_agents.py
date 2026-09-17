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
        assert metadata(agent)["definition"]["mcpUrl"] == "http://mcp.internal:8080/mcp"


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
            "mcpUrl": None,
        }

        prompts = agent.get_quick_prompts()
        assert [(p.title, p.description, p.prompt) for p in prompts] == [("Hi", "Say hello", "Hello!")]

    def test_blank_description_becomes_none(self) -> None:
        agent = make_chat_agent(**valid_params(description="   "))
        assert metadata(agent)["definition"]["description"] is None

    async def test_setup_swallows_mcp_failure(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv(dynamic_agents.MCP_ALLOWED_HOSTS_ENV, "127.0.0.1")
        monkeypatch.setattr(dynamic_agents, "_MCP_TIMEOUT_SECONDS", 0.5)
        # Port 9 (discard) is not listening; the connection is refused immediately.
        agent = make_chat_agent(**valid_params(mcp_url="http://127.0.0.1:9/mcp"))

        await agent.setup()

        meta = metadata(agent)
        assert meta["setupError"] is not None
        capabilities = agent.get_capabilities()
        assert capabilities.identity is not None and capabilities.identity.name == "Support Bot"
        assert capabilities.tools is not None and capabilities.tools.items == []


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
