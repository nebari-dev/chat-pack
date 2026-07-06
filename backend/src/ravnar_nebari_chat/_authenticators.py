from __future__ import annotations

from ravnar.authenticators import ALL_PERMISSIONS, BearerTokenAuthenticator, OIDCTokenValidator


def keycloak_authenticator(*, keycloak_url: str, realm: str = "nebari") -> BearerTokenAuthenticator:
    return BearerTokenAuthenticator(
        OIDCTokenValidator(
            issuer=f"{keycloak_url.rstrip('/')}/realms/{realm}",
            default_permissions=list(ALL_PERMISSIONS),
        )
    )
