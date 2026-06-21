/**
 * Tiny API client for the Voicebox-STT FastAPI backend.
 * Configure with VITE_API_URL (defaults to http://localhost:8000).
 */

import { useSettings } from "@/stores/settingsStore";

export const DEFAULT_API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:8000";

/** Back-compat alias used by older callers. */
export const API_BASE_URL = DEFAULT_API_URL;

function baseUrl(): string {
  const override = useSettings.getState().apiUrl?.trim().replace(/\/$/, "");
  return override || DEFAULT_API_URL;
}

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

export interface ModelInfo {
  name: string;
  size_mb: number;
  cached: boolean;
  cached_bytes: number;
  loaded: boolean;
}

export interface ModelStatus {
  default: string;
  loaded: string | null;
  device: string;
  compute_type: string;
  models: ModelInfo[];
}

export async function fetchModels(): Promise<ModelsResponse> {
  const res = await fetch(`${baseUrl()}/models`);
  if (!res.ok) throw new Error(`Failed to load models (${res.status})`);
  return res.json();
}

export async function fetchModelStatus(): Promise<ModelStatus> {
  const res = await fetch(`${baseUrl()}/models/status`);
  if (!res.ok) throw new Error(`Failed to load model status (${res.status})`);
  return res.json();
}

export async function loadModel(name: string): Promise<{ message: string }> {
  const res = await fetch(
    `${baseUrl()}/models/${encodeURIComponent(name)}/load`,
    { method: "POST" },
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Load failed (${res.status})${detail ? `: ${detail}` : ""}`);
  }
  return res.json();
}

export async function unloadModel(): Promise<{ message: string }> {
  const res = await fetch(`${baseUrl()}/models/unload`, { method: "POST" });
  if (!res.ok) throw new Error(`Unload failed (${res.status})`);
  return res.json();
}

export async function fetchHealth(): Promise<{ status: string }> {
  const res = await fetch(`${baseUrl()}/health`);
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

  const res = await fetch(`${baseUrl()}/transcribe`, {
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
