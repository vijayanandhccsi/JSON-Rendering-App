import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { Announcements, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, CircleCheck, CircleX, GripVertical } from "lucide-react";
import { useMemo, useState } from "react";
import { ICON_STROKE_WIDTH } from "../../ui/Icon";
import { InlineText } from "../../text/InlineText";
import type { BlockOf } from "../../types";
import { SECONDARY_BUTTON } from "../../ui/buttons";
import { Controls, resultLabel } from "./parts";
import type { Result } from "./parts";
import { hashString, shuffledOrder } from "./shuffle";

type OrderBlock = Extract<BlockOf<"dragdrop">, { mode: "order" }>;

const itemId = (index: number) => `item-${index}`;
const indexOf = (id: string | number) => Number(String(id).replace("item-", ""));
const MOVE_BUTTON = `${SECONDARY_BUTTON} size-11 !px-0`;

interface RowProps {
  id: number;
  position: number;
  total: number;
  text: string;
  result: Result;
  checkCount: number;
  onMove: (direction: -1 | 1) => void;
}

function Row({ id, position, total, text, result, checkCount, onMove }: RowProps) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: itemId(id) });
  const tone =
    result === true
      ? "border-success bg-success-tint"
      : result === false
        ? "border-danger bg-danger-tint animate-shake"
        : "border-border bg-surface";

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-1 rounded-control border-2 ${tone} ${isDragging ? "relative z-10 shadow-raised" : ""}`}
    >
      <span key={checkCount} className="contents">
        <span
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Drag ${text}. Position ${position} of ${total}.`}
          className="flex size-11 shrink-0 cursor-grab touch-none items-center justify-center text-ink-muted"
        >
          <GripVertical size={16} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
        </span>
        <span
          aria-hidden
          className="flex size-7 shrink-0 items-center justify-center rounded-pill border border-border bg-bg text-small text-ink-muted"
        >
          {position}
        </span>
        <span className="min-w-0 flex-1 px-2 py-2">
          <InlineText text={text} />
          {result !== null ? <span className="sr-only">.{resultLabel(result)}</span> : null}
        </span>
        {result === true ? (
          <CircleCheck
            size={20}
            strokeWidth={ICON_STROKE_WIDTH}
            aria-hidden
            className="shrink-0 text-success-strong"
          />
        ) : null}
        {result === false ? (
          <CircleX
            size={20}
            strokeWidth={ICON_STROKE_WIDTH}
            aria-hidden
            className="shrink-0 text-danger"
          />
        ) : null}
        <button
          type="button"
          className={MOVE_BUTTON}
          aria-label={`Move ${text} up`}
          disabled={position === 1}
          onClick={() => onMove(-1)}
        >
          <ChevronUp size={20} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
        </button>
        <button
          type="button"
          className={MOVE_BUTTON}
          aria-label={`Move ${text} down`}
          disabled={position === total}
          onClick={() => onMove(1)}
        >
          <ChevronDown size={20} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
        </button>
      </span>
    </li>
  );
}

export function OrderBoard({ block }: { block: OrderBlock }) {
  const initial = useMemo(
    () => shuffledOrder(block.items.length, hashString(JSON.stringify(block.items))),
    [block.items],
  );
  const [arrangement, setArrangement] = useState<number[]>(initial);
  const [results, setResults] = useState<boolean[] | null>(null);
  const [checks, setChecks] = useState(0);
  const [announcement, setAnnouncement] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const textOf = (id: string | number) => block.items[indexOf(id)] ?? "item";
  const positionOf = (id: string | number | undefined) =>
    id === undefined ? 0 : arrangement.indexOf(indexOf(id)) + 1;
  const total = block.items.length;

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Picked up ${textOf(active.id)}. It is in position ${positionOf(active.id)} of ${total}.`,
    onDragOver: ({ active, over }) =>
      `${textOf(active.id)} is now over position ${positionOf(over?.id)} of ${total}.`,
    onDragEnd: ({ active, over }) =>
      `Dropped ${textOf(active.id)} in position ${positionOf(over?.id ?? active.id)} of ${total}.`,
    onDragCancel: ({ active }) => `Cancelled. ${textOf(active.id)} was not moved.`,
  };

  const moveTo = (from: number, to: number) => {
    if (to < 0 || to >= total) return;
    setArrangement((current) => arrayMove(current, from, to));
    setResults(null);
    setAnnouncement(
      `Moved ${block.items[arrangement[from] as number]} to position ${to + 1} of ${total}.`,
    );
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id)
      moveTo(arrangement.indexOf(indexOf(active.id)), arrangement.indexOf(indexOf(over.id)));
  };

  const check = () => {
    setResults(arrangement.map((item, position) => block.items[item] === block.items[position]));
    setChecks((count) => count + 1);
  };

  const reset = () => {
    setArrangement(initial);
    setResults(null);
    setAnnouncement("Reset to the starting order.");
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "To pick up an item, press Space. Use the up and down arrow keys to move it. Press Space to drop it, or Escape to cancel. You can also use the move buttons.",
        },
      }}
      onDragEnd={onDragEnd}
    >
      <div className="flex flex-col gap-4">
        <SortableContext items={arrangement.map(itemId)} strategy={verticalListSortingStrategy}>
          <ol role="list" className="flex flex-col gap-2">
            {arrangement.map((item, position) => (
              <Row
                key={item}
                id={item}
                position={position + 1}
                total={total}
                text={block.items[item] as string}
                result={results ? (results[position] ?? null) : null}
                checkCount={checks}
                onMove={(direction) => moveTo(position, position + direction)}
              />
            ))}
          </ol>
        </SortableContext>
        <Controls
          onCheck={check}
          onReset={reset}
          correct={results ? results.filter(Boolean).length : null}
          total={total}
          announcement={announcement}
        />
      </div>
    </DndContext>
  );
}
