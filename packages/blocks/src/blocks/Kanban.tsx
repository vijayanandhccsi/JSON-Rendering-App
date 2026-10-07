import { useId } from "react";
import { InlineText } from "../text/InlineText";
import type { BlockOf } from "../types";

export function Kanban({ block }: { block: BlockOf<"kanban"> }) {
  const id = useId();
  return (
    <div
      role="region"
      tabIndex={0}
      aria-label="Board (scrolls sideways)"
      className="overflow-x-auto rounded-card"
    >
      <div className="flex gap-4">
        {block.columns.map((column, index) => {
          const titleId = `${id}-${index}`;
          return (
            <section
              key={index}
              aria-labelledby={titleId}
              className="flex shrink-0 grow basis-64 flex-col gap-3 rounded-card border border-border bg-bg p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p id={titleId} className="font-semibold">
                  <InlineText text={column.title} />
                </p>
                <span className="rounded-pill border border-border bg-surface px-2.5 py-0.5 text-caption font-medium">
                  <span className="sr-only">Cards: </span>
                  {column.cards.length}
                </span>
              </div>
              {column.cards.length === 0 ? (
                <p className="text-small text-ink-muted">No cards</p>
              ) : (
                <ul role="list" className="flex flex-col gap-2">
                  {column.cards.map((card, cardIndex) => (
                    <li
                      key={cardIndex}
                      className="rounded-control border border-border bg-surface p-3"
                    >
                      <p className="font-medium">
                        <InlineText text={card.title} />
                      </p>
                      {card.text ? (
                        <p className="mt-1 text-small text-ink-muted">
                          <InlineText text={card.text} />
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
