import { CircleCheck, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "../ui/buttons";
import { ICON_STROKE_WIDTH } from "../ui/Icon";
import { InlineText } from "../text/InlineText";
import type { BlockOf } from "../types";

const TICK_MS = 200;
const RING_RADIUS = 45;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
const STOPWATCH_LAP_MS = 60_000;

export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const two = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${two(m)}:${two(s)}` : `${two(m)}:${two(s)}`;
}

export function Timer({ block }: { block: BlockOf<"timer"> }) {
  const countdown = block.mode === "countdown";
  const totalMs = (block.seconds ?? 0) * 1000;
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const elapsedRef = useRef(0);
  elapsedRef.current = elapsed;

  const finished = countdown && elapsed >= totalMs;

  // Time is measured from the clock, not by counting ticks, so it stays right if the tab is slowed down.
  useEffect(() => {
    if (!running) return;
    const startedAt = Date.now();
    const offset = elapsedRef.current;
    const id = setInterval(() => {
      const next = offset + (Date.now() - startedAt);
      if (countdown && next >= totalMs) {
        setElapsed(totalMs);
        setRunning(false);
      } else {
        setElapsed(next);
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [running, countdown, totalMs]);

  const reset = () => {
    setRunning(false);
    setElapsed(0);
  };

  const shown = countdown ? Math.ceil((totalMs - elapsed) / 1000) : Math.floor(elapsed / 1000);
  const progress = countdown
    ? (totalMs - elapsed) / totalMs
    : (elapsed % STOPWATCH_LAP_MS) / STOPWATCH_LAP_MS;
  const started = elapsed > 0;

  return (
    <div
      className={`flex flex-col items-center gap-4 rounded-card border border-border p-5 ${finished ? "bg-success-tint" : "bg-surface"}`}
    >
      {block.label ? (
        <p className="text-small text-ink-muted">
          <InlineText text={block.label} />
        </p>
      ) : null}
      <div className="relative flex size-40 items-center justify-center">
        <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0 size-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            strokeWidth="6"
            className="fill-none stroke-border"
          />
          <circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH * (1 - Math.min(Math.max(progress, 0), 1))}
            className="fill-none stroke-primary"
          />
        </svg>
        <p
          role="timer"
          aria-label={block.label ?? (countdown ? "Countdown" : "Timer")}
          className="relative font-mono text-title"
        >
          {formatClock(shown)}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {running ? (
          <button type="button" className={PRIMARY_BUTTON} onClick={() => setRunning(false)}>
            <Pause size={20} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
            Pause
          </button>
        ) : (
          <button
            type="button"
            className={PRIMARY_BUTTON}
            disabled={finished}
            onClick={() => setRunning(true)}
          >
            <Play size={20} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
            {started ? "Resume" : "Start"}
          </button>
        )}
        <button
          type="button"
          className={SECONDARY_BUTTON}
          disabled={!started && !running}
          onClick={reset}
        >
          <RotateCcw size={20} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
          Reset
        </button>
      </div>
      <p role="status" className={finished ? "flex items-center gap-2 font-medium" : "sr-only"}>
        {finished ? (
          <>
            <CircleCheck
              size={20}
              strokeWidth={ICON_STROKE_WIDTH}
              aria-hidden
              className="shrink-0 text-success-strong"
            />
            <InlineText text={block.message ?? "Time is up."} />
          </>
        ) : null}
      </p>
    </div>
  );
}
