import { useRef } from "react";
import type { KeyboardEvent, PointerEvent } from "react";

export const MIN_RATIO = 25;
export const MAX_RATIO = 75;
const KEY_STEP = 2;
const KEY_BIG_STEP = 10;

export const clampRatio = (value: number) => Math.min(Math.max(value, MIN_RATIO), MAX_RATIO);

interface DividerProps {
  /** Width of the editor as a percentage of the split view. */
  ratio: number;
  onChange: (ratio: number) => void;
  /** The element the percentage is measured against. */
  container: React.RefObject<HTMLElement | null>;
}

/** The 8 px draggable bar between the editor and the preview. Arrow keys move it too. */
export function Divider({ ratio, onChange, container }: DividerProps) {
  const dragging = useRef(false);

  const move = (event: PointerEvent) => {
    const box = container.current?.getBoundingClientRect();
    if (!dragging.current || !box || box.width === 0) return;
    onChange(clampRatio(((event.clientX - box.left) / box.width) * 100));
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const step = event.shiftKey ? KEY_BIG_STEP : KEY_STEP;
    const next =
      event.key === "ArrowLeft"
        ? ratio - step
        : event.key === "ArrowRight"
          ? ratio + step
          : event.key === "Home"
            ? MIN_RATIO
            : event.key === "End"
              ? MAX_RATIO
              : null;
    if (next === null) return;
    event.preventDefault();
    onChange(clampRatio(next));
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize the editor and the preview"
      aria-valuemin={MIN_RATIO}
      aria-valuemax={MAX_RATIO}
      aria-valuenow={Math.round(ratio)}
      tabIndex={0}
      onPointerDown={(event) => {
        dragging.current = true;
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }}
      onPointerMove={move}
      onPointerUp={(event) => {
        dragging.current = false;
        event.currentTarget.releasePointerCapture?.(event.pointerId);
      }}
      onKeyDown={onKeyDown}
      className="hidden w-2 shrink-0 cursor-col-resize touch-none bg-border transition-colors duration-150 ease-out hover:bg-primary lg:block"
    />
  );
}
