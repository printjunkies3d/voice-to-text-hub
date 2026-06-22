import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Cpu,
  Download,
  CheckCircle2,
  Loader2,
  Power,
  RefreshCw,
  Star,
  Trash2,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  fetchModelStatus,
  loadModel,
  unloadModel,
  type ModelInfo,
  type ModelStatus,
} from "@/lib/api";
import { useSettings } from "@/stores/settingsStore";

export const Route = createFileRoute("/_app/models")({
  component: ModelsPage,
});

const MODEL_DESCRIPTIONS: Record<string, string> = {
  tiny:
    "Whisper Tiny (39M parameters). Tiny footprint, runs on any laptop. Quality drops on noisy audio.",
  "tiny.en":
    "Whisper Tiny English-only (39M). Slightly more accurate than multilingual tiny on English speech.",
  base:
    "Whisper Base (74M). Fast transcription with moderate accuracy. Good first choice for short clips.",
  "base.en":
    "Whisper Base English-only (74M). Better English quality than the multilingual base at the same speed.",
  small:
    "Whisper Small (244M). Solid balance of speed and accuracy for general transcription.",
  "small.en":
    "Whisper Small English-only (244M). Recommended for English-heavy workloads on modest hardware.",
  medium:
    "Whisper Medium (769M). Higher accuracy and better punctuation; needs more RAM and time.",
  "medium.en":
    "Whisper Medium English-only (769M). Strong English accuracy with reasonable speed on GPU.",
  large:
    "Whisper Large (1.5B). Top tier multilingual accuracy. Slow on CPU; ideal on GPU.",
  "large-v1":
    "Whisper Large v1 (1.5B). Original large checkpoint. Prefer v2 or v3 unless you need v1 specifically.",
  "large-v2":
    "Whisper Large v2 (1.5B). Improved training over v1, strong all-rounder for multilingual audio.",
  "large-v3":
    "Whisper Large v3 (1.5B). Best accuracy across 99 languages, especially on noisy or accented speech.",
  turbo:
    "Whisper Large v3 Turbo. Pruned decoder for ~4x faster inference at near-large quality.",
  "distil-large-v3":
    "Distil-Whisper Large v3. ~6x faster than large with comparable English accuracy via distillation.",
};

function ModelsPage() {
  const { model: defaultModel, setModel } = useSettings();
  const [status, setStatus] = useState<ModelStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      setStatus(await fetchModelStatus());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reach the API");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onLoad = async (name: string) => {
    setBusy(name);
    setError(null);
    try {
      await loadModel(name);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setBusy(null);
    }
  };

  const onUnload = async () => {
    setBusy("__unload");
    try {
      await unloadModel();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unload failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Models"
        description="Download, load, and switch between Whisper STT models."
        actions={
          <>
            {status?.loaded ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={onUnload}
                disabled={busy === "__unload"}
              >
                {busy === "__unload" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Power className="mr-2 h-4 w-4" />
                )}
                Unload {status.loaded}
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onClick={refresh}>
              <RefreshCw
                className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")}
              />
              Refresh
            </Button>
          </>
        }
      />

      {status ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/60 px-4 py-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5" />
            {status.device} · {status.compute_type}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5" />
            default: <code className="text-foreground">{status.default}</code>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            loaded:{" "}
            <code className="text-foreground">{status.loaded ?? "none"}</code>
          </span>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {(status?.models ?? []).map((m) => (
          <ModelCard
            key={m.name}
            info={m}
            isDefault={defaultModel === m.name}
            busy={busy === m.name}
            onLoad={() => onLoad(m.name)}
            onSetDefault={() => setModel(m.name)}
          />
        ))}
        {!status && !error
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl border border-border bg-card/40"
              />
            ))
          : null}
      </div>
    </>
  );
}

function ModelCard({
  info,
  isDefault,
  busy,
  onLoad,
  onSetDefault,
}: {
  info: ModelInfo;
  isDefault: boolean;
  busy: boolean;
  onLoad: () => void;
  onSetDefault: () => void;
}) {
  const sizeLabel =
    info.cached_bytes > 0
      ? `${(info.cached_bytes / 1024 / 1024).toFixed(0)} MB on disk`
      : info.size_mb
        ? `~${info.size_mb} MB`
        : "size unknown";

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-2xl border bg-card p-4 transition-colors",
        info.loaded
          ? "border-primary/50 ring-1 ring-primary/30"
          : "border-border",
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-mono text-base font-semibold text-foreground">
            {info.name}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{sizeLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {info.loaded ? (
            <Badge className="bg-primary/20 text-primary hover:bg-primary/20">
              <Zap className="mr-1 h-3 w-3" /> Loaded
            </Badge>
          ) : info.cached ? (
            <Badge variant="secondary">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Cached
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Not downloaded
            </Badge>
          )}
          {isDefault ? (
            <Badge variant="outline" className="border-accent/50 text-accent">
              <Star className="mr-1 h-3 w-3" /> Default
            </Badge>
          ) : null}
        </div>
      </header>

      <div className="mt-auto flex items-center gap-2">
        <Button
          size="sm"
          variant={info.loaded ? "secondary" : "default"}
          onClick={onLoad}
          disabled={busy}
          className="flex-1"
        >
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : info.cached ? (
            <Power className="mr-2 h-4 w-4" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {info.loaded ? "Reload" : info.cached ? "Load" : "Download & load"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onSetDefault}
          disabled={isDefault}
          title="Use as default for new transcriptions"
        >
          <Star
            className={cn("h-4 w-4", isDefault && "fill-current text-accent")}
          />
        </Button>
      </div>
    </article>
  );
}

// Silence unused-import warning if Trash2 ever gets removed later.
void Trash2;
