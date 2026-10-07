import { Icon } from "../ui/Icon";
import { InlineText } from "../text/InlineText";
import type { BlockOf } from "../types";

export function Card({ block }: { block: BlockOf<"card"> }) {
  const highlight = block.variant === "highlight";
  return (
    <div
      className={`rounded-card p-5 ${highlight ? "border-2 border-primary bg-primary-tint" : "border border-border bg-surface"}`}
    >
      <div className="flex items-start gap-3">
        {block.icon ? (
          <Icon name={block.icon} size={24} className="mt-0.5 shrink-0 text-primary-strong" />
        ) : null}
        <div className="min-w-0">
          <p className="text-h4 font-semibold">
            <InlineText text={block.title} />
          </p>
          {block.text ? (
            <p className="mt-1">
              <InlineText text={block.text} />
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
