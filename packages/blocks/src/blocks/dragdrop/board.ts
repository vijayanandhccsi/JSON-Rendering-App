/**
 * Placement rules for the match and label modes.
 * `placed[slot]` is the index of the chip in that slot, or null when the slot is empty.
 */
export type Placed = readonly (number | null)[];

/** Puts a chip in a slot. A chip already in another slot moves; a chip already in this slot goes back to the pool. */
export function place(placed: Placed, chip: number, slot: number): (number | null)[] {
  const next = placed.map((value) => (value === chip ? null : value));
  next[slot] = chip;
  return next;
}

/** Empties a slot, sending its chip back to the pool. */
export function remove(placed: Placed, slot: number): (number | null)[] {
  return placed.map((value, index) => (index === slot ? null : value));
}

/** Where a chip is: the slot index, or null when it is in the pool. */
export function slotOf(placed: Placed, chip: number): number | null {
  const slot = placed.indexOf(chip);
  return slot === -1 ? null : slot;
}

/** Chips not in any slot, in their original order. */
export function poolChips(chipCount: number, placed: Placed): number[] {
  return Array.from({ length: chipCount }, (_, i) => i).filter((chip) => !placed.includes(chip));
}

/** For each slot: is the chip in it the right one? Compares text, so repeated answers work. An empty slot is wrong. */
export function grade(
  placed: Placed,
  chips: readonly string[],
  answers: readonly string[],
): boolean[] {
  return answers.map((answer, slot) => {
    const chip = placed[slot];
    return chip !== null && chip !== undefined && chips[chip] === answer;
  });
}
