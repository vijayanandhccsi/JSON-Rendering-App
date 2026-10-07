import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type {
  Announcements,
  CollisionDetection,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { CircleCheck, CircleX, GripVertical } from "lucide-react";
import { useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "../../ui/buttons";
import { ICON_STROKE_WIDTH } from "../../ui/Icon";
import { jumpBetweenTargets } from "./keyboard";

export const POOL_ID = "pool";
export const chipId = (index: number) => `chip-${index}`;
export const slotId = (index: number) => `slot-${index}`;

const collision: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  return pointer.length > 0 ? pointer : rectIntersection(args);
};

const INSTRUCTIONS =
  "To pick up an item, press Space. Use the arrow keys to move between places. Press Space to drop it, or Escape to cancel. You can also select an item and then select a place.";

interface ShellProps {
  chips: readonly string[];
  /** Names of the places, for screen reader announcements. */
  slotNames: readonly string[];
  onDropOnSlot: (chip: number, slot: number) => void;
  onDropOnPool: (chip: number) => void;
  children: ReactNode;
}

/** Drag and drop context for the match and label modes: pointer, touch and keyboard. */
export function BoardShell({ chips, slotNames, onDropOnSlot, onDropOnPool, children }: ShellProps) {
  const [active, setActive] = useState<number | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: jumpBetweenTargets }),
  );

  const chipName = (id: string | number) =>
    chips[Number(String(id).replace("chip-", ""))] ?? "item";
  const targetName = (id: string | number | undefined) =>
    id === undefined
      ? "nowhere"
      : id === POOL_ID
        ? "the choices"
        : (slotNames[Number(String(id).replace("slot-", ""))] ?? "a place");

  const announcements: Announcements = {
    onDragStart: ({ active: a }) => `Picked up ${chipName(a.id)}.`,
    onDragOver: ({ active: a, over }) => `${chipName(a.id)} is over ${targetName(over?.id)}.`,
    onDragEnd: ({ active: a, over }) =>
      over ? `Dropped ${chipName(a.id)} on ${targetName(over.id)}.` : `Dropped ${chipName(a.id)}.`,
    onDragCancel: ({ active: a }) => `Cancelled. ${chipName(a.id)} was not moved.`,
  };

  const onDragStart = (event: DragStartEvent) =>
    setActive(Number(String(event.active.id).replace("chip-", "")));
  const onDragEnd = (event: DragEndEvent) => {
    setActive(null);
    const chip = Number(String(event.active.id).replace("chip-", ""));
    const over = event.over ? String(event.over.id) : null;
    if (over === POOL_ID) onDropOnPool(chip);
    else if (over?.startsWith("slot-")) onDropOnSlot(chip, Number(over.replace("slot-", "")));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision}
      accessibility={{ announcements, screenReaderInstructions: { draggable: INSTRUCTIONS } }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActive(null)}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {active === null ? null : (
          <span className="inline-flex min-h-11 items-center rounded-control border border-primary bg-surface px-4 shadow-raised">
            {chips[active]}
          </span>
        )}
      </DragOverlay>
    </DndContext>
  );
}

/** The grip that picks a chip up. It is the only part that starts a drag, so the chip's own button can be clicked. */
function Handle({ label, ...props }: { label: string } & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      aria-label={label}
      className="flex size-11 shrink-0 cursor-grab touch-none items-center justify-center text-ink-muted"
    >
      <GripVertical size={16} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
    </span>
  );
}

interface PoolChipProps {
  index: number;
  text: string;
  selected: boolean;
  onSelect: () => void;
}

/** A chip waiting in the pool of choices. */
export function PoolChip({ index, text, selected, onSelect }: PoolChipProps) {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: chipId(index),
  });
  return (
    <li
      ref={setNodeRef}
      className={`flex items-center rounded-control border bg-surface ${selected ? "border-primary" : "border-border"} ${isDragging ? "opacity-40" : ""}`}
    >
      <span ref={setActivatorNodeRef}>
        <Handle {...attributes} {...listeners} label={`Drag ${text}`} />
      </span>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className="min-h-11 py-2 pr-4 text-left"
      >
        {text}
      </button>
    </li>
  );
}

/** The area chips return to. Dropping a chip here takes it out of a slot. */
export function Pool({ children, empty }: { children: ReactNode; empty: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: POOL_ID });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-card border-2 border-dashed p-3 ${isOver ? "border-primary bg-primary-tint" : "border-border"}`}
    >
      {empty ? (
        <p className="px-2 py-3 text-small text-ink-muted">All items are placed.</p>
      ) : (
        <ul role="list" className="flex flex-wrap gap-2">
          {children}
        </ul>
      )}
    </div>
  );
}

export type Result = boolean | null;

interface SlotProps {
  index: number;
  /** What the place is called, for example the term or "Position 2". */
  name: string;
  chip: number | null;
  chipText: string | null;
  selectedText: string | null;
  result: Result;
  /** Changes on every check so a wrong answer shakes again. */
  checkCount: number;
  onActivate: () => void;
  /** What shows in an empty slot. */
  placeholder: ReactNode;
  className?: string;
}

export function resultLabel(result: Result): string {
  return result === null ? "" : result ? " Correct." : " Incorrect.";
}

/** A place a chip can go: a dashed target that becomes a solid chip once filled. */
export function Slot({
  index,
  name,
  chip,
  chipText,
  selectedText,
  result,
  checkCount,
  onActivate,
  placeholder,
  className = "",
}: SlotProps) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: slotId(index) });
  const drag = useDraggable({
    id: chip === null ? `empty-${index}` : chipId(chip),
    disabled: chip === null,
  });

  const action =
    selectedText !== null
      ? ` Press to place ${selectedText} here.`
      : chipText !== null
        ? " Press to return it to the choices."
        : "";
  const label = `${name}. ${chipText !== null ? `Contains ${chipText}.` : "Empty."}${resultLabel(result)}${action}`;

  const tone =
    result === true
      ? "border-solid border-success bg-success-tint"
      : result === false
        ? "border-solid border-danger bg-danger-tint animate-shake"
        : chipText !== null
          ? "border-solid border-border bg-surface"
          : isOver
            ? "border-dashed border-primary bg-primary-tint"
            : "border-dashed border-border bg-surface";

  return (
    <div ref={setDropRef} className={className}>
      <div
        key={`${index}-${checkCount}`}
        ref={drag.setNodeRef}
        className={`flex min-h-11 items-center rounded-control border-2 ${tone} ${drag.isDragging ? "opacity-40" : ""}`}
      >
        <button
          type="button"
          aria-label={label}
          onClick={onActivate}
          className="flex min-h-11 flex-1 items-center gap-2 px-3 py-2 text-left"
        >
          {chipText ?? <span className="text-ink-muted">{placeholder}</span>}
          {result === true ? (
            <CircleCheck
              size={20}
              strokeWidth={ICON_STROKE_WIDTH}
              aria-hidden
              className="ml-auto shrink-0 text-success-strong"
            />
          ) : null}
          {result === false ? (
            <CircleX
              size={20}
              strokeWidth={ICON_STROKE_WIDTH}
              aria-hidden
              className="ml-auto shrink-0 text-danger"
            />
          ) : null}
        </button>
        {chip !== null && chipText !== null ? (
          <span ref={drag.setActivatorNodeRef}>
            <Handle {...drag.attributes} {...drag.listeners} label={`Drag ${chipText}`} />
          </span>
        ) : null}
      </div>
    </div>
  );
}

interface ControlsProps {
  onCheck: () => void;
  onReset: () => void;
  /** Number of correct results, or null before the first check. */
  correct: number | null;
  total: number;
  announcement: string;
}

/** Check and Reset buttons, with the result in words and an icon. */
export function Controls({ onCheck, onReset, correct, total, announcement }: ControlsProps) {
  const done = correct === total;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={PRIMARY_BUTTON} onClick={onCheck}>
          Check
        </button>
        <button type="button" className={SECONDARY_BUTTON} onClick={onReset}>
          Reset
        </button>
      </div>
      <p
        role="status"
        className={
          correct === null
            ? "sr-only"
            : `flex items-start gap-2 rounded-control p-3 ${done ? "bg-success-tint" : "bg-danger-tint"}`
        }
      >
        {correct === null ? (
          announcement
        ) : (
          <>
            {done ? (
              <CircleCheck
                size={20}
                strokeWidth={ICON_STROKE_WIDTH}
                aria-hidden
                className="mt-0.5 shrink-0 text-success-strong"
              />
            ) : (
              <CircleX
                size={20}
                strokeWidth={ICON_STROKE_WIDTH}
                aria-hidden
                className="mt-0.5 shrink-0 text-danger"
              />
            )}
            <span>
              {done
                ? `All ${total} correct. Well done.`
                : `${correct} of ${total} correct. Fix the items marked incorrect, then check again.`}
            </span>
          </>
        )}
      </p>
    </div>
  );
}
