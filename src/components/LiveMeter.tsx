import { useEffect, useRef, useState } from "react";

/**
 * Live mic visualiser: 32 vertical bars driven by an AnalyserNode.
 * Pass the active MediaStream while recording; pass null when idle.
 */
export function LiveMeter({ stream }: { stream: MediaStream | null }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!stream || !canvasRef.current) {
      setActive(false);
      return;
    }
    setActive(true);

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    source.connect(analyser);

    const buffer = new Uint8Array(analyser.frequencyBinCount);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;

    const draw = () => {
      analyser.getByteFrequencyData(buffer);
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const bars = 32;
      const step = Math.floor(buffer.length / bars);
      const barWidth = (width / bars) * 0.6;
      const gap = (width / bars) * 0.4;

      for (let i = 0; i < bars; i++) {
        const v = buffer[i * step] / 255;
        const h = Math.max(2, v * height * 0.95);
        const x = i * (barWidth + gap);
        const y = (height - h) / 2;
        const grad = ctx.createLinearGradient(0, y, 0, y + h);
        grad.addColorStop(0, "oklch(0.78 0.17 200)");
        grad.addColorStop(1, "oklch(0.72 0.21 296)");
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, h);
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      source.disconnect();
      analyser.disconnect();
      audioCtx.close();
    };
  }, [stream]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={120}
      className="h-28 w-full rounded-xl border border-border bg-card/40"
      style={{ opacity: active ? 1 : 0.4 }}
    />
  );
}
