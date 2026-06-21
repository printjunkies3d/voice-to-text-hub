"""Runtime configuration loaded from environment variables."""
from __future__ import annotations

import os
from dataclasses import dataclass


WHISPER_MODELS = [
    "tiny",
    "tiny.en",
    "base",
    "base.en",
    "small",
    "small.en",
    "medium",
    "medium.en",
    "large-v2",
    "large-v3",
    "distil-large-v3",
]


@dataclass(frozen=True)
class Settings:
    default_model: str = os.getenv("WHISPER_MODEL", "base")
    device: str = os.getenv("WHISPER_DEVICE", "cpu")
    compute_type: str = os.getenv("WHISPER_COMPUTE", "int8")
    cors_origins: tuple[str, ...] = tuple(
        o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()
    )


settings = Settings()
