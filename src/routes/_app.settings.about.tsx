import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, AudioLines, Github } from "lucide-react";

export const Route = createFileRoute("/_app/settings/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto flex h-full max-w-md items-center">
      <div className="flex flex-col items-center space-y-5 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
          <AudioLines className="h-10 w-10 text-primary" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-lg font-semibold">Voicebox STT</h1>
          <p className="h-4 text-xs text-muted-foreground/60">v0.2.0</p>
        </div>

        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          A local speech-to-text studio. Records, uploads, and transcribes audio
          with Whisper — runs entirely on your machine, no cloud, no auth.
        </p>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span>Inspired by</span>
          <a
            href="https://github.com/voicebox-ai/voicebox"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            voicebox-ai/voicebox
          </a>
        </div>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <a
            href="https://github.com/voicebox-ai/voicebox"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-sm transition-colors hover:bg-muted/50"
          >
            <Github className="h-4 w-4 text-muted-foreground" />
            GitHub
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
          </a>
        </div>

        <p className="pt-4 text-xs text-muted-foreground/40">
          Released under the MIT License.
        </p>
      </div>
    </div>
  );
}
