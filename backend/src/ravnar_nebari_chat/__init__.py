__all__ = ["__version__", "demo_agents", "keycloak_authenticator"]

from . import demo_agents
from ._authenticators import keycloak_authenticator

try:
    from ._version import __version__
except ModuleNotFoundError:
    import warnings

    warnings.warn("ravnar_nebari was not properly installed!", stacklevel=2)
    del warnings

    __version__ = "UNKNOWN"
