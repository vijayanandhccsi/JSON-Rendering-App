import { useMemo } from "react";
import { InlineText } from "../../text/InlineText";
import type { BlockOf } from "../../types";
import { hashString, shuffledOrder } from "./shuffle";
import { usePlacement } from "./usePlacement";
import { BoardShell, Controls, Pool, PoolChip, Slot } from "./parts";

type MatchBlock = Extract<BlockOf<"dragdrop">, { mode: "match" }>;

export function MatchBoard({ block }: { block: MatchBlock }) {
  const answers = useMemo(() => block.pairs.map((pair) => pair.right), [block.pairs]);
  const order = useMemo(
    () => shuffledOrder(answers.length, hashString(JSON.stringify(block.pairs))),
    [answers, block.pairs],
  );
  const chips = useMemo(() => order.map((i) => answers[i] as string), [order, answers]);
  const names = useMemo(() => block.pairs.map((pair) => pair.left), [block.pairs]);

  const board = usePlacement(chips, answers);
  const correct = board.results ? board.results.filter(Boolean).length : null;

  return (
    <BoardShell
      chips={chips}
      slotNames={names}
      onDropOnSlot={(chip, slot) => board.placeChip(chip, slot, names[slot] as string)}
      onDropOnPool={board.returnChip}
    >
      <div className="flex flex-col gap-4">
        <ul role="list" className="flex flex-col gap-3">
          {block.pairs.map((pair, slot) => {
            const chip = board.placed[slot] ?? null;
            return (
              <li key={slot} className="grid items-center gap-2 @md:grid-cols-2">
                <span className="font-medium">
                  <InlineText text={pair.left} />
                </span>
                <Slot
                  index={slot}
                  name={pair.left}
                  chip={chip}
                  chipText={chip === null ? null : (chips[chip] as string)}
                  selectedText={board.selected === null ? null : (chips[board.selected] as string)}
                  result={board.results ? (board.results[slot] ?? null) : null}
                  checkCount={board.checks}
                  placeholder="Drop an answer here"
                  onActivate={() => {
                    if (board.selected !== null) board.placeChip(board.selected, slot, pair.left);
                    else if (chip !== null) board.removeFromSlot(slot);
                  }}
                />
              </li>
            );
          })}
        </ul>
        <Pool empty={board.pool.length === 0}>
          {board.pool.map((chip) => (
            <PoolChip
              key={chip}
              index={chip}
              text={chips[chip] as string}
              selected={board.selected === chip}
              onSelect={() => board.toggleSelected(chip)}
            />
          ))}
        </Pool>
        <Controls
          onCheck={board.check}
          onReset={board.reset}
          correct={correct}
          total={answers.length}
          announcement={board.announcement}
        />
      </div>
    </BoardShell>
  );
}
