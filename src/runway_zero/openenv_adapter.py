from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

try:  # pragma: no cover - exercised when the latest OpenEnv SDK is installed.
    from openenv_core.env_server.interfaces import Environment as OpenEnvEnvironment

    OPENENV_SDK_AVAILABLE = True
except Exception:  # pragma: no cover - local fallback keeps tests runnable on older Python.
    OPENENV_SDK_AVAILABLE = False

    class OpenEnvEnvironment(ABC):  # type: ignore[no-redef]
        """Fallback matching the minimal OpenEnv Environment interface.

        The hackathon Space installs the OpenEnv SDK when available. Local Python 3.9
        environments can fail to import current OpenEnv releases, so this shim keeps the
        package executable while preserving the same reset/step/state contract.
        """

        def __init__(self, transform: Any | None = None):
            self.transform = transform

        @abstractmethod
        def reset(self, *args: Any, **kwargs: Any) -> Any:
            raise NotImplementedError

        @abstractmethod
        def step(self, action: Any) -> Any:
            raise NotImplementedError

        @property
        @abstractmethod
        def state(self) -> Any:
            raise NotImplementedError
