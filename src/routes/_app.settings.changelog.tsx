import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/settings/changelog")({
  component: ChangelogPage,
});

type Entry = {
  version: string;
  date?: string;
  unreleased?: boolean;
  sections: { heading: string; items: string[] }[];
};

const ENTRIES: Entry[] = [
  {
    version: "0.2.0",
    unreleased: true,
    sections: [
      {
        heading: "Added",
        items: [
          "Settings split into General, Captures, Changelog and About tabs.",
          "Models tab now describes every Whisper STT model.",
        ],
      },
      {
        heading: "Changed",
        items: [
          "General page now mirrors the upstream Voicebox layout (docs / GitHub cards, server URL row, live online indicator).",
        ],
      },
    ],
  },
  {
    version: "0.1.0",
    date: "2026-06-22",
    sections: [
      {
        heading: "Initial release",
        items: [
          "Live mic dictation with waveform meter.",
          "File upload transcription via the FastAPI backend.",
          "Transcript history persisted in the browser.",
          "Models tab for downloading and loading Whisper models.",
        ],
      },
    ],
  },
];

function ChangelogPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      {ENTRIES.map((entry) => (
        <article
          key={entry.version}
          className="border-b border-border/50 pb-6 last:border-b-0"
        >
          <header className="mb-3 flex items-baseline gap-3">
            <h3 className="text-xl font-semibold tracking-tight">
              {entry.version}
            </h3>
            {entry.date ? (
              <span className="text-xs text-muted-foreground">
                {entry.date}
              </span>
            ) : null}
            {entry.unreleased ? (
              <Badge variant="outline">Unreleased</Badge>
            ) : null}
          </header>

          <div className="space-y-4">
            {entry.sections.map((section) => (
              <div key={section.heading}>
                <h4 className="mb-1 text-sm font-medium text-foreground">
                  {section.heading}
                </h4>
                <ul className="space-y-1">
                  {section.items.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex gap-2 text-sm text-muted-foreground"
                    >
                      <span className="select-none text-muted-foreground/50">
                        •
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
