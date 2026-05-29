from __future__ import annotations

from ravnar.authenticators import BearerTokenAuthenticator, OIDCTokenValidator, ALL_PERMISSIONS


def keycloak_authenticator(*, keycloak_url: str, realm: str = "nebari") -> BearerTokenAuthenticator:
    return BearerTokenAuthenticator(
        OIDCTokenValidator(
            issuer=f"{keycloak_url.rstrip('/')}/realms/{realm}",
            default_permissions=ALL_PERMISSIONS,
        )
    )
