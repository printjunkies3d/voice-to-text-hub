import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

interface WaveformProps {
  src: string | Blob;
  height?: number;
}

/** Static waveform renderer for a finished recording or uploaded file. */
export function Waveform({ src, height = 96 }: WaveformProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ws = WaveSurfer.create({
      container: containerRef.current,
      height,
      waveColor: "var(--color-waveform)",
      progressColor: "var(--color-waveform-progress)",
      cursorColor: "var(--color-primary)",
      cursorWidth: 2,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      normalize: true,
    });
    wsRef.current = ws;

    if (typeof src === "string") {
      ws.load(src);
    } else {
      ws.loadBlob(src);
    }

    return () => {
      ws.destroy();
      wsRef.current = null;
    };
  }, [src, height]);

  const togglePlay = () => wsRef.current?.playPause();

  return (
    <div className="rounded-xl border border-border bg-card/60 p-4">
      <div ref={containerRef} onClick={togglePlay} className="cursor-pointer" />
      <p className="mt-2 text-xs text-muted-foreground">
        Click the waveform to play / pause
      </p>
    </div>
  );
}
