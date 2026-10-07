import { CircleDashed } from "lucide-react";
import { ICON_STROKE_WIDTH } from "../ui/Icon";

/** Shown for a block with a type the renderer does not know. */
export function Unsupported({ type }: { type: string }) {
  return (
    <div className="flex gap-3 rounded-card border border-dashed border-border bg-surface p-5 text-ink-muted">
      <CircleDashed
        size={20}
        strokeWidth={ICON_STROKE_WIDTH}
        aria-hidden
        className="mt-0.5 shrink-0"
      />
      <p>
        The <span className="font-mono">{type}</span> block is not a known block, so it cannot be
        shown.
      </p>
    </div>
  );
}
