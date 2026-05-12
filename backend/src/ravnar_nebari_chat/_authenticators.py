from __future__ import annotations

from ravnar.authenticators import BearerTokenAuthenticator, OIDCTokenValidator


def keycloak_authenticator(
    *, keycloak_url: str, realm: str = "nebari", client_id: str | None = None
) -> BearerTokenAuthenticator:
    return BearerTokenAuthenticator(
        OIDCTokenValidator(issuer=f"{keycloak_url.rstrip('/')}/realms/{realm}", audience=client_id)
    )
