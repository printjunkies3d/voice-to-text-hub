import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2, Copy, Save } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { LiveMeter } from "@/components/LiveMeter";
import { Waveform } from "@/components/Waveform";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { transcribe } from "@/lib/api";
import { useSettings } from "@/stores/settingsStore";
import { useHistory } from "@/stores/historyStore";

export const Route = createFileRoute("/_app/")({
  component: DictatePage,
});

function pickMimeType(): string | undefined {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (const t of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return undefined;
}

function DictatePage() {
  const { model, language } = useSettings();
  const addToHistory = useHistory((s) => s.add);

  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [language_, setLanguage_] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [stream]);

  const start = useCallback(async () => {
    setError(null);
    setTranscript("");
    setBlob(null);
    setLanguage_(null);
    setDuration(null);

    let s: MediaStream;
    try {
      s = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch {
      setError("Microphone access denied. Allow mic access in your browser.");
      return;
    }

    const mimeType = pickMimeType();
    if (!mimeType) {
      s.getTracks().forEach((t) => t.stop());
      setError("This browser can't record a supported audio format.");
      return;
    }

    const recorder = new MediaRecorder(s, { mimeType });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const out = new Blob(chunksRef.current, { type: recorder.mimeType });
      setBlob(out);
      s.getTracks().forEach((t) => t.stop());
      setStream(null);
    };

    recorder.start(250);
    recorderRef.current = recorder;
    setStream(s);
    setRecording(true);
    startedAtRef.current = Date.now();
    setElapsed(0);
    tickRef.current = window.setInterval(() => {
      setElapsed((Date.now() - startedAtRef.current) / 1000);
    }, 100);
  }, []);

  const stop = useCallback(() => {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    recorderRef.current?.stop();
    setRecording(false);
  }, []);

  const send = useCallback(async () => {
    if (!blob) return;
    if (blob.size < 1024) {
      setError("That recording was too short. Try again.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      const result = await transcribe(blob, {
        model,
        language: language || undefined,
        filename: `dictation.${ext}`,
      });
      setTranscript(result.text);
      setLanguage_(result.language);
      setDuration(result.duration);
      addToHistory({
        text: result.text,
        language: result.language,
        duration: result.duration,
        model,
        source: "dictate",
        segments: result.segments,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transcription failed");
    } finally {
      setPending(false);
    }
  }, [blob, model, language, addToHistory]);

  // Auto-transcribe when a fresh recording finishes.
  useEffect(() => {
    if (blob && !transcript && !pending) {
      void send();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blob]);

  return (
    <>
      <PageHeader
        title="Dictate"
        description="Record from your microphone, transcribe with Whisper."
      />

      <section className="glass-panel rounded-2xl p-8">
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={recording ? stop : start}
            className={cn(
              "relative flex h-28 w-28 items-center justify-center rounded-full transition-all",
              recording
                ? "bg-signal text-signal-foreground recording-pulse"
                : "bg-primary text-primary-foreground hover:scale-105",
            )}
            aria-label={recording ? "Stop recording" : "Start recording"}
          >
            {recording ? (
              <Square className="h-10 w-10" fill="currentColor" />
            ) : (
              <Mic className="h-10 w-10" />
            )}
          </button>

          <div className="text-center">
            <div className="font-mono text-3xl tabular-nums tracking-tight text-foreground">
              {formatClock(elapsed)}
            </div>
            <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
              {recording
                ? "Recording"
                : blob
                  ? "Ready"
                  : "Tap mic to start"}
            </div>
          </div>

          <LiveMeter stream={stream} />
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          {error}
        </div>
      ) : null}

      {pending ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Transcribing with Whisper ({model})…
        </div>
      ) : null}

      {blob && !pending ? <Waveform src={blob} /> : null}

      {transcript ? (
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {language_ ? <span>lang: {language_}</span> : null}
              {duration ? <span>· {duration.toFixed(1)}s</span> : null}
              <span>· {model}</span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigator.clipboard.writeText(transcript)}
              >
                <Copy className="mr-2 h-4 w-4" /> Copy
              </Button>
              <Button size="sm" variant="secondary" onClick={() => send()}>
                <Save className="mr-2 h-4 w-4" /> Re-transcribe
              </Button>
            </div>
          </div>
          <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
            {transcript}
          </p>
        </section>
      ) : null}
    </>
  );
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds * 10) % 10);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${ms}`;
}
