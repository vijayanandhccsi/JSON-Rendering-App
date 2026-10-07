import { Info, Lightbulb, OctagonAlert, TriangleAlert, CircleCheck } from "lucide-react";
import { ICON_STROKE_WIDTH } from "../ui/Icon";
import { InlineText } from "../text/InlineText";
import type { BlockOf } from "../types";

const VARIANTS = {
  info: { label: "Info", Glyph: Info, box: "bg-info-tint", icon: "text-ink" },
  tip: { label: "Tip", Glyph: Lightbulb, box: "bg-primary-tint", icon: "text-primary-strong" },
  warning: { label: "Warning", Glyph: TriangleAlert, box: "bg-warning-tint", icon: "text-warning" },
  danger: { label: "Danger", Glyph: OctagonAlert, box: "bg-danger-tint", icon: "text-danger" },
  success: {
    label: "Success",
    Glyph: CircleCheck,
    box: "bg-success-tint",
    icon: "text-success-strong",
  },
} as const;

export function Callout({ block }: { block: BlockOf<"callout"> }) {
  const { label, Glyph, box, icon } = VARIANTS[block.variant];
  return (
    <div role="note" aria-label={label} className={`flex gap-3 rounded-card p-5 ${box}`}>
      <Glyph
        size={20}
        strokeWidth={ICON_STROKE_WIDTH}
        aria-hidden
        className={`mt-0.5 shrink-0 ${icon}`}
      />
      <div className="min-w-0">
        {block.title ? (
          <p className="font-semibold">
            <InlineText text={block.title} />
          </p>
        ) : null}
        <p>
          <InlineText text={block.text} />
        </p>
      </div>
    </div>
  );
}
