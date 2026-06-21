/**
 * Tiny API client for the Voicebox-STT FastAPI backend.
 * Configure with VITE_API_URL (defaults to http://localhost:8000).
 */

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:8000";

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResponse {
  text: string;
  language: string | null;
  duration: number;
  segments: TranscriptionSegment[];
}

export interface ModelsResponse {
  models: string[];
  default: string;
  device: string;
  compute_type: string;
}

export async function fetchModels(): Promise<ModelsResponse> {
  const res = await fetch(`${API_BASE_URL}/models`);
  if (!res.ok) throw new Error(`Failed to load models (${res.status})`);
  return res.json();
}

export async function fetchHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error(`Health check failed (${res.status})`);
  return res.json();
}

export async function transcribe(
  blob: Blob,
  opts: { language?: string; model?: string; filename?: string } = {},
): Promise<TranscriptionResponse> {
  const form = new FormData();
  form.append("file", blob, opts.filename ?? "audio.webm");
  if (opts.language) form.append("language", opts.language);
  if (opts.model) form.append("model", opts.model);

  const res = await fetch(`${API_BASE_URL}/transcribe`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `Transcription failed (${res.status})${detail ? `: ${detail}` : ""}`,
    );
  }
  return res.json();
}
