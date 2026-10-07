import type { KeyboardCoordinateGetter } from "@dnd-kit/core";

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** The parts of dnd-kit's keyboard context this needs, so it can be tested without a browser. */
export interface TargetContext {
  /** Drop targets in page order, with their boxes. */
  targets: { id: string | number; rect: Box }[];
  /** The box of the item being dragged. */
  collisionRect: Box | null;
}

const STEP: Record<string, 1 | -1> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

const centerOf = (box: Box) => ({ x: box.left + box.width / 2, y: box.top + box.height / 2 });

/**
 * Where the dragged item should jump for an arrow key press: to the next or previous drop target.
 * Returns the top-left corner to move to, or undefined when the key does nothing.
 */
export function nextTarget(
  key: string,
  { targets, collisionRect }: TargetContext,
): { x: number; y: number } | undefined {
  const step = STEP[key];
  if (step === undefined || targets.length === 0 || !collisionRect) return undefined;

  const here = centerOf(collisionRect);
  let current = 0;
  let best = Infinity;
  targets.forEach(({ rect }, index) => {
    const center = centerOf(rect);
    const distance = (center.x - here.x) ** 2 + (center.y - here.y) ** 2;
    if (distance < best) {
      best = distance;
      current = index;
    }
  });

  const target = targets[Math.min(Math.max(current + step, 0), targets.length - 1)];
  return target ? { x: target.rect.left, y: target.rect.top } : undefined;
}

/** Keyboard sensor helper for the match and label modes: the arrow keys jump between drop targets. */
export const jumpBetweenTargets: KeyboardCoordinateGetter = (event, { context }) => {
  const { droppableContainers, droppableRects, collisionRect } = context;
  const targets = droppableContainers
    .getEnabled()
    .filter((container) => container.node.current && droppableRects.get(container.id))
    .sort((a, b) => {
      const position = a.node.current?.compareDocumentPosition(b.node.current as Node) ?? 0;
      return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    })
    .map((container) => ({ id: container.id, rect: droppableRects.get(container.id) as Box }));

  const coordinates = nextTarget(event.code, { targets, collisionRect });
  if (coordinates) event.preventDefault();
  return coordinates;
};
