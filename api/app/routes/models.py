from fastapi import APIRouter

from ..config import WHISPER_MODELS, settings
from ..models import ModelsResponse

router = APIRouter()


@router.get("/models", response_model=ModelsResponse)
async def list_models() -> ModelsResponse:
    return ModelsResponse(
        models=WHISPER_MODELS,
        default=settings.default_model,
        device=settings.device,
        compute_type=settings.compute_type,
    )
