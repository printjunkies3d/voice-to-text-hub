"""Pydantic response models."""
from __future__ import annotations

from pydantic import BaseModel


class Segment(BaseModel):
    start: float
    end: float
    text: str


class TranscriptionResponse(BaseModel):
    text: str
    language: str | None = None
    duration: float
    segments: list[Segment] = []


class ModelsResponse(BaseModel):
    models: list[str]
    default: str
    device: str
    compute_type: str


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "voicebox-stt-api"
