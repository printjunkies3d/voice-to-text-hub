# Voicebox-STT API

A minimal, self-contained Python FastAPI backend for speech-to-text only.
Inspired by the structure of the original [voicebox](https://github.com/voicebox-ai/voicebox)
`backend/`, stripped down to transcription endpoints (no TTS, no auth, no cloud).

## Stack

- **FastAPI** — HTTP API
- **faster-whisper** — CTranslate2 build of OpenAI Whisper (runs on CPU or GPU)
- **Uvicorn** — ASGI server

## Run locally

```bash
cd api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The first transcription downloads the selected Whisper model (cached under
`~/.cache/huggingface/`). Use `WHISPER_DEVICE=cuda` for GPU.

## Endpoints

| Method | Path              | Description                                  |
| ------ | ----------------- | -------------------------------------------- |
| GET    | `/health`         | Liveness check                               |
| GET    | `/models`         | List available Whisper model sizes           |
| POST   | `/transcribe`     | Multipart upload `file`, optional `language`, `model` |

`POST /transcribe` response:

```json
{
  "text": "Hello world",
  "language": "en",
  "duration": 1.42,
  "segments": [{ "start": 0.0, "end": 1.42, "text": "Hello world" }]
}
```

## Docker

```bash
docker build -t voicebox-stt-api .
docker run --rm -p 8000:8000 voicebox-stt-api
```

## Configuration

| Env var            | Default      | Purpose                                |
| ------------------ | ------------ | -------------------------------------- |
| `WHISPER_MODEL`    | `base`       | Default model when client omits one    |
| `WHISPER_DEVICE`   | `cpu`        | `cpu` or `cuda`                        |
| `WHISPER_COMPUTE`  | `int8`       | Compute type (e.g. `int8`, `float16`)  |
| `CORS_ORIGINS`     | `*`          | Comma-separated CORS allow list        |
