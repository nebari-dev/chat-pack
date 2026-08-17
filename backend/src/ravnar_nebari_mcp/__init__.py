__all__ = [
    "ImpersonatingMCPToolset",
    "Impersonator",
    "OIDCImpersonator",
    "__version__",
    "bearer_token_mcp_toolset_factory",
]

import time
from abc import ABC, abstractmethod
from collections.abc import Callable
from typing import cast

import httpx
import pydantic
import pydantic_ai
import pydantic_ai.mcp
from _ravnar.utils import as_awaitable
from pydantic_ai.toolsets.abstract import AbstractToolset
from pydantic_ai.toolsets.wrapper import WrapperToolset
from ravnar.authenticators import User

from ravnar_nebari_chat import __version__


class Impersonator(ABC):
    """Protocol for obtaining bearer tokens from an OIDC provider."""

    @abstractmethod
    def get_client_token(self) -> str:
        """Return a (possibly cached) client-credentials token — sync, for setup-time use."""
        ...

    @abstractmethod
    async def get_user_token(self, user_id: str) -> str:
        """Return a (possibly cached) token for *user_id* via token-exchange — async, for per-run use."""
        ...


class _OIDCConfig(pydantic.BaseModel):
    token_endpoint: str


class _OIDCTokenResponse(pydantic.BaseModel):
    access_token: str
    expires_in: float | None = None


class OIDCImpersonator(Impersonator):
    """Keycloak-based impersonation via token-exchange.

    Created once at startup. Performs synchronous OIDC discovery on init so
    that connectivity issues are surfaced immediately.
    """

    def __init__(
        self,
        *,
        issuer: str,
        client_id: str,
        client_secret: str,
        clock_skew: float = 30.0,
    ):
        self._client_id = client_id
        self._client_secret = client_secret
        self._clock_skew = clock_skew

        issuer = issuer.rstrip("/")
        discovery_url = f"{issuer}/.well-known/openid-configuration"
        with httpx.Client() as client:
            response = client.get(discovery_url).raise_for_status()
            config = _OIDCConfig.model_validate_json(response.content)

        self._token_endpoint = config.token_endpoint

        self._client_token: tuple[str, float] | None = None
        self._user_cache: dict[str, tuple[str, float]] = {}

    def get_client_token(self) -> str:
        """Return a (cached/refreshed) client-credentials bearer token."""
        cached = self._client_token
        if cached is not None:
            token, expires_at = cached
            if time.time() < expires_at:
                return token

        with httpx.Client() as client:
            response = client.post(
                self._token_endpoint,
                data={
                    "grant_type": "client_credentials",
                    "client_id": self._client_id,
                    "client_secret": self._client_secret,
                },
            ).raise_for_status()
            token_response = _OIDCTokenResponse.model_validate_json(response.content)

        access_token = token_response.access_token
        if token_response.expires_in is not None:
            self._client_token = (access_token, time.time() + token_response.expires_in - self._clock_skew)
        return access_token

    async def get_user_token(self, user_id: str) -> str:
        """Return a (cached/refreshed) bearer token for *user_id* via token-exchange."""
        cached = self._user_cache.get(user_id)
        if cached is not None:
            token, expires_at = cached
            if time.time() < expires_at:
                return token

        async with httpx.AsyncClient() as client:
            response = (
                await client.post(
                    self._token_endpoint,
                    data={
                        "grant_type": "urn:ietf:params:oauth:grant-type:token-exchange",
                        "client_id": self._client_id,
                        "client_secret": self._client_secret,
                        "subject_token": await as_awaitable(self.get_client_token),
                        "requested_subject": user_id,
                        "requested_token_type": "urn:ietf:params:oauth:token-type:access_token",
                    },
                )
            ).raise_for_status()
            token_response = _OIDCTokenResponse.model_validate_json(response.content)

        access_token = token_response.access_token
        if token_response.expires_in is not None:
            self._user_cache[user_id] = (access_token, time.time() + token_response.expires_in - self._clock_skew)
        return access_token


def bearer_token_mcp_toolset_factory(url: str) -> Callable[[str], pydantic_ai.mcp.MCPToolset]:
    def factory(bearer_token: str) -> pydantic_ai.mcp.MCPToolset:
        return pydantic_ai.mcp.MCPToolset(url, headers={"Authorization": f"Bearer {bearer_token}"})

    return factory


class ImpersonatingMCPToolset(WrapperToolset[User]):
    """Per-run MCPToolset factory that impersonates the current user.

    The placeholder (``self.wrapped``) is built at construction time with
    a client-credentials auth.  Every call to ``for_run(ctx)`` replaces it
    with a fresh ``MCPToolset`` carrying a bearer token for the current
    user, obtained via ``impersonator.get_user_token(ctx.deps.id)``.
    Each run gets an independent, race-free MCP session.
    """

    def __init__(
        self,
        *,
        mcp_toolset_factory: Callable[[str], pydantic_ai.mcp.MCPToolset],
        impersonator: Impersonator,
    ) -> None:
        client_token = impersonator.get_client_token()
        super().__init__(cast(AbstractToolset[User], mcp_toolset_factory(client_token)))
        self._mcp_toolset_factory = mcp_toolset_factory
        self._impersonator = impersonator

    async def for_run(self, ctx: pydantic_ai.RunContext[User]) -> AbstractToolset[User]:
        user_token = await self._impersonator.get_user_token(ctx.deps.id)
        return cast(AbstractToolset[User], self._mcp_toolset_factory(user_token))
