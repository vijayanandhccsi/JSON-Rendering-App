import { useCallback, useMemo, useState } from "react";
import { grade, place, poolChips, remove, slotOf } from "./board";

/** State and actions shared by the match and label modes. */
export function usePlacement(chips: readonly string[], answers: readonly string[]) {
  const empty = useMemo(() => answers.map(() => null), [answers]);
  const [placed, setPlaced] = useState<(number | null)[]>(empty);
  const [selected, setSelected] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[] | null>(null);
  const [checks, setChecks] = useState(0);
  const [announcement, setAnnouncement] = useState("");

  const placeChip = useCallback(
    (chip: number, slot: number, slotName: string) => {
      setPlaced((current) => place(current, chip, slot));
      setSelected(null);
      setResults(null);
      setAnnouncement(`Placed ${chips[chip]} in ${slotName}.`);
    },
    [chips],
  );

  const removeFromSlot = useCallback(
    (slot: number) => {
      setPlaced((current) => {
        const chip = current[slot];
        if (chip !== null && chip !== undefined)
          setAnnouncement(`Returned ${chips[chip]} to the choices.`);
        return remove(current, slot);
      });
      setResults(null);
    },
    [chips],
  );

  const returnChip = useCallback(
    (chip: number) => {
      setPlaced((current) => {
        const slot = slotOf(current, chip);
        return slot === null ? current : remove(current, slot);
      });
      setResults(null);
      setAnnouncement(`Returned ${chips[chip]} to the choices.`);
    },
    [chips],
  );

  const toggleSelected = useCallback(
    (chip: number) => setSelected((current) => (current === chip ? null : chip)),
    [],
  );

  const check = useCallback(() => {
    setResults(grade(placed, chips, answers));
    setChecks((count) => count + 1);
    setSelected(null);
  }, [placed, chips, answers]);

  const reset = useCallback(() => {
    setPlaced(empty);
    setSelected(null);
    setResults(null);
    setAnnouncement("Cleared. All items are back in the choices.");
  }, [empty]);

  return {
    placed,
    selected,
    results,
    checks,
    announcement,
    pool: poolChips(chips.length, placed),
    placeChip,
    removeFromSlot,
    returnChip,
    toggleSelected,
    check,
    reset,
  };
}

export type Placement = ReturnType<typeof usePlacement>;
