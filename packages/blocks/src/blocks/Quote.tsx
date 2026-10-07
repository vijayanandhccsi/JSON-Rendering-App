import { Quote as QuoteMark } from "lucide-react";
import { ICON_STROKE_WIDTH } from "../ui/Icon";
import { InlineText } from "../text/InlineText";
import type { BlockOf } from "../types";

export function Quote({ block }: { block: BlockOf<"quote"> }) {
  return (
    <figure className="border-l-3 border-primary pl-5">
      <QuoteMark
        size={24}
        strokeWidth={ICON_STROKE_WIDTH}
        aria-hidden
        className="mb-2 text-ink-muted"
      />
      <blockquote className="text-h4">
        <InlineText text={block.text} />
      </blockquote>
      {block.source ? (
        <figcaption className="mt-2 text-caption text-ink-muted">
          <InlineText text={block.source} />
        </figcaption>
      ) : null}
    </figure>
  );
}
