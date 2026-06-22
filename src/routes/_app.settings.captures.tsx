import { createFileRoute } from "@tanstack/react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingRow, SettingSection } from "@/components/SettingRow";
import { useSettings } from "@/stores/settingsStore";

export const Route = createFileRoute("/_app/settings/captures")({
  component: CapturesSettingsPage,
});

const LANGUAGES: { code: string; label: string }[] = [
  { code: "", label: "Auto-detect" },
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "nl", label: "Dutch" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
  { code: "hi", label: "Hindi" },
  { code: "ar", label: "Arabic" },
];

const STT_MODELS = [
  { value: "tiny", label: "Tiny — fastest, lowest quality" },
  { value: "base", label: "Base — fast" },
  { value: "small", label: "Small — balanced" },
  { value: "medium", label: "Medium — higher accuracy" },
  { value: "large-v3", label: "Large v3 — best" },
  { value: "distil-large-v3", label: "Distil Large v3 — near-best, faster" },
];

function CapturesSettingsPage() {
  const { model, language, setModel, setLanguage } = useSettings();

  return (
    <div className="space-y-8 max-w-2xl">
      <SettingSection
        title="Transcription"
        description="Defaults used for new captures and uploads."
      >
        <SettingRow
          title="STT model"
          description="Whisper model to use for transcription. Manage downloads in the Models tab."
          action={
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-[280px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STT_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />

        <SettingRow
          title="Language"
          description="Force a language, or let Whisper auto-detect."
          action={
            <Select
              value={language || "__auto"}
              onValueChange={(v) => setLanguage(v === "__auto" ? "" : v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem
                    key={l.code || "__auto"}
                    value={l.code || "__auto"}
                  >
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      </SettingSection>

      <SettingSection
        title="Storage"
        description="Where transcripts are kept on this device."
      >
        <SettingRow
          title="Capture history"
          description="Transcripts are stored locally in your browser (no cloud). Clear from the History tab."
        />
      </SettingSection>
    </div>
  );
}
