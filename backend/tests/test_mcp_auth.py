"""Per-user MCP access through OIDC token exchange, against a fake provider."""

import functools
import json
from typing import Any
from urllib.parse import parse_qs

import httpx
import pydantic_ai
import pytest
from pydantic_ai.mcp import MCPServerStreamableHTTP
from pydantic_ai.models.test import TestModel
from pydantic_ai.usage import RunUsage
from ravnar.authenticators import User

from ravnar_nebari_chat import dynamic_agents
from ravnar_nebari_chat.dynamic_agents import make_chat_agent
from ravnar_nebari_mcp import ImpersonatingMCPToolset, OIDCImpersonator, bearer_token_mcp_toolset_factory

ISSUER = "https://keycloak.example/realms/nebari"
TOKEN_ENDPOINT = f"{ISSUER}/protocol/openid-connect/token"


class FakeProvider:
    """Answers OIDC discovery and both grant types, recording every token request."""

    def __init__(self, *, fail_discovery: bool = False) -> None:
        self.requests: list[dict[str, str]] = []
        self.fail_discovery = fail_discovery
        self.transport = httpx.MockTransport(self.handle)
        self.async_transport = httpx.MockTransport(self.handle)

    def impersonator(self) -> OIDCImpersonator:
        return OIDCImpersonator(
            issuer=ISSUER,
            client_id="chat-backend",
            client_secret="s3cret",
            transport=self.transport,
            async_transport=self.async_transport,
        )

    def install(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Make the factory's lazily imported ``OIDCImpersonator`` talk to this fake."""
        import ravnar_nebari_mcp

        monkeypatch.setattr(
            ravnar_nebari_mcp,
            "OIDCImpersonator",
            functools.partial(OIDCImpersonator, transport=self.transport, async_transport=self.async_transport),
        )
        dynamic_agents._impersonator.cache_clear()

    def handle(self, request: httpx.Request) -> httpx.Response:
        if request.url.path.endswith("/.well-known/openid-configuration"):
            if self.fail_discovery:
                return httpx.Response(500, text="boom")
            return httpx.Response(200, json={"token_endpoint": TOKEN_ENDPOINT})
        if str(request.url) == TOKEN_ENDPOINT:
            form = {k: v[0] for k, v in parse_qs(request.content.decode()).items()}
            self.requests.append(form)
            if form["grant_type"] == "client_credentials":
                return httpx.Response(200, json={"access_token": "client-token", "expires_in": 300})
            assert form["subject_token"] == "client-token"
            return httpx.Response(200, json={"access_token": f"user-{form['requested_subject']}", "expires_in": 300})
        return httpx.Response(404)


@pytest.fixture
def provider(monkeypatch: pytest.MonkeyPatch) -> FakeProvider:
    """A fake OIDC provider.

    The factory imports ``OIDCImpersonator`` lazily and constructs it without transports, so the
    class is patched with a partial that injects the fake's. httpx itself is left alone: other
    libraries subclass and ``isinstance``-check its clients.
    """
    fake = FakeProvider()
    fake.install(monkeypatch)
    return fake


@pytest.fixture
def impersonation_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv(dynamic_agents.IMPERSONATION_ISSUER_ENV, ISSUER)
    monkeypatch.setenv(dynamic_agents.IMPERSONATION_CLIENT_ID_ENV, "chat-backend")
    monkeypatch.setenv(dynamic_agents.IMPERSONATION_CLIENT_SECRET_ENV, "s3cret")


def run_context(user_id: str) -> pydantic_ai.RunContext[User]:
    return pydantic_ai.RunContext(deps=User(id=user_id), model=TestModel(), usage=RunUsage())


def bearer(toolset: Any) -> str:
    assert isinstance(toolset, MCPServerStreamableHTTP)
    assert toolset.headers is not None
    return toolset.headers["Authorization"]


class TestOIDCImpersonator:
    def test_discovers_and_caches_tokens(self, provider: FakeProvider) -> None:
        impersonator = provider.impersonator()
        assert impersonator.token_endpoint == TOKEN_ENDPOINT

        assert impersonator.get_client_token() == "client-token"
        assert impersonator.get_client_token() == "client-token"
        assert [r["grant_type"] for r in provider.requests] == ["client_credentials"]

    async def test_exchanges_for_the_user(self, provider: FakeProvider) -> None:
        impersonator = provider.impersonator()

        assert await impersonator.get_user_token("alice") == "user-alice"
        assert await impersonator.get_user_token("alice") == "user-alice"
        assert await impersonator.get_user_token("bob") == "user-bob"

        exchanges = [r for r in provider.requests if r["grant_type"].endswith("token-exchange")]
        assert [r["requested_subject"] for r in exchanges] == ["alice", "bob"]
        assert all(r["requested_token_type"].endswith("access_token") for r in exchanges)


class TestImpersonatingMCPToolset:
    async def test_swaps_in_a_per_user_client_each_run(self, provider: FakeProvider) -> None:
        impersonator = provider.impersonator()
        toolset = ImpersonatingMCPToolset(
            mcp_toolset_factory=bearer_token_mcp_toolset_factory(
                "https://secure.example/mcp", id="secure", tool_prefix="sec", timeout=7
            ),
            impersonator=impersonator,
        )

        # The placeholder used for registration-time discovery carries the client token.
        assert toolset.id == "secure"
        assert bearer(toolset.wrapped) == "Bearer client-token"

        alice = await toolset.for_run(run_context("alice"))
        bob = await toolset.for_run(run_context("bob"))
        assert bearer(alice) == "Bearer user-alice"
        assert bearer(bob) == "Bearer user-bob"
        assert alice is not bob
        assert isinstance(alice, MCPServerStreamableHTTP)
        assert alice.url == "https://secure.example/mcp"
        assert alice.tool_prefix == "sec"
        assert alice.timeout == 7


@pytest.mark.usefixtures("catalog_file", "impersonation_env")
class TestFactoryWiring:
    def test_builds_impersonating_toolset_for_catalog_server(self, provider: FakeProvider) -> None:
        agent = make_chat_agent(
            name="Bot",
            instructions="Help.",
            model="test/model-a",
            mcp_servers=[{"server": "secure"}, {"server": "frames"}],
        )

        toolsets = agent._agent.toolsets
        impersonating = [t for t in toolsets if isinstance(t, ImpersonatingMCPToolset)]
        plain = [t for t in toolsets if isinstance(t, MCPServerStreamableHTTP)]
        assert len(impersonating) == 1 and len(plain) == 1
        assert impersonating[0].id == "secure"
        assert bearer(impersonating[0].wrapped) == "Bearer client-token"
        assert plain[0].id == "frames"
        assert plain[0].headers is None

    def test_reuses_one_impersonator_per_client_config(self, provider: FakeProvider) -> None:
        for _ in range(2):
            make_chat_agent(name="Bot", instructions="Help.", model="test/model-a", mcp_servers=[{"server": "secure"}])
        # One discovery and one client-credentials grant shared across registrations.
        assert [r["grant_type"] for r in provider.requests] == ["client_credentials"]

    def test_discovery_failure_is_503(self, monkeypatch: pytest.MonkeyPatch) -> None:
        fake = FakeProvider(fail_discovery=True)
        fake.install(monkeypatch)

        with pytest.raises(Exception) as info:
            make_chat_agent(name="Bot", instructions="Help.", model="test/model-a", mcp_servers=[{"server": "secure"}])
        assert getattr(info.value, "status_code", None) == 503
        assert "misconfigured" in json.dumps(getattr(info.value, "detail", ""))
