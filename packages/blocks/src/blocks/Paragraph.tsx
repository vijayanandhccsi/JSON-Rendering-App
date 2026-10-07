import { InlineText } from "../text/InlineText";
import type { BlockOf } from "../types";

export function Paragraph({ block }: { block: BlockOf<"paragraph"> }) {
  return (
    <p className="text-body">
      <InlineText text={block.text} />
    </p>
  );
}
