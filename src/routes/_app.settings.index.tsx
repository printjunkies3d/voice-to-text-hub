import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, Book, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingRow, SettingSection } from "@/components/SettingRow";
import { API_BASE_URL, fetchHealth, fetchModels, type ModelsResponse } from "@/lib/api";
import { useSettings } from "@/stores/settingsStore";

export const Route = createFileRoute("/_app/settings/")({
  component: GeneralPage,
});

function GeneralPage() {
  const { apiUrl, setApiUrl } = useSettings();
  const [models, setModels] = useState<ModelsResponse | null>(null);
  const [health, setHealth] = useState<"unknown" | "ok" | "down" | "checking">(
    "unknown",
  );
  const [draftUrl, setDraftUrl] = useState(apiUrl);

  useEffect(() => setDraftUrl(apiUrl), [apiUrl]);

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

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <a
          href="https://github.com/voicebox-ai/voicebox"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 rounded-lg border border-border/60 p-4 transition-colors hover:bg-muted/50"
        >
          <Book className="h-5 w-5 shrink-0 text-primary" strokeWidth={2.5} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">Documentation</div>
            <div className="text-xs text-muted-foreground">
              Learn how to use Voicebox STT
            </div>
          </div>
        </a>
        <a
          href="https://github.com/voicebox-ai/voicebox"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 rounded-lg border border-border/60 p-4 transition-colors hover:bg-muted/50"
        >
          <Github className="h-5 w-5 shrink-0 text-primary" strokeWidth={2.5} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">GitHub</div>
            <div className="text-xs text-muted-foreground">
              Source, issues, releases
            </div>
          </div>
        </a>
      </div>

      <SettingSection title="Server" description="Connection to your STT backend.">
        <SettingRow
          title="Server URL"
          description={`Base URL of the api/ service. Default ${API_BASE_URL}.`}
          action={
            <div className="flex items-center gap-2 rounded-full border border-border/60 px-3 py-1">
              {health === "ok" ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  <span className="text-xs text-muted-foreground">Online</span>
                </>
              ) : health === "down" ? (
                <>
                  <XCircle className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-xs text-destructive">Offline</span>
                </>
              ) : (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Checking
                  </span>
                </>
              )}
            </div>
          }
        >
          <div className="flex gap-2">
            <Input
              placeholder={API_BASE_URL}
              value={draftUrl}
              onChange={(e) => setDraftUrl(e.target.value)}
            />
            {draftUrl.trim() !== apiUrl ? (
              <Button size="sm" onClick={() => setApiUrl(draftUrl.trim())}>
                Save
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={check}>
                Re-check
              </Button>
            )}
          </div>
          {models ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {models.device} · {models.compute_type}
              {health === "ok" ? (
                <CheckCircle2 className="ml-1.5 inline h-3 w-3 text-primary" />
              ) : null}
            </p>
          ) : null}
        </SettingRow>

        <SettingRow
          title="Theme"
          description="Voicebox STT uses a dark studio theme by default."
          action={
            <Select value="dark" disabled>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      </SettingSection>
    </div>
  );
}
