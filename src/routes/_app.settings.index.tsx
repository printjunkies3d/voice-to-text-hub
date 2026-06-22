import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_BASE_URL, fetchHealth, fetchModels, type ModelsResponse } from "@/lib/api";
import { useSettings } from "@/stores/settingsStore";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

// ISO 639-1 codes Whisper supports well. Empty = auto-detect.
const LANGUAGES: { code: string; label: string }[] = [
  { code: "", label: "Auto-detect" },
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "nl", label: "Dutch" },
  { code: "pl", label: "Polish" },
  { code: "ru", label: "Russian" },
  { code: "uk", label: "Ukrainian" },
  { code: "tr", label: "Turkish" },
  { code: "ar", label: "Arabic" },
  { code: "hi", label: "Hindi" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
];

const FALLBACK_MODELS = [
  "tiny",
  "tiny.en",
  "base",
  "base.en",
  "small",
  "small.en",
  "medium",
  "large-v3",
  "distil-large-v3",
];

function SettingsPage() {
  const { model, language, apiUrl, setModel, setLanguage, setApiUrl } =
    useSettings();
  const [models, setModels] = useState<ModelsResponse | null>(null);
  const [health, setHealth] = useState<"unknown" | "ok" | "down" | "checking">(
    "unknown",
  );
  const [draftUrl, setDraftUrl] = useState(apiUrl);

  useEffect(() => {
    setDraftUrl(apiUrl);
  }, [apiUrl]);

  const check = async () => {
    setHealth("checking");
    try {
      await fetchHealth();
      setHealth("ok");
      try {
        setModels(await fetchModels());
      } catch {
        /* ignore */
      }
    } catch {
      setHealth("down");
    }
  };

  useEffect(() => {
    void check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);

  const availableModels = models?.models ?? FALLBACK_MODELS;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Configure the speech-to-text model and language."
      />

      <section className="space-y-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Transcription
        </h2>

        <div className="grid gap-2">
          <Label>Whisper model</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Smaller = faster and lighter. Larger = more accurate.
          </p>
        </div>

        <div className="grid gap-2">
          <Label>Language</Label>
          <Select
            value={language || "__auto"}
            onValueChange={(v) => setLanguage(v === "__auto" ? "" : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.code || "__auto"} value={l.code || "__auto"}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Backend
        </h2>

        <div className="grid gap-2">
          <Label htmlFor="apiUrl">API URL override</Label>
          <div className="flex gap-2">
            <Input
              id="apiUrl"
              placeholder={API_BASE_URL}
              value={draftUrl}
              onChange={(e) => setDraftUrl(e.target.value)}
            />
            <Button
              variant="secondary"
              onClick={() => setApiUrl(draftUrl.trim())}
            >
              Save
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Leave blank to use the build-time default ({API_BASE_URL}). Set
            this to point at your running <code>api/</code> server.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            {health === "ok" ? (
              <CheckCircle2 className="h-4 w-4 text-accent" />
            ) : health === "down" ? (
              <XCircle className="h-4 w-4 text-destructive" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <span>
              {health === "ok"
                ? "Backend reachable"
                : health === "down"
                  ? "Backend unreachable"
                  : "Checking…"}
            </span>
            {models ? (
              <span className="text-xs text-muted-foreground">
                · {models.device} / {models.compute_type}
              </span>
            ) : null}
          </div>
          <Button size="sm" variant="ghost" onClick={check}>
            Re-check
          </Button>
        </div>
      </section>
    </>
  );
}
