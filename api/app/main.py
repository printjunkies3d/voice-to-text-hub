"""FastAPI application entrypoint for the Voicebox-STT API."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routes import health, models, transcription


def create_app() -> FastAPI:
    app = FastAPI(
        title="Voicebox-STT API",
        version="0.1.0",
        description="Speech-to-text only backend (Whisper via faster-whisper).",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins) if settings.cors_origins else ["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router, tags=["health"])
    app.include_router(models.router, tags=["models"])
    app.include_router(transcription.router, tags=["transcription"])

    return app


app = create_app()
