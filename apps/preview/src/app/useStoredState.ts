import { useCallback, useState } from "react";
import { readStored, writeStored } from "../lib/storage";

/** State that is remembered in localStorage. */
export function useStoredState(key: string, fallback: string) {
  const [value, setValue] = useState(() => readStored(key) ?? fallback);
  const update = useCallback(
    (next: string) => {
      setValue(next);
      writeStored(key, next);
    },
    [key],
  );
  return [value, update] as const;
}
