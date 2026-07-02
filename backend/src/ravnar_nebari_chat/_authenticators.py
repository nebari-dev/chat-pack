from __future__ import annotations

from ravnar.authenticators import ALL_PERMISSIONS, BearerTokenAuthenticator, OIDCTokenValidator, User

ACCESS_TOKEN_DATA_KEY = "access_token"


def keycloak_authenticator(*, keycloak_url: str, realm: str = "nebari") -> BearerTokenAuthenticator:
    validate = OIDCTokenValidator(
        issuer=f"{keycloak_url.rstrip('/')}/realms/{realm}",
        default_permissions=list(ALL_PERMISSIONS),
    )

    def validate_and_capture_token(token: str) -> User:
        # Keep the raw bearer token on the user so agents can forward it to
        # downstream services that accept the same Keycloak-issued token (e.g.
        # the nebari-frames MCP endpoint). It stays server-side: User.data is
        # never persisted or returned by any API endpoint.
        user = validate(token)
        user.data[ACCESS_TOKEN_DATA_KEY] = token
        return user

    return BearerTokenAuthenticator(validate_and_capture_token)
