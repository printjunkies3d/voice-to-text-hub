"""STT-only transcription endpoint.

Mirrors the shape of the original voicebox `backend/routes/transcription.py`
but trimmed: no DB, no background download task tracking, no TTS coupling.
"""
from __future__ import annotations

import tempfile
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from ..config import WHISPER_MODELS, settings
from ..models import TranscriptionResponse
from ..services.transcribe import whisper_service

router = APIRouter()

UPLOAD_CHUNK_SIZE = 1024 * 1024  # 1 MiB


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    language: Optional[str] = Form(None),
    model: Optional[str] = Form(None),
) -> TranscriptionResponse:
    model_size = model or settings.default_model
    if model_size not in WHISPER_MODELS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid model '{model_size}'. Must be one of: {', '.join(WHISPER_MODELS)}",
        )

    suffix = Path(file.filename or "audio").suffix or ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        while chunk := await file.read(UPLOAD_CHUNK_SIZE):
            tmp.write(chunk)
        tmp_path = tmp.name

    try:
        result = await whisper_service.transcribe(tmp_path, language, model_size)
        return TranscriptionResponse(**result)
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001 - surface as HTTP error
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        Path(tmp_path).unlink(missing_ok=True)
