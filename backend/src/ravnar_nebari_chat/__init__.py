__all__ = ["__version__", "catalog", "demo_agents", "dynamic_agents", "keycloak_authenticator"]

from . import catalog, demo_agents, dynamic_agents
from ._authenticators import keycloak_authenticator

try:
    from ._version import __version__
except ModuleNotFoundError:
    import warnings

    warnings.warn("ravnar_nebari was not properly installed!", stacklevel=2)
    del warnings

    __version__ = "UNKNOWN"
