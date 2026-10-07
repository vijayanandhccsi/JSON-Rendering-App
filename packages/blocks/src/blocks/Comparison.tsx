import { Check } from "lucide-react";
import { ICON_STROKE_WIDTH } from "../ui/Icon";
import { InlineText } from "../text/InlineText";
import type { BlockOf } from "../types";

type Side = BlockOf<"comparison">["left"];

function Column({ side, headerClassName }: { side: Side; headerClassName: string }) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      <p className={`px-5 py-3 text-h4 font-semibold ${headerClassName}`}>
        <InlineText text={side.title} />
      </p>
      <ul role="list" className="flex flex-col gap-3 p-5">
        {side.points.map((point, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check
              size={20}
              strokeWidth={ICON_STROKE_WIDTH}
              aria-hidden
              className="mt-0.5 shrink-0 text-primary-strong"
            />
            <span>
              <InlineText text={point} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Comparison({ block }: { block: BlockOf<"comparison"> }) {
  // Container queries, not screen breakpoints: the layout follows the width of the page column.
  return (
    <div className="@container">
      <div
        role="group"
        aria-label={`${block.left.title} compared with ${block.right.title}`}
        className="relative grid gap-4 @md:grid-cols-2"
      >
        <Column side={block.left} headerClassName="bg-info-tint" />
        <Column side={block.right} headerClassName="bg-primary-tint" />
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 rounded-pill border border-border bg-surface px-3 py-1 text-small font-medium text-ink-muted @md:block"
        >
          vs
        </span>
      </div>
    </div>
  );
}
