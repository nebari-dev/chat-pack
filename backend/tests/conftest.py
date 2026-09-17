import pytest

from ravnar_nebari_chat import dynamic_agents

ALLOWED_MODELS = ["test/model-a", "test/model-b"]


@pytest.fixture(autouse=True)
def authoring_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """A deployment where agent authoring is configured and MCP is disabled."""
    monkeypatch.setenv(dynamic_agents.ALLOWED_MODELS_ENV, ",".join(ALLOWED_MODELS))
    monkeypatch.setenv(dynamic_agents.API_KEY_ENV, "sk-test")
    monkeypatch.delenv(dynamic_agents.MCP_ALLOWED_HOSTS_ENV, raising=False)
