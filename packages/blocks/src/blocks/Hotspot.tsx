import { X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { ICON_STROKE_WIDTH } from "../ui/Icon";
import { InlineText } from "../text/InlineText";
import type { BlockOf } from "../types";
import { Picture } from "./Image";

// Keep the popover inside the image: open it towards the middle.
function popoverPosition(x: number, y: number): string {
  const horizontal = x < 35 ? "left-0" : x > 65 ? "right-0" : "left-1/2 -translate-x-1/2";
  const vertical = y > 60 ? "bottom-full mb-2" : "top-full mt-2";
  return `${horizontal} ${vertical}`;
}

export function Hotspot({ block }: { block: BlockOf<"hotspot"> }) {
  const [open, setOpen] = useState<number | null>(null);
  const id = useId();
  const container = useRef<HTMLDivElement>(null);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  const popover = useRef<HTMLDivElement>(null);

  const close = (returnFocus: boolean) => {
    const index = open;
    setOpen(null);
    if (returnFocus && index !== null) triggers.current[index]?.focus();
  };

  // Move focus into the popover when it opens, so keyboard and screen reader users land on it.
  useEffect(() => {
    if (open !== null) popover.current?.focus();
  }, [open]);

  // Clicking or tapping anywhere else closes it.
  useEffect(() => {
    if (open === null) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && open !== null) {
      event.stopPropagation();
      close(true);
    }
  };

  return (
    <div ref={container} onKeyDown={onKeyDown} className="relative">
      <Picture src={block.image.src} alt={block.image.alt} description={block.image.description} />
      {block.hotspots.map((spot, index) => {
        const isOpen = open === index;
        const titleId = `${id}-title-${index}`;
        const popoverId = `${id}-popover-${index}`;
        return (
          <div
            key={index}
            className={`absolute -translate-x-1/2 -translate-y-1/2 ${isOpen ? "z-20" : "z-10"}`}
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
          >
            <button
              ref={(element) => {
                triggers.current[index] = element;
              }}
              type="button"
              aria-expanded={isOpen}
              aria-controls={isOpen ? popoverId : undefined}
              aria-label={`${index + 1}. ${spot.title}`}
              onClick={() => (isOpen ? close(true) : setOpen(index))}
              className="relative flex size-11 items-center justify-center rounded-pill"
            >
              {isOpen ? null : (
                <span
                  aria-hidden
                  className="absolute size-8 animate-ping rounded-pill bg-primary"
                />
              )}
              <span
                aria-hidden
                className="relative flex size-8 items-center justify-center rounded-pill bg-primary-strong text-small font-medium text-surface ring-2 ring-surface"
              >
                {index + 1}
              </span>
            </button>
            {isOpen ? (
              <div
                ref={popover}
                id={popoverId}
                role="dialog"
                aria-labelledby={titleId}
                tabIndex={-1}
                className={`absolute z-20 w-64 rounded-card border border-border bg-surface p-4 shadow-raised ${popoverPosition(spot.x, spot.y)}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p id={titleId} className="font-semibold">
                    <InlineText text={spot.title} />
                  </p>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => close(true)}
                    className="-mr-2 -mt-2 flex size-11 shrink-0 items-center justify-center rounded-pill text-ink-muted hover:bg-bg"
                  >
                    <X size={20} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
                  </button>
                </div>
                <p className="mt-1 text-small">
                  <InlineText text={spot.text} />
                </p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
