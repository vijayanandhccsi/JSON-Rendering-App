import { BookOpen } from "lucide-react";
import { useState } from "react";
import { Disclosure } from "../ui/Disclosure";
import { ICON_STROKE_WIDTH } from "../ui/Icon";
import { NestedBlocks } from "../renderer/BlockRenderer";
import { InlineText } from "../text/InlineText";
import type { BlockOf } from "../types";

export function Expandable({ block }: { block: BlockOf<"expandable"> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      <Disclosure
        title={<InlineText text={block.title} />}
        open={open}
        onToggle={() => setOpen((value) => !value)}
        leading={
          <BookOpen
            size={20}
            strokeWidth={ICON_STROKE_WIDTH}
            aria-hidden
            className="shrink-0 text-primary-strong"
          />
        }
        headerClassName="bg-primary-tint hover:bg-primary-tint"
      >
        <NestedBlocks blocks={block.blocks} />
      </Disclosure>
    </div>
  );
}
