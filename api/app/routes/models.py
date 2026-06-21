from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..config import WHISPER_MODELS, settings
from ..models import ModelsResponse
from ..services.transcribe import (
    MODEL_SIZE_HINTS_MB,
    cached_size_bytes,
    is_cached,
    whisper_service,
)

router = APIRouter()


class ModelInfo(BaseModel):
    name: str
    size_mb: int
    cached: bool
    cached_bytes: int
    loaded: bool


class ModelStatus(BaseModel):
    default: str
    loaded: str | None
    device: str
    compute_type: str
    models: list[ModelInfo]


class ActionResponse(BaseModel):
    message: str


@router.get("/models", response_model=ModelsResponse)
async def list_models() -> ModelsResponse:
    return ModelsResponse(
        models=WHISPER_MODELS,
        default=settings.default_model,
        device=settings.device,
        compute_type=settings.compute_type,
    )


@router.get("/models/status", response_model=ModelStatus)
async def models_status() -> ModelStatus:
    loaded = whisper_service.loaded_model
    return ModelStatus(
        default=settings.default_model,
        loaded=loaded,
        device=settings.device,
        compute_type=settings.compute_type,
        models=[
            ModelInfo(
                name=m,
                size_mb=MODEL_SIZE_HINTS_MB.get(m, 0),
                cached=is_cached(m),
                cached_bytes=cached_size_bytes(m),
                loaded=loaded == m,
            )
            for m in WHISPER_MODELS
        ],
    )


@router.post("/models/{model_name}/load", response_model=ActionResponse)
async def load_model(model_name: str) -> ActionResponse:
    if model_name not in WHISPER_MODELS:
        raise HTTPException(status_code=400, detail=f"Unknown model: {model_name}")
    try:
        await whisper_service.ensure_loaded(model_name)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return ActionResponse(message=f"Model {model_name} loaded.")


@router.post("/models/unload", response_model=ActionResponse)
async def unload_model() -> ActionResponse:
    was_loaded = whisper_service.unload()
    return ActionResponse(
        message="Model unloaded." if was_loaded else "No model was loaded."
    )
