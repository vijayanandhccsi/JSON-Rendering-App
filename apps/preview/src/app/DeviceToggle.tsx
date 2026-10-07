import { useRef } from "react";
import type { KeyboardEvent } from "react";
import { DEVICES } from "./devices";
import type { DeviceId } from "./devices";

/** Mobile, tablet and desktop as a segmented control (a radio group: arrow keys move between them). */
export function DeviceToggle({
  value,
  onChange,
}: {
  value: DeviceId;
  onChange: (id: DeviceId) => void;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = (index + step + DEVICES.length) % DEVICES.length;
    const device = DEVICES[next];
    if (device) {
      onChange(device.id);
      buttons.current[next]?.focus();
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Preview width"
      className="inline-flex rounded-control border border-border bg-surface p-0.5"
    >
      {DEVICES.map(({ id, label, width, Glyph }, index) => {
        const selected = id === value;
        return (
          <button
            key={id}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`inline-flex min-h-10 items-center gap-2 rounded-sm px-3 text-small font-medium transition-colors duration-150 ease-out ${
              selected ? "bg-ink text-surface" : "text-ink hover:bg-bg"
            }`}
          >
            <Glyph size={16} strokeWidth={1.75} aria-hidden />
            <span>
              {label}
              <span className="sr-only"> ({width} pixels)</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
