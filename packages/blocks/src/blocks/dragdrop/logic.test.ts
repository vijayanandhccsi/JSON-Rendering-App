import { describe, expect, it } from "vitest";
import { grade, place, poolChips, remove, slotOf } from "./board";
import { nextTarget } from "./keyboard";
import { hashString, shuffledOrder } from "./shuffle";

describe("shuffledOrder", () => {
  it("is a permutation of 0..n-1", () => {
    for (const count of [1, 2, 3, 5, 10]) {
      expect([...shuffledOrder(count, 7)].sort((a, b) => a - b)).toEqual(
        Array.from({ length: count }, (_, i) => i),
      );
    }
  });

  it("is the same every time for the same seed, and differs between seeds", () => {
    expect(shuffledOrder(8, 123)).toEqual(shuffledOrder(8, 123));
    expect(shuffledOrder(8, 1)).not.toEqual(shuffledOrder(8, 2));
  });

  it("never starts in the solved order when there are two or more items", () => {
    for (let seed = 0; seed < 500; seed++) {
      for (const count of [2, 3, 4]) {
        expect(shuffledOrder(count, seed)).not.toEqual(Array.from({ length: count }, (_, i) => i));
      }
    }
  });

  it("hashes equal text equally and different text differently", () => {
    expect(hashString("abc")).toBe(hashString("abc"));
    expect(hashString("abc")).not.toBe(hashString("abd"));
  });
});

describe("placement rules", () => {
  it("places a chip in an empty slot", () => {
    expect(place([null, null], 1, 0)).toEqual([1, null]);
  });

  it("moves a chip that was in another slot", () => {
    expect(place([1, null], 1, 1)).toEqual([null, 1]);
  });

  it("sends the old chip back to the pool when a slot is replaced", () => {
    const placed = place([0, null], 1, 0);
    expect(placed).toEqual([1, null]);
    expect(poolChips(2, placed)).toEqual([0]);
  });

  it("removes a chip from a slot", () => {
    expect(remove([0, 1], 0)).toEqual([null, 1]);
  });

  it("finds where a chip is", () => {
    expect(slotOf([null, 2], 2)).toBe(1);
    expect(slotOf([null, 2], 0)).toBeNull();
  });

  it("lists pool chips in their original order", () => {
    expect(poolChips(4, [2, null, 0])).toEqual([1, 3]);
  });

  it("grades by text, so repeated answers work, and counts empty slots as wrong", () => {
    const chips = ["443", "22", "443"];
    expect(grade([2, 1, null], chips, ["443", "22", "443"])).toEqual([true, true, false]);
    expect(grade([1, null, 0], chips, ["443", "22", "443"])).toEqual([false, false, true]);
  });
});

describe("keyboard targets", () => {
  const box = (left: number, top: number) => ({ left, top, width: 100, height: 40 });
  const targets = [
    { id: "slot-0", rect: box(0, 0) },
    { id: "slot-1", rect: box(0, 100) },
    { id: "slot-2", rect: box(0, 200) },
  ];

  it("moves to the next target on ArrowDown and ArrowRight, and the previous on ArrowUp and ArrowLeft", () => {
    expect(nextTarget("ArrowDown", { targets, collisionRect: box(0, 0) })).toEqual({
      x: 0,
      y: 100,
    });
    expect(nextTarget("ArrowRight", { targets, collisionRect: box(0, 100) })).toEqual({
      x: 0,
      y: 200,
    });
    expect(nextTarget("ArrowUp", { targets, collisionRect: box(0, 100) })).toEqual({ x: 0, y: 0 });
    expect(nextTarget("ArrowLeft", { targets, collisionRect: box(0, 200) })).toEqual({
      x: 0,
      y: 100,
    });
  });

  it("starts from the nearest target when the item is somewhere else", () => {
    expect(nextTarget("ArrowDown", { targets, collisionRect: box(300, 210) })).toEqual({
      x: 0,
      y: 200,
    });
  });

  it("stays on the first and last target at the ends", () => {
    expect(nextTarget("ArrowUp", { targets, collisionRect: box(0, 0) })).toEqual({ x: 0, y: 0 });
    expect(nextTarget("ArrowDown", { targets, collisionRect: box(0, 200) })).toEqual({
      x: 0,
      y: 200,
    });
  });

  it("ignores other keys and empty boards", () => {
    expect(nextTarget("a", { targets, collisionRect: box(0, 0) })).toBeUndefined();
    expect(nextTarget("ArrowDown", { targets: [], collisionRect: box(0, 0) })).toBeUndefined();
    expect(nextTarget("ArrowDown", { targets, collisionRect: null })).toBeUndefined();
  });
});
