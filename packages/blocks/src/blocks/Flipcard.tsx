import { RotateCcw } from "lucide-react";
import { useId, useState } from "react";
import { ICON_STROKE_WIDTH } from "../ui/Icon";
import { InlineText } from "../text/InlineText";
import type { BlockOf } from "../types";

const FACE =
  "col-start-1 row-start-1 flex min-h-40 items-center justify-center rounded-card border border-border p-5 text-center backface-hidden";

function Card({ front, back }: { front: string; back: string }) {
  const [flipped, setFlipped] = useState(false);
  const hintId = useId();
  return (
    <div>
      <button
        type="button"
        aria-pressed={flipped}
        aria-describedby={hintId}
        onClick={() => setFlipped((value) => !value)}
        className="block w-full rounded-card text-left perspective-distant"
      >
        <span
          className={`grid transition-transform duration-400 ease-out transform-3d ${flipped ? "rotate-y-180" : ""}`}
        >
          <span aria-hidden={flipped} className={`${FACE} relative bg-surface`}>
            <span className="text-h3 font-semibold">
              <InlineText text={front} />
            </span>
            <RotateCcw
              size={16}
              strokeWidth={ICON_STROKE_WIDTH}
              aria-hidden
              className="absolute right-3 top-3 text-ink-muted"
            />
          </span>
          <span aria-hidden={!flipped} className={`${FACE} rotate-y-180 bg-primary-tint`}>
            <span>
              <InlineText text={back} />
            </span>
          </span>
        </span>
      </button>
      <span id={hintId} className="sr-only">
        {flipped ? "Press to show the term again" : "Press to show the definition"}
      </span>
    </div>
  );
}

export function Flipcard({ block }: { block: BlockOf<"flipcard"> }) {
  return (
    <div className="grid grid-flipcards gap-4">
      {block.cards.map((card, index) => (
        <Card key={index} front={card.front} back={card.back} />
      ))}
    </div>
  );
}
