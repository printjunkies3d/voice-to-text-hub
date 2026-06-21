"""Lazy-loaded Whisper transcription service backed by faster-whisper.

Also exposes hooks for the Models tab: explicit load, unload, and
on-disk cache lookups so the UI can show whether a model is downloaded
and/or currently resident in memory.
"""
from __future__ import annotations

import asyncio
import os
from pathlib import Path
from threading import Lock
from typing import Optional

from ..config import settings


# Rough on-disk size (MB) for the int8 / default faster-whisper builds.
# Used by the Models tab purely as a UI hint.
MODEL_SIZE_HINTS_MB: dict[str, int] = {
    "tiny": 75,
    "tiny.en": 75,
    "base": 145,
    "base.en": 145,
    "small": 480,
    "small.en": 480,
    "medium": 1530,
    "medium.en": 1530,
    "large-v2": 3090,
    "large-v3": 3090,
    "distil-large-v3": 1510,
}


def _hf_cache_dir() -> Path:
    """Resolve the HuggingFace hub cache directory used by faster-whisper."""
    env = os.getenv("HF_HOME") or os.getenv("HUGGINGFACE_HUB_CACHE")
    if env:
        return Path(env).expanduser()
    return Path.home() / ".cache" / "huggingface" / "hub"


def _model_repo_dir(model_size: str) -> Path:
    """Where huggingface_hub stores the Systran/faster-whisper-* snapshot."""
    repo = f"models--Systran--faster-whisper-{model_size}"
    return _hf_cache_dir() / repo


def is_cached(model_size: str) -> bool:
    d = _model_repo_dir(model_size)
    if not d.exists():
        return False
    # A populated snapshot has at least one file under snapshots/<rev>/.
    snapshots = d / "snapshots"
    if not snapshots.exists():
        return False
    return any(snapshots.iterdir())


def cached_size_bytes(model_size: str) -> int:
    d = _model_repo_dir(model_size)
    if not d.exists():
        return 0
    total = 0
    for f in d.rglob("*"):
        try:
            if f.is_file() and not f.is_symlink():
                total += f.stat().st_size
        except OSError:
            continue
    return total


class WhisperService:
    """Single-process singleton that lazily loads Whisper models on demand."""

    def __init__(self) -> None:
        self._model = None
        self._model_size: Optional[str] = None
        self._lock = Lock()

    @property
    def loaded_model(self) -> Optional[str]:
        return self._model_size

    def _load(self, model_size: str):
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

    async def ensure_loaded(self, model_size: str) -> None:
        """Force-load a model into memory (downloads it if missing)."""
        await asyncio.to_thread(self._get, model_size)

    def unload(self) -> bool:
        """Drop the in-memory model. Returns True if anything was unloaded."""
        with self._lock:
            if self._model is None:
                return False
            self._model = None
            self._model_size = None
            return True

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
