import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mic, Upload, Trash2, Copy, FileText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHistory, type HistoryItem } from "@/stores/historyStore";

export const Route = createFileRoute("/_app/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const items = useHistory((s) => s.items);
  const remove = useHistory((s) => s.remove);
  const clear = useHistory((s) => s.clear);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected =
    items.find((i) => i.id === selectedId) ?? items[0] ?? null;

  return (
    <>
      <PageHeader
        title="History"
        description={`${items.length} transcript${items.length === 1 ? "" : "s"} stored locally in your browser.`}
        actions={
          items.length > 0 ? (
            <Button variant="secondary" size="sm" onClick={clear}>
              <Trash2 className="mr-2 h-4 w-4" /> Clear all
            </Button>
          ) : null
        }
      />

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/30 py-20 text-center">
          <FileText className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No transcripts yet. Try the Dictate or Upload tabs.
          </p>
        </div>
      ) : (
        <div className="grid flex-1 gap-4 lg:grid-cols-[300px_1fr]">
          <ul className="flex flex-col gap-1 overflow-y-auto rounded-2xl border border-border bg-card/40 p-2">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "flex w-full flex-col gap-1 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent/30",
                    (selected?.id ?? null) === item.id && "bg-accent/40",
                  )}
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {item.source === "dictate" ? (
                      <Mic className="h-3 w-3" />
                    ) : (
                      <Upload className="h-3 w-3" />
                    )}
                    <span>{formatDate(item.createdAt)}</span>
                    <span>· {item.duration.toFixed(1)}s</span>
                  </div>
                  <p className="line-clamp-2 text-sm text-foreground">
                    {item.text || <em className="text-muted-foreground">(empty)</em>}
                  </p>
                </button>
              </li>
            ))}
          </ul>

          {selected ? <Detail item={selected} onRemove={() => remove(selected.id)} /> : null}
        </div>
      )}
    </>
  );
}

function Detail({ item, onRemove }: { item: HistoryItem; onRemove: () => void }) {
  return (
    <article className="flex flex-col gap-4 overflow-y-auto rounded-2xl border border-border bg-card p-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{formatDate(item.createdAt)}</span>
          <span>· {item.duration.toFixed(1)}s</span>
          <span>· {item.model}</span>
          {item.language ? <span>· {item.language}</span> : null}
          {item.filename ? <span>· {item.filename}</span> : null}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigator.clipboard.writeText(item.text)}
          >
            <Copy className="mr-2 h-4 w-4" /> Copy
          </Button>
          <Button size="sm" variant="destructive" onClick={onRemove}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </header>

      <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
        {item.text}
      </p>

      {item.segments && item.segments.length > 0 ? (
        <details className="rounded-xl border border-border bg-background/40 p-3">
          <summary className="cursor-pointer text-xs uppercase tracking-widest text-muted-foreground">
            Segments ({item.segments.length})
          </summary>
          <ol className="mt-3 space-y-1 text-sm">
            {item.segments.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-20 shrink-0 font-mono text-xs text-muted-foreground">
                  {s.start.toFixed(2)}–{s.end.toFixed(2)}
                </span>
                <span>{s.text}</span>
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </article>
  );
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString();
}
