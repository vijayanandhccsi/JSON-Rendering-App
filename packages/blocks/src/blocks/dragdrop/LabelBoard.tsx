import { useMemo } from "react";
import { Picture } from "../Image";
import type { BlockOf } from "../../types";
import { hashString, shuffledOrder } from "./shuffle";
import { usePlacement } from "./usePlacement";
import { BoardShell, Controls, Pool, PoolChip, Slot } from "./parts";

type LabelBlock = Extract<BlockOf<"dragdrop">, { mode: "label" }>;

export function LabelBoard({ block }: { block: LabelBlock }) {
  const answers = useMemo(() => block.labels.map((label) => label.text), [block.labels]);
  const order = useMemo(
    () => shuffledOrder(answers.length, hashString(JSON.stringify(block.labels))),
    [answers, block.labels],
  );
  const chips = useMemo(() => order.map((i) => answers[i] as string), [order, answers]);
  const names = useMemo(() => block.labels.map((_, i) => `Position ${i + 1}`), [block.labels]);

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
        <div className="relative">
          <Picture
            src={block.image.src}
            alt={block.image.alt}
            description={block.image.description}
          />
          {block.labels.map((label, slot) => {
            const chip = board.placed[slot] ?? null;
            return (
              <div
                key={slot}
                className="absolute w-max max-w-48 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${label.x}%`, top: `${label.y}%` }}
              >
                <Slot
                  index={slot}
                  name={names[slot] as string}
                  chip={chip}
                  chipText={chip === null ? null : (chips[chip] as string)}
                  selectedText={board.selected === null ? null : (chips[board.selected] as string)}
                  result={board.results ? (board.results[slot] ?? null) : null}
                  checkCount={board.checks}
                  placeholder={<span className="font-medium">{slot + 1}</span>}
                  onActivate={() => {
                    if (board.selected !== null)
                      board.placeChip(board.selected, slot, names[slot] as string);
                    else if (chip !== null) board.removeFromSlot(slot);
                  }}
                />
              </div>
            );
          })}
        </div>
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
