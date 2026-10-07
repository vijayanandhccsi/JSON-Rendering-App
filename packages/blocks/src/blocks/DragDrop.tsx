import { InlineText } from "../text/InlineText";
import type { BlockOf } from "../types";
import { LabelBoard } from "./dragdrop/LabelBoard";
import { MatchBoard } from "./dragdrop/MatchBoard";
import { OrderBoard } from "./dragdrop/OrderBoard";

export function DragDrop({ block }: { block: BlockOf<"dragdrop"> }) {
  return (
    <div className="@container flex flex-col gap-4 rounded-card border border-border bg-surface p-5">
      <div>
        <p className="font-semibold">
          <InlineText text={block.prompt} />
        </p>
        {block.hint ? (
          <p className="mt-1 text-small text-ink-muted">
            Hint: <InlineText text={block.hint} />
          </p>
        ) : null}
      </div>
      {block.mode === "match" ? (
        <MatchBoard block={block} />
      ) : block.mode === "order" ? (
        <OrderBoard block={block} />
      ) : (
        <LabelBoard block={block} />
      )}
    </div>
  );
}
