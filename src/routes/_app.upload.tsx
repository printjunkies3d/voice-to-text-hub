import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { Upload as UploadIcon, Loader2, Copy } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Waveform } from "@/components/Waveform";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { transcribe } from "@/lib/api";
import { useSettings } from "@/stores/settingsStore";
import { useHistory } from "@/stores/historyStore";

export const Route = createFileRoute("/_app/upload")({
  component: UploadPage,
});

function UploadPage() {
  const { model, language } = useSettings();
  const addToHistory = useHistory((s) => s.add);

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [duration, setDuration] = useState<number | null>(null);
  const [language_, setLanguage_] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setTranscript("");
    setError(null);
    setDuration(null);
    setLanguage_(null);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const run = useCallback(async () => {
    if (!file) return;
    setPending(true);
    setError(null);
    try {
      const result = await transcribe(file, {
        model,
        language: language || undefined,
        filename: file.name,
      });
      setTranscript(result.text);
      setDuration(result.duration);
      setLanguage_(result.language);
      addToHistory({
        text: result.text,
        language: result.language,
        duration: result.duration,
        model,
        source: "upload",
        filename: file.name,
        segments: result.segments,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transcription failed");
    } finally {
      setPending(false);
    }
  }, [file, model, language, addToHistory]);

  return (
    <>
      <PageHeader
        title="Upload"
        description="Drop an audio file to transcribe it."
      />

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-colors",
          dragging
            ? "border-primary bg-primary/10"
            : "border-border bg-card/40 hover:border-primary/50",
        )}
      >
        <UploadIcon className="h-10 w-10 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {file ? file.name : "Drop audio here or click to browse"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            wav · mp3 · m4a · webm · ogg · flac
          </p>
        </div>
        <input
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </label>

      {file ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
          <div className="text-sm">
            <div className="font-medium text-foreground">{file.name}</div>
            <div className="text-xs text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type || "audio"}
            </div>
          </div>
          <Button onClick={run} disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transcribing…
              </>
            ) : (
              "Transcribe"
            )}
          </Button>
        </div>
      ) : null}

      {file ? <Waveform src={file} /> : null}

      {error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          {error}
        </div>
      ) : null}

      {transcript ? (
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              {language_ ? <span>lang: {language_}</span> : null}
              {duration ? <span>· {duration.toFixed(1)}s</span> : null}
              <span>· {model}</span>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigator.clipboard.writeText(transcript)}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
          </div>
          <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
            {transcript}
          </p>
        </section>
      ) : null}
    </>
  );
}
