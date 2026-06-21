"""Lazy-loaded Whisper transcription service backed by faster-whisper."""
from __future__ import annotations

import asyncio
from threading import Lock
from typing import Optional

from ..config import settings


class WhisperService:
    """Single-process singleton that lazily loads Whisper models on demand."""

    def __init__(self) -> None:
        self._model = None
        self._model_size: Optional[str] = None
        self._lock = Lock()

    def _load(self, model_size: str):
        # Imported lazily so the API module doesn't pay the import cost at boot.
        from faster_whisper import WhisperModel

        return WhisperModel(
            model_size,
            device=settings.device,
            compute_type=settings.compute_type,
        )

    def _get(self, model_size: str):
        with self._lock:
            if self._model is None or self._model_size != model_size:
                self._model = self._load(model_size)
                self._model_size = model_size
            return self._model

    async def transcribe(
        self,
        path: str,
        language: Optional[str],
        model_size: str,
    ) -> dict:
        def run() -> dict:
            model = self._get(model_size)
            segments_iter, info = model.transcribe(
                path,
                language=language or None,
                vad_filter=True,
            )
            segments = [
                {"start": float(s.start), "end": float(s.end), "text": s.text.strip()}
                for s in segments_iter
            ]
            text = " ".join(s["text"] for s in segments).strip()
            return {
                "text": text,
                "language": info.language,
                "duration": float(info.duration),
                "segments": segments,
            }

        return await asyncio.to_thread(run)


whisper_service = WhisperService()
